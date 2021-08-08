import { ChildThreadInfoInterface } from "../interfaces/models/ChildThreadInfoInterface";
import { ChildThreadReadResult } from "../interfaces/models/ChildThreadReadResult";
import { CpuHelper } from "../helpers/CpuHelper";
import { FileInfoHelper } from "../helpers/FileInfoHelper";
import { ParserCommandInterface } from "../interfaces/commands/ParserCommandInterface";
import { ParserCommand } from "./ParserCommand";
import { PortfolioInterface } from "../interfaces/models/PortfolioInterface";
import { PortfolioService } from "../services/PorfolioService";
import { TransactionParseOptionsInterface } from "../interfaces/commands/TransactionParseOptionsInterface";
import { fork } from 'child_process';
import { join } from "path";
import { SingleThreadParser } from "./SingleThreadParser";

/**
 * Divide file into multiple segments.
 * For each segment, fork a child process to process it, send result back to this process.
 * Combine the results from child and return final result.
 */
export class MultiThreadParserParent extends ParserCommand implements ParserCommandInterface {
  /**
   * Minimum file that worth processing parralel. If not meet, auto-switch to single-thread mode.
   */
  protected readonly MIN_FILE_SIZE_FOR_MULTITHREAD = 512 * 1024;

  /**
   * Helper to read first line of file, which contain csv headers.
   */
  protected fileInfoHelper: FileInfoHelper;

  /**
   * Count of active worker threads. When this is back to 0, we know all workers are completed.
   */
  protected threadRunningCount = 0;

  /**
   * Data to send to worker threads
   */
  protected childThreadsInfo: ChildThreadInfoInterface[] = [];

  /**
   * Result received from worker threads
   */
  protected childThreadResults: ChildThreadReadResult[] = [];

  /**
   * Inherite all basic command services from parent class
   */
  constructor() {
    super();
    this.fileInfoHelper = new FileInfoHelper();
  }

  /**
   * Collect information and dispatch data to worker threads
   */
  protected async parse(): Promise<void> {
    const fileSize = this.fileInfoHelper.getFileSize(this.fileName);
    if (fileSize < this.MIN_FILE_SIZE_FOR_MULTITHREAD) {
      return this.runSingleThread(); // If file is too small for segmentation, just run it single thread
    }

    console.time('Duration');
    // TODO Remove this after demo
    console.log('Please wait ~10 seconds for processing 30,000,000 transactions.')

    // Contain fileLine:string and the start position for next line
    const firstLineInfo = await this.fileInfoHelper.readFirstLine(this.fileName);
    const csvHeaders = this.getCsvHeaders(firstLineInfo.firstLine);

    let numThread = new CpuHelper().getOptimizedThreadNumber();
    // Segment size in bytes that each worker thread will read and process
    const segmentSize = Math.ceil(fileSize / numThread);
    const childModule = join(__dirname, join('multithreads', 'workerParser.js'));

    let startPos = firstLineInfo.nextLinePos;
    for (let i = 0; i < numThread; i++) {
      const childThread = fork(childModule);

      const start = startPos;
      let end: number = start + segmentSize;
      // If it is last segment, read to end of file
      if (i === numThread - 1) {
        // Just to double sure that we read entire file by last worker
        end = Number.MAX_SAFE_INTEGER;
      }

      // Each thread has its own address space,
      // but we still clone this object instead of send by reference 
      // to make sure no weird thing happen.
      const parseOptions: TransactionParseOptionsInterface = JSON.parse(JSON.stringify(this.options));
      const childThreadInfo: ChildThreadInfoInterface = {
        instance: childThread,
        index: i,
        readOptions: {
          fileName: this.fileName,
          index: i,
          start,
          end,
          csvHeaders,
          parseOptions
        }
      }
      startPos = end + 1; // Next character after previous segment

      this.childThreadsInfo.push(childThreadInfo);
      childThread.on('message', this.onChildResult.bind(this));
      childThread.send(childThreadInfo.readOptions);
      this.threadRunningCount += 1;
    }
  }

  /**
   * Receive segment result from child worker.
   * If all workers have finished, sum up the final portfolio and show.
   * 
   * @param {ChildThreadReadResult} result
   */
  protected onChildResult(result: ChildThreadReadResult) {
    this.childThreadsInfo[result.index]['instance'].kill();

    this.childThreadResults[result.index] = result;
    this.threadRunningCount -= 1;
    if (this.threadRunningCount === 0) {
      const { portfolio, count } = this.sumAllSegments(this.childThreadResults);

      this.showPortfolioInFiat(portfolio);

      console.log(`Total transactions ${count}`);
      console.timeEnd('Duration');
    }
  }

  /**
   * Sum all the portfolios from child workers
   * 
   * @param  {ChildThreadReadResult[]} childResults
   * @returns { portfolio: PortfolioInterface, count: number }
   */
  protected sumAllSegments(childResults: ChildThreadReadResult[]): { portfolio: PortfolioInterface, count: number } {
    let { portfolio, count } = this.joinSegments(childResults);

    childResults.forEach((result) => {
      portfolio = this.portfolioService.sumPortfolio(portfolio, result.portfolio!);
      count += result.transactionCount;
    });

    return { portfolio, count };
  }

  /**
   * Join last line of previous segment to first line of next segment,
   * to create a transaction. Process that transaction and save to a portfolio.
   * 
   * @param {ChildThreadReadResult[]} childResults
   * @returns { portfolio: PortfolioInterface, count: number }
   */
  protected joinSegments(childResults: ChildThreadReadResult[]): { portfolio: PortfolioInterface, count: number } {
    const portfolioService = new PortfolioService();
    portfolioService.createFilterFromOptions(this.options);

    for (let i = 0; i < childResults.length; i++) {
      // Add first line of first segment. No need to join.
      if (i === 0) {
        this.addTransactionToPortfolio(childResults[i].firstLine, portfolioService);
        continue;
      }

      const joinLine = childResults[i - 1].lastLine + childResults[i].firstLine;
      if (joinLine.split(',').length > 4) {
        // Congratulation! We have a sharp cut here
        // Previous segment and this segment is cut right at the CR character
        // both previous lastLine and this firstLine is a complete transaction.
        // Add both of them.
        this.addTransactionToPortfolio(childResults[i - 1].lastLine, portfolioService);
        this.addTransactionToPortfolio(childResults[i].firstLine, portfolioService);
      } else {
        this.addTransactionToPortfolio(joinLine, portfolioService);
      }

      // Last line of last segment
      if (i === childResults.length - 1) {
        this.addTransactionToPortfolio(childResults[i].lastLine, portfolioService);
      }
    }

    return {
      portfolio: portfolioService.getPortfolio(),
      count: portfolioService.getTransactionCount(),
    };
  }

  /**
   * Parse transaction string and process it to portfolio
   * 
   * @param line 
   * @param portfolioService 
   */
  protected addTransactionToPortfolio(line: string, portfolioService: PortfolioService) {
    const trans = this.csvLineReader.readTransaction(line);
    portfolioService.processTransaction(trans);
  }

  protected getCsvHeaders(firstLine: string): string[] {
    const csvHeaders = firstLine.split(',');
    this.csvLineReader.csvColumnHeaders = csvHeaders;

    return csvHeaders;
  }

  /**
   * Switch to run in single thread mode, in case file is too small for segmentation.
   */
  protected runSingleThread() {
    const command = new SingleThreadParser();
    command.run();
  }
}

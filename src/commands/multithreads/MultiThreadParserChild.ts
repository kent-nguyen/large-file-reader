import { ChildThreadReadOptions } from "../../interfaces/models/ChildThreadReadOptions";
import { ParserCommand } from "../ParserCommand";
import { createReadStream } from 'fs';
import readline from 'readline';
import { ChildThreadReadResult } from "../../interfaces/models/ChildThreadReadResult";

/**
 * Receive `start` and `end` position from parent thread, 
 * read file segment and parse data,
 * send result back to parent.
 */
export class MultiThreadParserChild extends ParserCommand {
  // We init readOptions in onParentMessage and it is always has value
  protected readOptions!: ChildThreadReadOptions;

  /**
   * Number of line this child has processed so far
   * 
   * @var {string}
   */
  protected lineCount = 0;

  /**
   * Contain the first line (string) this child has read in this stream
   * 
   * @var {string}
   */
  protected firstLine = '';

  /**
   * Contain the lastest line we have read in this stream.
   * If end-of-stream is reached, this is the last line.
   *
   * @var {string}
   */
  protected lastLine = '';

  /**
   * Contain the previous line of the lastest line.
   * This is a completed line (without cut), and it's safe to process it as a transaction.
   *
   * @var {string}
   */
  protected secondLastLine = '';

  /**
   * Received {start, end} positions from parent.
   * Save information from parent, kick-off the read-file process.
   * 
   * @param {ChildThreadReadOptions} readOptions
   */
  public onParentMessage(readOptions: ChildThreadReadOptions) {
    this.readOptions = readOptions;
    this.fileName = readOptions.fileName;
    this.options = readOptions.parseOptions;
    this.portfolioService.createFilterFromOptions(this.options);
    this.csvLineReader.csvColumnHeaders = readOptions.csvHeaders;

    this.parse();
  }

  /**
   * Start reading file line-by-line.
   * Bind the stream even handlers to this class methods.
   */
  protected parse(): void {
    const fileStream = createReadStream(this.fileName, {
      highWaterMark: 200,
      start: this.readOptions.start,
      end: this.readOptions.end ? this.readOptions.end : undefined
    });
    const readLineStream = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity, // Make it work for both CRLF and LF line
    });

    readLineStream.on('line', this.onReadLineData.bind(this));
    readLineStream.on('error', this.onReadLineError.bind(this));
    readLineStream.on('close', this.onReadLineEnd.bind(this));
  }

  /**
   * Parse one line of data.
   * 
   * @param {string} line 
   */
  protected onReadLineData(line: string) {
    if (this.lineCount === 0) {
      // If this is the first line, just store it
      // do not process it, because it may be just a half of line
      this.firstLine = line;
    } else if (this.lineCount === 1) {
      // Store it for the next coming line
      this.secondLastLine = line;
    } else { // count >= 2
      // Process the line previous current line.
      // It is for sure a complete line.
      const transaction = this.csvLineReader.readTransaction(this.secondLastLine);
      this.portfolioService.processTransaction(transaction);

      // If after this line we reach end of stream, this line is the last line.
      this.lastLine = line;

      // If we have another line coming, this line is the second-last line, a full transaction line
      this.secondLastLine = line;
    }

    this.lineCount++;
  }

  /**
   * Handler when end-of-file is reached.
   * Send result back to parent process.
   */
  protected onReadLineEnd() {
    const portfolio = this.portfolioService.getPortfolio();
    const result: ChildThreadReadResult = {
      index: this.readOptions.index,
      portfolio,
      firstLine: this.firstLine,
      lastLine: this.lastLine,
      transactionCount: this.portfolioService.getTransactionCount(),
      lineCount: this.lineCount
    };

    // Send result back to parent
    // Workaround typescript compiler issue
    (<any>process).send(result);
  }

  /**
   * @param {Error} error 
   */
  protected onReadLineError(error: Error) {
    console.error('An error occurred', error.message);
  }
}

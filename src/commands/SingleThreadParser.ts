import { ParserCommandInterface } from "../interfaces/commands/ParserCommandInterface";
import { ParserCommand } from "./ParserCommand";
import { createReadStream } from 'fs';
import readline from 'readline';

export class SingleThreadParser extends ParserCommand implements ParserCommandInterface {
  protected lineCount = 0;

  constructor() {
    super();
  }

  /**
   * Read file stream and bind stream events to processing methods
   */
  protected parse() {
    console.time('Duration');
    const fileStream = createReadStream(this.fileName, {
      highWaterMark: this.options.bufferSize,
    });

    const readLineStream = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity, // Make work for both CRLF and LF line end
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
      this.csvLineReader.csvColumnHeaders = line.split(',');
      this.lineCount++;

      return;
    }

    const transaction = this.csvLineReader.readTransaction(line);
    this.portfolioService.processTransaction(transaction);
    this.lineCount++;
  }

  /**
   * @param {Error} error 
   */
  protected onReadLineError(error: Error) {
    console.error('An error occurred', error.message);
  }

  /**
   * Handler when end-of-file is reached.
   */
  protected onReadLineEnd() {
    const portfolio = this.portfolioService.getPortfolio();

    this.showPortfolioInFiat(portfolio);
    console.log('Total transactions ' + this.portfolioService.getTransactionCount());
    console.timeEnd('Duration');
  }
}

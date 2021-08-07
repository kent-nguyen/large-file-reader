import { ArgumentParseHelper } from "../helpers/ArgumentParseHelper";
import { ParserCommandInterface } from "../interfaces/commands/ParserCommandInterface";
import { TransactionParseOptionsInterface } from "../interfaces/commands/TransactionParseOptionsInterface";
import { CsvLineReader } from "../services/CsvLineReader";
import { PortfolioService } from "../services/PorfolioService";

export abstract class ParserCommand implements ParserCommandInterface {
  readonly DEFAULT_BUFFER_SIZE = 4 * 1024 * 1024;

  /**
   * File to be parsed
   */
  protected fileName: string = '';

  /**
   * Options for selecting single token or single date
   */
  protected options: TransactionParseOptionsInterface = {};

  /**
   * Helper class to parse arguments into class member
   */
  protected argumentParserHelper: ArgumentParseHelper;

  protected csvLineReader: CsvLineReader;

  protected portfolioService: PortfolioService;

  constructor() {
    this.argumentParserHelper = new ArgumentParseHelper();
    this.csvLineReader = new CsvLineReader();
    this.portfolioService = new PortfolioService();
  }

  /**
   * Entry point of this parser command
   * 
   * Parse data file and return result as JSON string.
   * 
   * @param {string[]} args Format: ["filename", "--token", "BTC", "--date", "YYYY-MM-DD", "--opt1", "val1"] 
   * @returns {string}
   */
  run(args: string[] = []): void {
    this.getArguments(args);
    this.portfolioService.createFilterFromOptions(this.options);

    return this.parse();
  }

  /**
   * Set fileName and options from argument
   * 
   * @param {string[]} args 
   * @returns void
   */
  protected getArguments(args: string[]) {
    const { fileName, options } = this.argumentParserHelper.getArguments(args);

    this.fileName = fileName; // First argument
    this.options = options;

    if (!this.options.bufferSize) {
      this.options.bufferSize = this.DEFAULT_BUFFER_SIZE;
    }
  }

  /**
   * Read and parse the file
   */
  protected abstract parse(): void;
}

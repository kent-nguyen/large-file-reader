import { ArgumentParseHelper } from "../helpers/ArgumentParseHelper";
import { ParserCommandInterface } from "../interfaces/commands/ParserCommandInterface";
import { TransactionParseOptionsInterface } from "../interfaces/commands/TransactionParseOptionsInterface";
import { PortfolioInterface } from "../interfaces/models/PortfolioInterface";
import { CsvLineReader } from "../services/CsvLineReader";
import { ExchangeRateService } from "../services/ExchangeRateService";
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
   * Helper class to parse CLI arguments into class member
   */
  protected argumentParserHelper: ArgumentParseHelper;

  /**
   * For parsing one line of csv file into our data model
   */
  protected csvLineReader: CsvLineReader;

  /**
   * For processing withdrawal, deposit transactions
   */
  protected portfolioService: PortfolioService;

  /**
   * For converting balances to fiats portfolio
   */
  protected exchangeRateService: ExchangeRateService;

  constructor() {
    this.argumentParserHelper = new ArgumentParseHelper();
    this.csvLineReader = new CsvLineReader();
    this.portfolioService = new PortfolioService();
    this.exchangeRateService = new ExchangeRateService();
  }

  /**
   * Entry point of this parser command
   * 
   * Parse data file and return result as JSON string.
   * 
   * @param {string[]} args Format: ["filename", "--token", "BTC", "--date", "YYYY-MM-DD", "--opt1", "val1"] 
   * @returns {string}
   */
  async run(args: string[] = []): Promise<void> {
    this.getArguments(args);
    this.portfolioService.createFilterFromOptions(this.options);

    await this.parse();
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
   * Retrieve fiats exchange rates, and show the portfolio
   * 
   * @param {PortfolioInterface} portfolio
   * @param {string[]} fiats List of fiat we want to convert to 
   */
  protected async showPortfolioInFiat(
    portfolio: PortfolioInterface,
    fiats: string[] = ['USD']
  ) {
    const fiatPortfolio = await this.exchangeRateService.convertPortfolioToFiat(portfolio);

    console.log(JSON.stringify(fiatPortfolio, null, 2)); // Pretty print with 2 spaces
  }

  /**
   * Read and parse the file
   */
  protected abstract parse(): void;
}

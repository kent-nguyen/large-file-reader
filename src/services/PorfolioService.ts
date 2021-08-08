import { TimestampHelper } from "../helpers/TimestampHelper";
import { TransactionParseOptionsInterface } from "../interfaces/commands/TransactionParseOptionsInterface";
import { PortfolioInterface } from "../interfaces/models/PortfolioInterface";
import { TransactionInterface, TransactionType } from "../interfaces/models/TransactionInterface";
import { TransactionFilterInterface } from "../interfaces/services/TransactionFilterInterface";
import { TimestampTransactionFilter } from "./filters/TimestampTransactionFilter";
import { TokenTimestampTransactionFilter } from "./filters/TokenTimestampTransactionFilter";
import { TokenTransactionFilter } from "./filters/TokenTransactionFilter";

/**
 * Calculate portfolio from transactions.
 */
export class PortfolioService {
  /**
   * Contain balance of tokens
   * 
   * Portfolio initialized as empty, no token inside.
   */
  protected portfolio: PortfolioInterface = {};

  /**
   * Filter by token, or date or both
   */
  protected transactionFilter: TransactionFilterInterface | null = null;

  /**
   * Number of transaction we have added so far
   */
  protected transactionCount = 0;

  /**
   * Create filter from user options, to accept only token or time user interest.
   * 
   * @param {TransactionParseOptionsInterface} options
   */
  public createFilterFromOptions(options: TransactionParseOptionsInterface) {
    // This helper is used only once here
    const timestampHelper = new TimestampHelper();

    if (options.token) {
      if (options.date) {
        const timestamp = timestampHelper.convertDateToTimestamp(options.date);
        this.transactionFilter = new TokenTimestampTransactionFilter(options.token, timestamp);
      } else {
        this.transactionFilter = new TokenTransactionFilter(options.token);
      }
    } else if (options.date) {
      const timestamp = timestampHelper.convertDateToTimestamp(options.date);
      this.transactionFilter = new TimestampTransactionFilter(timestamp);
    }
  }

  /**
   * Increase or decrease token balance base on transaction type
   * 
   * @param {TransactionInterface} transaction
   */
  public processTransaction(transaction: TransactionInterface) {
    // Ignore transaction if we filter filter and it is filter out
    if (this.transactionFilter && !this.transactionFilter.canProcess(transaction)) {
      return;
    }

    const token = transaction.token;

    // Init token if not exist
    if (!this.portfolio[token]) {
      this.portfolio[token] = 0.0;
    }

    // Use else if to be safe if in future we have another type of transaction
    if (transaction.transactionType === TransactionType.DEPOSIT) {
      this.portfolio[token] += transaction.amount;
    } else if (transaction.transactionType === TransactionType.WITHDRAWAL) {
      this.portfolio[token] -= transaction.amount;
    }

    this.transactionCount++;
  }

  /**
   * @returns {PortfolioInterface}
   */
  public getPortfolio() {
    return this.portfolio;
  }

  /**
   * @returns {number}
   */
  public getTransactionCount() {
    return this.transactionCount;
  }

  /**
   * Add two portfolios and return the new sum portfolio
   * 
   * @param {PortfolioInterface} pA
   * @param {PortfolioInterface} pB
   */
  public sumPortfolio(pA: PortfolioInterface, pB: PortfolioInterface): PortfolioInterface {
    // Merge all possible tokens
    let merged: PortfolioInterface = { ...pA, ...pB };

    for (let token in merged) {
      merged[token] = (pA[token] ?? 0) + (pB[token] ?? 0);
    }

    return merged;
  }
}

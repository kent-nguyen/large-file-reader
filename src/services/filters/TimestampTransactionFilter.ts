import { TransactionInterface } from "../../interfaces/models/TransactionInterface";
import { TransactionFilterInterface } from "../../interfaces/services/TransactionFilterInterface";

export class TimestampTransactionFilter implements TransactionFilterInterface {
  /**
   * The timestamp which this filter use to compare with transaction timestamp
   */
  protected timestamp: number;

  constructor(timestamp: number) {
    this.timestamp = timestamp;
  }

  /**
   * Allow transaction happen before this timestamp
   * 
   * @param {TransactionInterface} transaction
   * @returns {boolean}
   */
  canProcess(transaction: TransactionInterface): boolean {
    return transaction.timestamp < this.timestamp;
  }
}

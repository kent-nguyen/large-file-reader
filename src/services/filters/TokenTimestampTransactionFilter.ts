import { TransactionInterface } from "../../interfaces/models/TransactionInterface";
import { TransactionFilterInterface } from "../../interfaces/services/TransactionFilterInterface";
import { TokenTransactionFilter } from "./TokenTransactionFilter";

export class TokenTimestampTransactionFilter extends TokenTransactionFilter implements TransactionFilterInterface {
  /**
   * The timestamp which this filter use to compare with transaction timestamp
   */
  protected timestamp: number;

  constructor(token: string, timestamp: number) {
    super(token);
    this.timestamp = timestamp;
  }

  /**
   * Allow transaction happen before this timestamp, and with matching token
   * 
   * @param {TransactionInterface} transaction
   * @returns {boolean}
   */
  canProcess(transaction: TransactionInterface): boolean {
    return super.canProcess(transaction) && transaction.timestamp < this.timestamp;
  }
}

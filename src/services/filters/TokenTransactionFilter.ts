import { TransactionInterface } from "../../interfaces/models/TransactionInterface";
import { TransactionFilterInterface } from "../../interfaces/services/TransactionFilterInterface";

export class TokenTransactionFilter implements TransactionFilterInterface {
  /**
   * The token which this filter allowes to process
   */
  protected token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * @param {TransactionInterface} transaction
   * @returns boolean
   */
  canProcess(transaction: TransactionInterface): boolean {
    return transaction.token === this.token;
  }
}

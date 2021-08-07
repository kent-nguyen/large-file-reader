import { TransactionInterface } from "../models/TransactionInterface";

export interface TransactionFilterInterface {
  canProcess(transaction: TransactionInterface): boolean;
}

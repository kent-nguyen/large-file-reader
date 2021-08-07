
export interface TransactionInterface {

  timestamp: number;

  transactionType: TransactionType;

  token: string;

  amount: number;
}

export enum TransactionType {
  DEPOSIT,
  WITHDRAWAL,
}

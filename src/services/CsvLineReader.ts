import { TransactionInterface, TransactionType } from "../interfaces/models/TransactionInterface";

/**
 * When ever CSV file data structure is change,
 * this class is the only place needed to be updated.
 */
export class CsvLineReader {
  /**
   * Given a transaction field, get the column index in csv file.
   * 
   * Eg: timestamp => 0, 'transactionType' => 1, 'token' => 2, 'amount' => 3 
   */
  protected fieldIndexes: { [field: string]: number } = {};

  /**
   * Contain column names of current csv file.
   * 
   * Eg: ['timestamp', 'transaction_type', 'token', 'amount']
   */
  protected csvColumnNames: string[] = [];

  /**
   * (Update this field when headers in CSV file are changed)
   * Map from our internal Transaction model properties to CSV file headers.
   * This way allowes flexibility if in future user would like to change csv header name.
   */
  protected columnMap: { [column: string]: string } = {
    timestamp: 'timestamp',
    transactionType: 'transaction_type',
    token: 'token',
    amount: 'amount'
  }

  /**
   * Read one line of data and return transaction model
   * 
   * @param {string} line 
   * @returns {TransactionInterface}
   */
  readTransaction(line: string): TransactionInterface {
    const parts = line.split(',');

    // Convert from string to enum
    const strTransactionType: string = parts[this.fieldIndexes['transactionType']];
    const transactionType = TransactionType[strTransactionType as keyof typeof TransactionType];

    return {
      timestamp: parseInt(parts[this.fieldIndexes['timestamp']]),
      transactionType: transactionType,
      token: parts[this.fieldIndexes['token']],
      amount: parseFloat(parts[this.fieldIndexes['amount']]),
    }
  }

  set csvColumnMap(columnMap: { [column: string]: string }) {
    this.columnMap = columnMap;
    // Re-map the column index
    this.setFieldIndexes();
  }

  set csvColumnHeaders(csvHeaders: string[]) {
    this.csvColumnNames = csvHeaders;
    // Re-map the column index
    this.setFieldIndexes();
  }

  protected setFieldIndexes() {
    // Typescript does not have a way to retrieve field names from an interface
    const fields = ['timestamp', 'transactionType', 'token', 'amount'];

    for (const field of fields) {
      const csvColumnName = this.columnMap[field];
      const csvColumnIndex = this.csvColumnNames.indexOf(csvColumnName);
      if (csvColumnIndex === -1) {
        throw new Error('Csv file has unrecognize column name');
      }

      this.fieldIndexes[field] = csvColumnIndex;
    }
  }
}

import { TransactionParseOptionsInterface } from "../commands/TransactionParseOptionsInterface";

export interface ChildThreadReadOptions {
  index: number; // Index of this own thread
  fileName: string;
  start: number; // Position in file to start reading
  end: number; // Position in file to stop reading
  csvHeaders: string[],
  parseOptions: TransactionParseOptionsInterface
}

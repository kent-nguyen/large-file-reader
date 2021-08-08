import { PortfolioInterface } from "./PortfolioInterface";

export interface ChildThreadReadResult {
  index: number;
  portfolio: PortfolioInterface;
  firstLine: string;
  lastLine: string;
  transactionCount: number;
  lineCount: number;
}

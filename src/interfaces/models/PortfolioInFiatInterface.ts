export interface PortfolioInFiatInterface {
  [token: string]: {
    balance: number;
    [fiat: string]: number;
  };
}

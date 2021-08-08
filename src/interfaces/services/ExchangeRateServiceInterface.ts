import { ExchangeRateResponseInterface } from "../models/ExchangeRateResponseInterface";
import { PortfolioInFiatInterface } from "../models/PortfolioInFiatInterface";
import { PortfolioInterface } from "../models/PortfolioInterface";

/**
 * General interface for exchange rate service.
 * In case we want to implement other service for other exchange rate api.
 */
export interface ExchangeRateServiceInterface {

  getExchangeRates(
    tokens: string[],
    fiats: string[]
  ): Promise<ExchangeRateResponseInterface>;

  convertPortfolioToFiat(
    portfolio: PortfolioInterface,
    fiats: string[]
  ): Promise<PortfolioInFiatInterface>;
}

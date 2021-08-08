import { ExchangeRateResponseInterface } from "../interfaces/models/ExchangeRateResponseInterface";
import { PortfolioInFiatInterface } from "../interfaces/models/PortfolioInFiatInterface";
import { PortfolioInterface } from "../interfaces/models/PortfolioInterface";
import { ExchangeRateServiceInterface } from "../interfaces/services/ExchangeRateServiceInterface";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export class ExchangeRateService implements ExchangeRateServiceInterface {
  readonly EXCHANGE_RATE_API_URL = 'https://min-api.cryptocompare.com/data';

  /**
   * Fetch exchange rates from API
   * 
   * @param tokens 
   * @param fiats 
   * @returns 
   */
  public async getExchangeRates(
    tokens: string[],
    fiats: string[] = ['USD']
  ): Promise<ExchangeRateResponseInterface> {

    // Should not cache response here, because user might want realtime rates
    const res = await axios.get(
      `${this.EXCHANGE_RATE_API_URL}/pricemulti`,
      {
        params: {
          fsyms: tokens.join(','),
          tsyms: fiats.join(','),
        },
        headers: {
          authorization: 'Apikey ' + process.env.CRYPTOCOMPARE_API_KEY
        }
      }
    );

    const rates: ExchangeRateResponseInterface = res.data;

    return rates;
  }

  public async convertPortfolioToFiat(
    portfolio: PortfolioInterface,
    fiats: string[] = ['USD']
  ): Promise<PortfolioInFiatInterface> {
    const tokens = Object.keys(portfolio);
    const rates = await this.getExchangeRates(tokens, fiats);

    const fiatPortfolio: PortfolioInFiatInterface = {};
    for (const token in portfolio) {
      fiatPortfolio[token] = { balance: portfolio[token] };
      for (const fiat of fiats) {
        fiatPortfolio[token][fiat] = rates[token][fiat] * portfolio[token];
      }
    }

    return fiatPortfolio;
  }
}

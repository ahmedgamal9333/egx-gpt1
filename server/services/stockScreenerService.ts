import { EGX_STOCKS_UNIVERSE } from '../data/egxStocks.js';

let cachedSyncVersion = -1;
let cachedStocksList: any[] = [];
let cachedScreenerList: any[] = [];

/**
 * The directory/search endpoint must never depend on historical candles or
 * precomputed recommendations. Missing market data must not hide listed
 * securities from search. Quotes and analysis stay explicitly unavailable
 * until verified provider data is present.
 */
export function getCachedStockBatches() {
  const stocksList = EGX_STOCKS_UNIVERSE.map((stock) => ({
    ticker: stock.ticker,
    yahooTicker: stock.yahooTicker,
    isin: stock.isin,
    nameAr: stock.nameAr,
    nameEn: stock.nameEn,
    sectorAr: stock.sectorAr,
    sectorEn: stock.sectorEn,
    industryAr: stock.industryAr,
    currency: stock.currency,
    index: stock.index,
    currentPrice: null,
    prevClose: null,
    changePct: null,
    volume: null,
    valueTraded: null,
    marketCapEgp: null,
    peRatio: null,
    pbRatio: null,
    dividendYield: null,
    fairValue: null,
    fairValueUpsidePct: null,
    rsi14: null,
    dailyTrend: 'NEUTRAL',
    quickScore: null,
    recommendationBadge: 'WAIT',
    recommendationBadgeAr: 'لا توجد بيانات سوق موثقة',
    quoteStatus: 'UNAVAILABLE',
    quoteStatusAr: 'السعر غير متاح — بانتظار مصدر موثوق'
  }));

  // Screener recommendations are disabled until verified market history is
  // available. Do not manufacture scores from static sample prices.
  cachedSyncVersion = 0;
  cachedStocksList = stocksList;
  cachedScreenerList = [];
  return { stocksList: cachedStocksList, screenerList: cachedScreenerList };
}

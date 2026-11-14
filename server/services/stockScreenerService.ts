import { EGX_STOCKS_UNIVERSE } from '../data/egxStocks.js';
import { MarketDataService } from './marketDataService.js';
import { TechnicalAnalysisEngine } from './technicalAnalysisService.js';
import { FundamentalAnalysisEngine } from './fundamentalAnalysisService.js';
import { FairValueValuationEngine } from './fairValueService.js';
import { LiveMarketSyncService } from './liveMarketSyncService.js';

let cachedSyncVersion = -1;
let cachedStocksList: any[] = [];
let cachedScreenerList: any[] = [];

export function getCachedStockBatches() {
  const currentVersion = LiveMarketSyncService.getSyncVersion();
  if (cachedSyncVersion === currentVersion && cachedStocksList.length > 0) {
    return { stocksList: cachedStocksList, screenerList: cachedScreenerList };
  }

  const stocksList: any[] = [];
  const screenerList: any[] = [];

  for (const stock of EGX_STOCKS_UNIVERSE) {
    const candles = MarketDataService.getHistoricalCandles(stock.ticker, '1D');
    const tech = TechnicalAnalysisEngine.calculate(candles);
    const fund = FundamentalAnalysisEngine.getFinancials(stock.ticker, stock.currentPrice);
    const fair = FairValueValuationEngine.calculate(
      stock.ticker,
      stock.currentPrice,
      fund.ratios.peRatio,
      fund.ratios.pbRatio,
      fund.ratios.dividendYield,
      fund.ratios.roe
    );

    let recBadge: 'STRONG_BUY' | 'BUY' | 'WAIT' | 'HOLD' | 'REDUCE' = 'WAIT';
    let recBadgeAr = 'ترقب (WAIT)';
    let recScreenerAr = 'ترقب وانتظار (WAIT)';
    const score = Math.round((tech.technicalScore * 0.45) + (fund.ratios.fundamentalQualityScore * 0.35) + 15);
    if (score >= 85 && fair.upsideDownsidePct >= 12) {
      recBadge = 'STRONG_BUY';
      recBadgeAr = 'شراء قوي (STRONG BUY)';
      recScreenerAr = 'شراء قوي (STRONG BUY)';
    } else if (score >= 72 && fair.upsideDownsidePct >= 4) {
      recBadge = 'BUY';
      recBadgeAr = 'شراء (BUY)';
      recScreenerAr = 'شراء للدخول (BUY)';
    } else if (score >= 55) {
      recBadge = 'HOLD';
      recBadgeAr = 'احتفاظ (HOLD)';
      recScreenerAr = 'احتفاظ (HOLD)';
    }

    const changePct = stock.prevClose > 0
      ? Number((((stock.currentPrice - stock.prevClose) / stock.prevClose) * 100).toFixed(2))
      : 0;

    stocksList.push({
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
      currentPrice: stock.currentPrice,
      prevClose: stock.prevClose,
      changePct,
      volume: stock.volume,
      valueTraded: stock.valueTraded,
      marketCapEgp: Math.round(stock.listedShares * stock.currentPrice * 1000000),
      peRatio: fund.ratios.peRatio,
      pbRatio: fund.ratios.pbRatio,
      dividendYield: fund.ratios.dividendYield,
      fairValue: fair.estimatedFairValue,
      fairValueUpsidePct: fair.upsideDownsidePct,
      rsi14: tech.rsi14,
      dailyTrend: tech.dailyTrend,
      quickScore: score,
      recommendationBadge: recBadge,
      recommendationBadgeAr: recBadgeAr
    });

    screenerList.push({
      ticker: stock.ticker,
      nameAr: stock.nameAr,
      nameEn: stock.nameEn,
      sectorAr: stock.sectorAr,
      sectorEn: stock.sectorEn,
      index: stock.index,
      currentPrice: stock.currentPrice,
      changePct,
      volume: stock.volume,
      valueTraded: stock.valueTraded,
      score,
      recommendation: recBadge,
      recommendationAr: recScreenerAr,
      peRatio: fund.ratios.peRatio,
      pbRatio: fund.ratios.pbRatio,
      roe: fund.ratios.roe,
      dividendYield: fund.ratios.dividendYield,
      rsi14: tech.rsi14,
      dailyTrend: tech.dailyTrend,
      fairValue: fair.estimatedFairValue,
      fairValueUpsidePct: fair.upsideDownsidePct,
      breakoutStatus: tech.breakoutStatus,
      relativeVolume: tech.relativeVolume
    });
  }

  cachedSyncVersion = currentVersion;
  cachedStocksList = stocksList;
  cachedScreenerList = screenerList;
  return { stocksList, screenerList };
}

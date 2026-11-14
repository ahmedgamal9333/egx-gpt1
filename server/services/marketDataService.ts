import { Candle } from './technicalAnalysisService.js';
import { EGX_STOCKS_UNIVERSE, getEGXStock } from '../data/egxStocks.js';
import { LiveMarketSyncService } from './liveMarketSyncService.js';
import { getEgidStockDirectory } from './egidMarketDataService.js';

export interface SourcePriceQuote {
  sourceName: string;
  price: number;
  currency: 'EGP' | 'USD';
  timestamp: string;
  status: 'LIVE' | 'DELAYED_15M' | 'END_OF_DAY' | 'VERIFIED';
  statusAr: string;
  latencyMs: number;
  reliabilityScore: number; // 0 to 100
}

export interface MultiSourceComparison {
  ticker: string;
  bestPrice: number;
  primarySource: string;
  quotes: SourcePriceQuote[];
  hasDiscrepancy: boolean;
  maxDiscrepancyPct: number;
  conflictResolved: boolean;
  notesAr: string;
}

export interface MarketMacroOverview {
  egx30: { value: number | null; change: number | null; changePct: number | null };
  egx70: { value: number | null; change: number | null; changePct: number | null };
  egx100: { value: number | null; change: number | null; changePct: number | null };
  totalTurnoverEgp: number | null;
  totalVolume: number | null;
  totalTrades: number | null;
  advancingStocks: number | null;
  decliningStocks: number | null;
  unchangedStocks: number | null;
  marketBreadthRatio: number | null;
  marketStatusAr: string;
  cbeData: {
    overnightLendingRate: number | null;
    overnightDepositRate: number | null;
    headlineInflationRate: number | null;
    coreInflationRate: number | null;
    fxUsdEgpRate: number | null;
    foreignReservesBillionUsd: number | null;
    lastCbeMeetingDate: string | null;
  };
  lastMarketSessionDate: string;
  lastSyncedAt: string;
  totalListedStocksCount: number;
  isMarketOpenNow: boolean;
}

export interface TradingViewChartSnapshot {
  symbol: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  recommendAll: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  ema9: number | null;
  ema20: number | null;
  ema50: number | null;
  ema100: number | null;
  ema200: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  bbUpper: number | null;
  bbLower: number | null;
  atr14: number | null;
  adx: number | null;
  adxPlusDI: number | null;
  adxMinusDI: number | null;
  stochK: number | null;
  stochD: number | null;
  mom: number | null;
  pivotClassic: {
    s3: number | null;
    s2: number | null;
    s1: number | null;
    p: number | null;
    r1: number | null;
    r2: number | null;
    r3: number | null;
  };
  pivotFib: {
    s2: number | null;
    s1: number | null;
    p: number | null;
    r1: number | null;
    r2: number | null;
  };
  high1M: number | null;
  low1M: number | null;
  high3M: number | null;
  low3M: number | null;
  high52W: number | null;
  low52W: number | null;
  fetchedAt: string;
}

const realCandleCache = new Map<string, { candles: Candle[]; fetchedAtMs: number }>();
const tvSnapshotCache = new Map<string, { snapshot: TradingViewChartSnapshot; fetchedAtMs: number }>();
const LIVE_DATA_TTL_MS = 5 * 60 * 1000;

export class MarketDataService {
  public static async getMarketOverview(): Promise<MarketMacroOverview> {
    const [stocks] = await Promise.all([getEgidStockDirectory()]);
    const priced = stocks.filter((stock: any) => typeof stock.currentPrice === 'number' && stock.currentPrice > 0);
    let advancing = 0;
    let declining = 0;
    let unchanged = 0;
    let totalTurnoverEgp = 0;
    let totalVolume = 0;
    let totalTrades = 0;
    for (const stock of priced as any[]) {
      const previous = typeof stock.prevClose === 'number' ? stock.prevClose : null;
      if (previous === null) continue;
      const diff = stock.currentPrice - previous;
      if (diff > 0.0001) advancing++;
      else if (diff < -0.0001) declining++;
      else unchanged++;
      totalTurnoverEgp += typeof stock.valueTraded === 'number' ? stock.valueTraded : 0;
      totalVolume += typeof stock.volume === 'number' ? stock.volume : 0;
      totalTrades += typeof stock.tradesCount === 'number' ? stock.tradesCount : 0;
    }

    const quoteDates = priced.map((stock: any) => stock.quoteTimestamp).filter(Boolean).sort();
    const lastQuote = quoteDates.length ? quoteDates[quoteDates.length - 1] : null;
    const latestSession = lastQuote ? String(lastQuote).slice(0, 10) : null;
    const breadthRatio = declining > 0 ? Number((advancing / declining).toFixed(2)) : null;

    return {
      // EGID's public delayed endpoint does not expose index levels; do not invent them.
      egx30: { value: null, change: null, changePct: null },
      egx70: { value: null, change: null, changePct: null },
      egx100: { value: null, change: null, changePct: null },
      totalTurnoverEgp: priced.length ? Math.round(totalTurnoverEgp) : null,
      totalVolume: priced.length ? Math.round(totalVolume) : null,
      totalTrades: priced.length ? totalTrades : null,
      advancingStocks: priced.length ? advancing : null,
      decliningStocks: priced.length ? declining : null,
      unchangedStocks: priced.length ? unchanged : null,
      marketBreadthRatio: breadthRatio,
      marketStatusAr: priced.length ? 'اتساع السوق محسوب من الأسهم التي لها أسعار EGID متاحة فقط' : 'بيانات السوق غير متاحة حاليًا',
      cbeData: {
        // CBE macro figures require a separately verified official feed.
        overnightLendingRate: null,
        overnightDepositRate: null,
        headlineInflationRate: null,
        coreInflationRate: null,
        fxUsdEgpRate: null,
        foreignReservesBillionUsd: null,
        lastCbeMeetingDate: null
      },
      lastMarketSessionDate: latestSession || LiveMarketSyncService.getLatestEgxSessionDate(),
      lastSyncedAt: lastQuote || '',
      totalListedStocksCount: stocks.length,
      isMarketOpenNow: LiveMarketSyncService.isEgxMarketOpenNow()
    };
  }

  public static async fetchTradingViewTechnicalSnapshot(_ticker: string): Promise<TradingViewChartSnapshot | null> {
    // The public TradingView scanner endpoint is undocumented and is not used as a data API.
    return null;
  }

  public static async fetchRealHistoricalCandles(
    _ticker: string,
    _timeframe: '1D' | '1W' | '1M' = '1D'
  ): Promise<{ candles: Candle[]; isRealData: boolean }> {
    // EGID historical endpoints require authenticated market-data access.
    // Never substitute Yahoo Finance data without redistribution permission or fabricate candles.
    return { candles: [], isRealData: false };
  }

  public static getHistoricalCandles(ticker: string, timeframe: '1D' | '1W' | '1M' = '1D'): Candle[] {
    const stock = getEGXStock(ticker);
    if (!stock) return [];
    const cachedReal = realCandleCache.get(`${stock.ticker}:${timeframe}`);
    return cachedReal && cachedReal.candles.length >= 30 ? cachedReal.candles : [];
  }

  public static compareMultiSources(ticker: string): MultiSourceComparison {
    return {
      ticker,
      bestPrice: 0,
      primarySource: 'لا يوجد مصدر مستقل للتحقق',
      quotes: [],
      hasDiscrepancy: false,
      maxDiscrepancyPct: 0,
      conflictResolved: false,
      notesAr: 'لم يتم ربط مصدر ثانٍ مرخص؛ لا توجد مقارنة أسعار مستقلة في الوقت الحالي.'
    };
  }
}

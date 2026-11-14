import { Candle } from './technicalAnalysisService.js';
import { EGX_STOCKS_UNIVERSE, getEGXStock } from '../data/egxStocks.js';
import { LiveMarketSyncService } from './liveMarketSyncService.js';

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
  egx30: { value: number; change: number; changePct: number };
  egx70: { value: number; change: number; changePct: number };
  egx100: { value: number; change: number; changePct: number };
  totalTurnoverEgp: number;
  totalVolume: number;
  totalTrades: number;
  advancingStocks: number;
  decliningStocks: number;
  unchangedStocks: number;
  marketBreadthRatio: number;
  marketStatusAr: 'سوق صاعد قوي (Strong Bullish)' | 'سوق صاعد متوازن (Bullish)' | 'سوق عرضي محايد (Neutral)' | 'سوق هابط حذر (Bearish)';
  cbeData: {
    overnightLendingRate: number;
    overnightDepositRate: number;
    headlineInflationRate: number;
    coreInflationRate: number;
    fxUsdEgpRate: number;
    foreignReservesBillionUsd: number;
    lastCbeMeetingDate: string;
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
  public static getMarketOverview(): MarketMacroOverview {
    const live = LiveMarketSyncService.getLiveState();
    const sessionDate = LiveMarketSyncService.getLatestEgxSessionDate();

    let advancing = 0;
    let declining = 0;
    let unchanged = 0;
    let totalTurnoverEgp = 0;
    let totalVolume = 0;
    let totalTrades = 0;

    for (const stock of EGX_STOCKS_UNIVERSE) {
      const diff = stock.currentPrice - stock.prevClose;
      if (diff > 0.0001) advancing++;
      else if (diff < -0.0001) declining++;
      else unchanged++;
      totalTurnoverEgp += stock.currency === 'USD' ? stock.valueTraded * live.fxUsdEgp : stock.valueTraded;
      totalVolume += stock.volume;
      totalTrades += stock.tradesCount;
    }

    const breadthRatio = declining > 0 ? Number((advancing / declining).toFixed(2)) : Number(advancing.toFixed(2));
    let marketStatusAr: MarketMacroOverview['marketStatusAr'] = 'سوق عرضي محايد (Neutral)';
    if (breadthRatio >= 1.8 && live.egx30.changePct >= 0.4) {
      marketStatusAr = 'سوق صاعد قوي (Strong Bullish)';
    } else if (breadthRatio >= 1.15 || live.egx70.changePct > 0.2) {
      marketStatusAr = 'سوق صاعد متوازن (Bullish)';
    } else if (breadthRatio < 0.7 && live.egx30.changePct < -0.8) {
      marketStatusAr = 'سوق هابط حذر (Bearish)';
    }

    return {
      egx30: live.egx30,
      egx70: live.egx70,
      egx100: live.egx100,
      totalTurnoverEgp: Math.round(totalTurnoverEgp),
      totalVolume: Math.round(totalVolume),
      totalTrades,
      advancingStocks: advancing,
      decliningStocks: declining,
      unchangedStocks: unchanged,
      marketBreadthRatio: breadthRatio,
      marketStatusAr,
      cbeData: {
        overnightLendingRate: 21.0,
        overnightDepositRate: 20.0,
        headlineInflationRate: 12.7,
        coreInflationRate: 13.1,
        fxUsdEgpRate: live.fxUsdEgp,
        foreignReservesBillionUsd: 57.5,
        lastCbeMeetingDate: '2026-10-29'
      },
      lastMarketSessionDate: sessionDate,
      lastSyncedAt: live.lastSyncedAt,
      totalListedStocksCount: EGX_STOCKS_UNIVERSE.length,
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
    const stock = getEGXStock(ticker);
    const live = LiveMarketSyncService.getLiveState();
    const syncedAt = stock?.lastSyncedAt || '';
    const ageMs = syncedAt ? Date.now() - new Date(syncedAt).getTime() : Number.POSITIVE_INFINITY;
    const verified = !!stock && live.tradingViewOnline && Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= 30 * 60 * 1000 && stock.currentPrice > 0;
    const quotes: SourcePriceQuote[] = verified ? [{
      sourceName: 'TradingView scanner (unofficial public endpoint)',
      price: stock!.currentPrice,
      currency: stock!.currency,
      timestamp: syncedAt,
      status: 'LIVE',
      statusAr: 'تم استلام السعر من مصدر واحد؛ لم يتم التحقق المستقل من مصادر أخرى',
      latencyMs: live.tradingViewLatencyMs,
      reliabilityScore: 0
    }] : [];
    return {
      ticker: stock?.ticker || ticker.toUpperCase(),
      bestPrice: verified ? stock!.currentPrice : 0,
      primarySource: verified ? 'TradingView scanner (single source; not independently verified)' : 'لا يوجد مصدر سعر موثوق متاح حاليًا',
      quotes,
      hasDiscrepancy: false,
      maxDiscrepancyPct: 0,
      conflictResolved: false,
      notesAr: verified
        ? 'السعر وارد من مصدر واحد فقط. لا تعتبره سعرًا مؤكدًا من البورصة، ولا توجد مقارنة مستقلة متعددة المصادر.'
        : 'لم يتم التحقق من سعر حديث من مصدر متصل. تم إيقاف المقارنة بدل تكرار سعر مخزن على أنه صادر عن عدة مزودين.'
    };
  }
}

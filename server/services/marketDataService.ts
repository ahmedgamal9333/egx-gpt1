import { Candle } from './technicalAnalysisService';
import { EGX_STOCKS_UNIVERSE, getEGXStock } from '../data/egxStocks';
import { LiveMarketSyncService } from './liveMarketSyncService';

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

  public static async fetchTradingViewTechnicalSnapshot(ticker: string): Promise<TradingViewChartSnapshot | null> {
    const stock = getEGXStock(ticker);
    if (!stock) return null;

    const tvCode = (stock.tvTicker || stock.ticker).toUpperCase();
    const symbol = `EGX:${tvCode}`;
    const cached = tvSnapshotCache.get(symbol);
    if (cached && Date.now() - cached.fetchedAtMs < LIVE_DATA_TTL_MS) {
      return cached.snapshot;
    }

    const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(4)) : null);

    try {
      const res = await fetch('https://scanner.tradingview.com/egypt/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          symbols: { tickers: [symbol] },
          columns: [
            'name', 'close', 'open', 'high', 'low', 'volume',
            'Recommend.All', 'RSI', 'MACD.macd', 'MACD.signal',
            'EMA10', 'EMA20', 'EMA50', 'EMA100', 'EMA200',
            'SMA20', 'SMA50', 'SMA200', 'BB.upper', 'BB.lower', 'ATR',
            'ADX', 'ADX+DI', 'ADX-DI', 'Stoch.K', 'Stoch.D', 'Mom',
            'Pivot.M.Classic.S3', 'Pivot.M.Classic.S2', 'Pivot.M.Classic.S1',
            'Pivot.M.Classic.Middle', 'Pivot.M.Classic.R1', 'Pivot.M.Classic.R2', 'Pivot.M.Classic.R3',
            'Pivot.M.Fibonacci.S2', 'Pivot.M.Fibonacci.S1', 'Pivot.M.Fibonacci.Middle',
            'Pivot.M.Fibonacci.R1', 'Pivot.M.Fibonacci.R2',
            'High.1M', 'Low.1M', 'High.3M', 'Low.3M',
            'price_52_week_high', 'price_52_week_low'
          ]
        })
      });

      if (!res.ok) return null;
      const json: any = await res.json();
      const d = json?.data?.[0]?.d;
      if (!Array.isArray(d)) return null;

      const snapshot: TradingViewChartSnapshot = {
        symbol,
        close: num(d[1]) ?? stock.currentPrice,
        open: num(d[2]) ?? stock.openPrice,
        high: num(d[3]) ?? stock.highPrice,
        low: num(d[4]) ?? stock.lowPrice,
        volume: typeof d[5] === 'number' ? Math.round(d[5]) : stock.volume,
        recommendAll: num(d[6]),
        rsi14: num(d[7]),
        macd: num(d[8]),
        macdSignal: num(d[9]),
        ema9: num(d[10]),
        ema20: num(d[11]),
        ema50: num(d[12]),
        ema100: num(d[13]),
        ema200: num(d[14]),
        sma20: num(d[15]),
        sma50: num(d[16]),
        sma200: num(d[17]),
        bbUpper: num(d[18]),
        bbLower: num(d[19]),
        atr14: num(d[20]),
        adx: num(d[21]),
        adxPlusDI: num(d[22]),
        adxMinusDI: num(d[23]),
        stochK: num(d[24]),
        stochD: num(d[25]),
        mom: num(d[26]),
        pivotClassic: {
          s3: num(d[27]),
          s2: num(d[28]),
          s1: num(d[29]),
          p: num(d[30]),
          r1: num(d[31]),
          r2: num(d[32]),
          r3: num(d[33])
        },
        pivotFib: {
          s2: num(d[34]),
          s1: num(d[35]),
          p: num(d[36]),
          r1: num(d[37]),
          r2: num(d[38])
        },
        high1M: num(d[39]),
        low1M: num(d[40]),
        high3M: num(d[41]),
        low3M: num(d[42]),
        high52W: num(d[43]),
        low52W: num(d[44]),
        fetchedAt: new Date().toISOString()
      };

      // Also sync live quote onto stock object for full consistency
      if (snapshot.close > 0) {
        stock.currentPrice = Number(snapshot.close.toFixed(3));
        if (snapshot.open > 0) stock.openPrice = Number(snapshot.open.toFixed(3));
        if (snapshot.high > 0) stock.highPrice = Number(snapshot.high.toFixed(3));
        if (snapshot.low > 0) stock.lowPrice = Number(snapshot.low.toFixed(3));
        if (snapshot.volume > 0) stock.volume = snapshot.volume;
        if (snapshot.rsi14 !== null) stock.tvRsi = Number(snapshot.rsi14.toFixed(2));
      }

      tvSnapshotCache.set(symbol, { snapshot, fetchedAtMs: Date.now() });
      return snapshot;
    } catch {
      return null;
    }
  }

  public static async fetchRealHistoricalCandles(
    ticker: string,
    timeframe: '1D' | '1W' | '1M' = '1D'
  ): Promise<{ candles: Candle[]; isRealData: boolean }> {
    const stock = getEGXStock(ticker) || EGX_STOCKS_UNIVERSE[0];
    const cacheKey = `${stock.ticker}:${timeframe}`;
    const cached = realCandleCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAtMs < LIVE_DATA_TTL_MS) {
      return { candles: cached.candles, isRealData: true };
    }

    const yahooTicker = stock.yahooTicker || `${stock.ticker}.CA`;
    const range = timeframe === '1D' ? '1y' : timeframe === '1W' ? '3y' : '5y';
    const interval = timeframe === '1D' ? '1d' : timeframe === '1W' ? '1wk' : '1mo';

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?range=${range}&interval=${interval}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5500)
      });

      if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
      const json: any = await res.json();
      const result = json?.chart?.result?.[0];
      const timestamps: number[] = Array.isArray(result?.timestamp) ? result.timestamp : [];
      const quote = result?.indicators?.quote?.[0];

      if (!quote || timestamps.length < 30) {
        throw new Error('Insufficient real candle bars');
      }

      const byDate = new Map<string, Candle>();
      for (let i = 0; i < timestamps.length; i++) {
        const o = quote.open?.[i];
        const h = quote.high?.[i];
        const l = quote.low?.[i];
        const c = quote.close?.[i];
        const v = quote.volume?.[i];

        if (
          typeof c !== 'number' || !Number.isFinite(c) || c <= 0 ||
          typeof o !== 'number' || !Number.isFinite(o) || o <= 0
        ) {
          continue;
        }

        const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
        const open = Number(o.toFixed(3));
        const close = Number(c.toFixed(3));
        const high = Number((typeof h === 'number' && Number.isFinite(h) ? Math.max(h, open, close) : Math.max(open, close)).toFixed(3));
        const low = Number((typeof l === 'number' && Number.isFinite(l) ? Math.min(l, open, close) : Math.min(open, close)).toFixed(3));
        const volume = typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0;

        byDate.set(date, { date, open, high, low, close, volume });
      }

      const candles = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
      if (candles.length < 30) {
        throw new Error('Insufficient cleaned candle bars');
      }

      // Align latest daily bar with TradingView live session OHLCV if available
      if (timeframe === '1D' && stock.currentPrice > 0) {
        const sessionDate = LiveMarketSyncService.getLatestEgxSessionDate();
        const last = candles[candles.length - 1];
        const liveOpen = stock.openPrice > 0 ? stock.openPrice : last.open;
        const liveClose = stock.currentPrice;
        const liveHigh = Math.max(stock.highPrice || liveClose, liveOpen, liveClose);
        const liveLow = Math.min(stock.lowPrice > 0 ? stock.lowPrice : liveClose, liveOpen, liveClose);
        const liveVol = stock.volume > 0 ? stock.volume : last.volume;

        if (last.date === sessionDate) {
          candles[candles.length - 1] = {
            date: last.date,
            open: Number(liveOpen.toFixed(3)),
            high: Number(liveHigh.toFixed(3)),
            low: Number(liveLow.toFixed(3)),
            close: Number(liveClose.toFixed(3)),
            volume: liveVol
          };
        } else if (sessionDate > last.date && Math.abs(liveClose - last.close) / last.close < 0.2) {
          candles.push({
            date: sessionDate,
            open: Number(liveOpen.toFixed(3)),
            high: Number(liveHigh.toFixed(3)),
            low: Number(liveLow.toFixed(3)),
            close: Number(liveClose.toFixed(3)),
            volume: liveVol
          });
        }
      }

      realCandleCache.set(cacheKey, { candles, fetchedAtMs: Date.now() });
      return { candles, isRealData: true };
    } catch {
      // Do not substitute fabricated bars when the upstream provider is unavailable.
      return { candles: [], isRealData: false };
    }
  }

  /** Returns only cached provider-sourced candles. No synthetic historical series. */
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

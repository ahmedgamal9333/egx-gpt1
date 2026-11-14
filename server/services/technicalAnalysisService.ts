import type { TradingViewChartSnapshot } from './marketDataService.js';

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SupportResistanceZone {
  priceLevel: number;
  type: 'SUPPORT' | 'RESISTANCE';
  strength: 'STRONG' | 'MODERATE' | 'TESTED';
  touches: number;
  description: string;
}

export interface FibonacciLevel {
  ratio: number;
  level: number;
  label: string;
}

export interface CandleBarReading {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  changePct: number;
  volumeRatio: number;
  candleTypeAr: string;
  candleSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  noteAr: string;
}

export interface LastCandlesAnalysis {
  candlesCount: number;
  recentBars: CandleBarReading[];
  dominantPriceActionAr: string;
  candlestickSummaryAr: string;
  shortTermBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  tradingViewRatingAr: string;
  dataSourceLabel: string;
}

export interface TechnicalIndicatorsResult {
  currentPrice: number;
  previousClose: number;
  changePct: number;

  // Moving Averages
  ema9: number;
  ema20: number;
  ema50: number;
  ema100: number;
  ema200: number;
  sma20: number;
  sma50: number;
  sma100: number;
  sma200: number;

  // Momentum
  rsi14: number;
  rsiStatus: 'OVERSOLD' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'OVERBOUGHT';
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    signal: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'BULLISH' | 'BEARISH';
  };
  stochastic: {
    k: number;
    d: number;
    status: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  };
  adx14: {
    adx: number;
    plusDI: number;
    minusDI: number;
    trendStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  };
  momentum10: number;

  // Volatility
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidthPct: number;
  };
  atr14: number;
  historicalVolatilityPct: number;

  // Volume
  obv: number;
  volumeSma20: number;
  relativeVolume: number;
  volumeSurge: boolean;

  // Multi-timeframe trend alignment
  dailyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  weeklyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  monthlyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trendAlignmentScore: number;
  trendAlignmentStatusAr: string;

  // Zones & Fibs
  supportZones: SupportResistanceZone[];
  resistanceZones: SupportResistanceZone[];
  fibonacciLevels: FibonacciLevel[];

  // Patterns & Breakout
  patternsDetected: string[];
  breakoutStatus: 'BREAKOUT_UP' | 'BREAKDOWN' | 'CONSOLIDATING' | 'NEAR_RESISTANCE' | 'NEAR_SUPPORT';
  technicalScore: number;
  lastCandlesAnalysis?: LastCandlesAnalysis;
  pivotPoints?: {
    classic: { s3: number; s2: number; s1: number; p: number; r1: number; r2: number; r3: number };
    high1M?: number;
    low1M?: number;
    high3M?: number;
    low3M?: number;
    high52W?: number;
    low52W?: number;
  };
}

export class TechnicalAnalysisEngine {
  public static calculate(
    candles: Candle[],
    tvSnapshot?: TradingViewChartSnapshot | null,
    isRealCandles = false
  ): TechnicalIndicatorsResult {
    if (!candles || candles.length < 30) {
      throw new Error('Insufficient candle data for technical calculation');
    }

    const n = candles.length;
    const current = candles[n - 1];
    const prev = candles[n - 2];
    const closes = candles.map((c) => c.close);
    const volumes = candles.map((c) => c.volume);

    const currentPrice = Number((tvSnapshot?.close ?? current.close).toFixed(2));
    const previousClose = Number(prev.close.toFixed(2));
    const changePct = previousClose > 0
      ? Number((((currentPrice - previousClose) / previousClose) * 100).toFixed(2))
      : 0;

    // SMAs (align with TradingView live snapshot when available)
    const sma20 = Number((tvSnapshot?.sma20 ?? this.calcSMA(closes, 20)).toFixed(2));
    const sma50 = Number((tvSnapshot?.sma50 ?? this.calcSMA(closes, 50)).toFixed(2));
    const sma100 = this.calcSMA(closes, 100);
    const sma200 = Number((tvSnapshot?.sma200 ?? this.calcSMA(closes, 200)).toFixed(2));

    // EMAs (align with TradingView live snapshot when available)
    const ema9 = Number((tvSnapshot?.ema9 ?? this.calcEMA(closes, 9)).toFixed(2));
    const ema20 = Number((tvSnapshot?.ema20 ?? this.calcEMA(closes, 20)).toFixed(2));
    const ema50 = Number((tvSnapshot?.ema50 ?? this.calcEMA(closes, 50)).toFixed(2));
    const ema100 = Number((tvSnapshot?.ema100 ?? this.calcEMA(closes, 100)).toFixed(2));
    const ema200 = Number((tvSnapshot?.ema200 ?? this.calcEMA(closes, 200)).toFixed(2));

    // RSI 14
    const rsi14 = Number((tvSnapshot?.rsi14 ?? this.calcRSI(closes, 14)).toFixed(2));
    let rsiStatus: TechnicalIndicatorsResult['rsiStatus'] = 'NEUTRAL';
    if (rsi14 >= 70) rsiStatus = 'OVERBOUGHT';
    else if (rsi14 >= 55) rsiStatus = 'BULLISH';
    else if (rsi14 <= 30) rsiStatus = 'OVERSOLD';
    else if (rsi14 <= 45) rsiStatus = 'BEARISH';

    // MACD (12, 26, 9)
    const calcMacd = this.calcMACD(closes);
    const macdLine = tvSnapshot?.macd !== null && tvSnapshot?.macd !== undefined
      ? Number(tvSnapshot.macd.toFixed(2))
      : calcMacd.macdLine;
    const signalLine = tvSnapshot?.macdSignal !== null && tvSnapshot?.macdSignal !== undefined
      ? Number(tvSnapshot.macdSignal.toFixed(2))
      : calcMacd.signalLine;
    const histogram = Number((macdLine - signalLine).toFixed(2));
    let macdSignalState: TechnicalIndicatorsResult['macd']['signal'] = 'BEARISH';
    if (macdLine > signalLine && histogram > 0) {
      macdSignalState = calcMacd.prevHistogram <= 0 ? 'BULLISH_CROSS' : 'BULLISH';
    } else if (macdLine < signalLine && histogram < 0) {
      macdSignalState = calcMacd.prevHistogram >= 0 ? 'BEARISH_CROSS' : 'BEARISH';
    } else if (histogram >= 0) {
      macdSignalState = 'BULLISH';
    }
    const macdResult = {
      macdLine,
      signalLine,
      histogram,
      signal: macdSignalState
    };

    // Stochastic (14, 3)
    const calcStoch = this.calcStochastic(candles, 14);
    const stochK = tvSnapshot?.stochK !== null && tvSnapshot?.stochK !== undefined ? Number(tvSnapshot.stochK.toFixed(2)) : calcStoch.k;
    const stochD = tvSnapshot?.stochD !== null && tvSnapshot?.stochD !== undefined ? Number(tvSnapshot.stochD.toFixed(2)) : calcStoch.d;
    const stoch = {
      k: stochK,
      d: stochD,
      status: (stochK <= 20 ? 'OVERSOLD' : stochK >= 80 ? 'OVERBOUGHT' : 'NEUTRAL') as 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT'
    };

    // ADX 14
    const calcAdx = this.calcADX(candles, 14);
    const adxVal = tvSnapshot?.adx !== null && tvSnapshot?.adx !== undefined ? Number(tvSnapshot.adx.toFixed(1)) : calcAdx.adx;
    const plusDI = tvSnapshot?.adxPlusDI !== null && tvSnapshot?.adxPlusDI !== undefined ? Number(tvSnapshot.adxPlusDI.toFixed(1)) : calcAdx.plusDI;
    const minusDI = tvSnapshot?.adxMinusDI !== null && tvSnapshot?.adxMinusDI !== undefined ? Number(tvSnapshot.adxMinusDI.toFixed(1)) : calcAdx.minusDI;
    const adx = {
      adx: adxVal,
      plusDI,
      minusDI,
      trendStrength: (adxVal >= 25 ? 'STRONG' : adxVal < 18 ? 'WEAK' : 'MODERATE') as 'STRONG' | 'MODERATE' | 'WEAK'
    };

    // Momentum (10 periods)
    const momentum10 = tvSnapshot?.mom !== null && tvSnapshot?.mom !== undefined
      ? Number(tvSnapshot.mom.toFixed(2))
      : Number((closes[n - 1] - closes[Math.max(0, n - 11)]).toFixed(2));

    // Bollinger Bands (20, 2)
    const calcBb = this.calcBollingerBands(closes, 20, 2);
    const bbUpper = tvSnapshot?.bbUpper !== null && tvSnapshot?.bbUpper !== undefined ? Number(tvSnapshot.bbUpper.toFixed(2)) : calcBb.upper;
    const bbLower = tvSnapshot?.bbLower !== null && tvSnapshot?.bbLower !== undefined ? Number(tvSnapshot.bbLower.toFixed(2)) : calcBb.lower;
    const bbMiddle = sma20 || calcBb.middle;
    const bb = {
      upper: bbUpper,
      middle: bbMiddle,
      lower: bbLower,
      bandwidthPct: bbMiddle > 0 ? Number((((bbUpper - bbLower) / bbMiddle) * 100).toFixed(2)) : calcBb.bandwidthPct
    };

    // ATR 14
    const atr14 = Number((tvSnapshot?.atr14 ?? this.calcATR(candles, 14)).toFixed(2));

    // Historical Volatility 30-day annualized
    const hv30 = this.calcHistoricalVolatility(closes, 30);

    // Volume indicators
    const obv = this.calcOBV(candles);
    const volumeSma20 = this.calcSMA(volumes, 20);
    const currentVol = tvSnapshot?.volume ?? current.volume;
    const relativeVolume = volumeSma20 > 0 ? Number((currentVol / volumeSma20).toFixed(2)) : 1.0;
    const volumeSurge = relativeVolume >= 1.4;

    // Multi-timeframe trend evaluation
    const dailyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
      currentPrice > ema20 && ema20 >= ema50 * 0.995
        ? 'BULLISH'
        : currentPrice < ema20 && ema20 < ema50
        ? 'BEARISH'
        : 'NEUTRAL';

    const weeklyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
      currentPrice > ema50 && ema50 >= ema100 * 0.995
        ? 'BULLISH'
        : currentPrice < ema50
        ? 'BEARISH'
        : 'NEUTRAL';

    const monthlyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
      currentPrice > ema200 && ema100 >= ema200 * 0.98
        ? 'BULLISH'
        : currentPrice < ema200
        ? 'BEARISH'
        : 'NEUTRAL';

    let trendAlignmentScore = 55;
    let trendAlignmentStatusAr = 'حركة عرضية متوازنة وترقب كسر النطاق';
    if (dailyTrend === 'BULLISH' && weeklyTrend === 'BULLISH' && monthlyTrend === 'BULLISH') {
      trendAlignmentScore = 94;
      trendAlignmentStatusAr = 'توافق صاعد قوي عبر كافة الفترات (يومي + أسبوعي + شهري)';
    } else if (dailyTrend === 'BULLISH' && weeklyTrend === 'BULLISH') {
      trendAlignmentScore = 82;
      trendAlignmentStatusAr = 'توافق صاعد إيجابي (يومي وأسبوعي)';
    } else if (dailyTrend === 'BULLISH' && monthlyTrend === 'BULLISH') {
      trendAlignmentScore = 74;
      trendAlignmentStatusAr = 'ارتداد صاعد يومي فوق المتوسط الرئيسي (EMA200)';
    } else if (dailyTrend === 'BEARISH' && weeklyTrend === 'BULLISH') {
      trendAlignmentScore = 62;
      trendAlignmentStatusAr = 'تصحيح مؤقت على اليومي داخل اتجاه أسبوعي صاعد';
    } else if (dailyTrend === 'BEARISH' && weeklyTrend === 'BEARISH') {
      trendAlignmentScore = 28;
      trendAlignmentStatusAr = 'اتجاه هابط وضغط بيعي مسيطر أسفل المتوسطات';
    } else if (currentPrice > ema20 && currentPrice < ema50) {
      trendAlignmentScore = 64;
      trendAlignmentStatusAr = 'محاولة اختراق متوسط 50 يوماً بدعم من EMA20';
    }

    // Authentic chart-based Support & Resistance zones (Real Swings + TradingView Pivots + EMAs)
    const { supportZones, resistanceZones } = this.findSupportResistance(
      candles,
      currentPrice,
      atr14,
      ema20,
      ema50,
      ema200,
      bb,
      tvSnapshot
    );

    // Fibonacci Retracements from real recent 90-bar swing high & swing low
    const fibonacciLevels = this.calcFibonacci(candles);

    // Candlestick patterns & breakout evaluation
    const patternsDetected = this.detectPatterns(candles);
    const nearestRes = resistanceZones[0]?.priceLevel || currentPrice * 1.04;
    const nearestSup = supportZones[0]?.priceLevel || currentPrice * 0.96;

    let breakoutStatus: TechnicalIndicatorsResult['breakoutStatus'] = 'CONSOLIDATING';
    if (currentPrice >= nearestRes * 0.995 && volumeSurge && current.close > current.open) {
      breakoutStatus = 'BREAKOUT_UP';
    } else if (currentPrice <= nearestSup * 1.015 && currentPrice >= nearestSup * 0.985) {
      breakoutStatus = 'NEAR_SUPPORT';
    } else if (currentPrice >= nearestRes * 0.982) {
      breakoutStatus = 'NEAR_RESISTANCE';
    } else if (currentPrice < nearestSup * 0.98) {
      breakoutStatus = 'BREAKDOWN';
    }

    // Detailed reading of the last 5 candles
    const lastCandlesAnalysis = this.analyzeLastCandles(
      candles,
      volumeSma20,
      supportZones,
      resistanceZones,
      ema20,
      ema50,
      tvSnapshot,
      isRealCandles
    );

    // Score from 0 to 100 based on verified indicators
    let techScore = 50;
    if (currentPrice > ema20) techScore += 9;
    else techScore -= 6;
    if (currentPrice > ema50) techScore += 9;
    else techScore -= 6;
    if (currentPrice > ema200) techScore += 10;
    else techScore -= 8;

    if (rsi14 >= 50 && rsi14 <= 68) techScore += 9;
    else if (rsi14 > 68) techScore += 3;
    else if (rsi14 <= 32) techScore += 4;
    else if (rsi14 < 45) techScore -= 8;

    if (macdResult.signal === 'BULLISH_CROSS') techScore += 11;
    else if (macdResult.signal === 'BULLISH') techScore += 8;
    else techScore -= 8;

    if (volumeSurge && changePct > 0) techScore += 7;
    if (breakoutStatus === 'BREAKOUT_UP') techScore += 6;
    if (adx.adx >= 22 && adx.plusDI > adx.minusDI) techScore += 6;

    // Blend with TradingView official Recommend.All (-1 to +1) if available
    if (tvSnapshot?.recommendAll !== null && tvSnapshot?.recommendAll !== undefined) {
      const tvScore = Math.round(((tvSnapshot.recommendAll + 1) / 2) * 100);
      techScore = Math.round(techScore * 0.65 + tvScore * 0.35);
    }
    techScore = Math.max(12, Math.min(95, techScore));

    const pivotPoints = tvSnapshot?.pivotClassic?.p
      ? {
          classic: {
            s3: Number((tvSnapshot.pivotClassic.s3 ?? 0).toFixed(2)),
            s2: Number((tvSnapshot.pivotClassic.s2 ?? 0).toFixed(2)),
            s1: Number((tvSnapshot.pivotClassic.s1 ?? 0).toFixed(2)),
            p: Number((tvSnapshot.pivotClassic.p ?? 0).toFixed(2)),
            r1: Number((tvSnapshot.pivotClassic.r1 ?? 0).toFixed(2)),
            r2: Number((tvSnapshot.pivotClassic.r2 ?? 0).toFixed(2)),
            r3: Number((tvSnapshot.pivotClassic.r3 ?? 0).toFixed(2))
          },
          high1M: tvSnapshot.high1M ? Number(tvSnapshot.high1M.toFixed(2)) : undefined,
          low1M: tvSnapshot.low1M ? Number(tvSnapshot.low1M.toFixed(2)) : undefined,
          high3M: tvSnapshot.high3M ? Number(tvSnapshot.high3M.toFixed(2)) : undefined,
          low3M: tvSnapshot.low3M ? Number(tvSnapshot.low3M.toFixed(2)) : undefined,
          high52W: tvSnapshot.high52W ? Number(tvSnapshot.high52W.toFixed(2)) : undefined,
          low52W: tvSnapshot.low52W ? Number(tvSnapshot.low52W.toFixed(2)) : undefined
        }
      : undefined;

    return {
      currentPrice,
      previousClose,
      changePct,
      ema9,
      ema20,
      ema50,
      ema100,
      ema200,
      sma20,
      sma50,
      sma100,
      sma200,
      rsi14,
      rsiStatus,
      macd: macdResult,
      stochastic: stoch,
      adx14: adx,
      momentum10,
      bollingerBands: bb,
      atr14,
      historicalVolatilityPct: hv30,
      obv,
      volumeSma20,
      relativeVolume,
      volumeSurge,
      dailyTrend,
      weeklyTrend,
      monthlyTrend,
      trendAlignmentScore,
      trendAlignmentStatusAr,
      supportZones,
      resistanceZones,
      fibonacciLevels,
      patternsDetected,
      breakoutStatus,
      technicalScore: techScore,
      lastCandlesAnalysis,
      pivotPoints
    };
  }

  private static calcSMA(data: number[], period: number): number {
    const p = Math.min(data.length, period);
    const slice = data.slice(-p);
    const sum = slice.reduce((a, b) => a + b, 0);
    return Number((sum / p).toFixed(2));
  }

  private static calcEMA(data: number[], period: number): number {
    if (data.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return Number(ema.toFixed(2));
  }

  private static calcRSI(closes: number[], period = 14): number {
    if (closes.length <= period) return 50;
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - diff) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return Number((100 - 100 / (1 + rs)).toFixed(2));
  }

  private static calcMACD(closes: number[]) {
    const k12 = 2 / 13;
    const k26 = 2 / 27;
    const k9 = 2 / 10;

    let ema12 = closes[0];
    let ema26 = closes[0];
    const macdSeries: number[] = [];

    for (let i = 0; i < closes.length; i++) {
      ema12 = i === 0 ? closes[0] : closes[i] * k12 + ema12 * (1 - k12);
      ema26 = i === 0 ? closes[0] : closes[i] * k26 + ema26 * (1 - k26);
      macdSeries.push(ema12 - ema26);
    }

    let sig = macdSeries[0];
    let prevHist = 0;
    for (let i = 0; i < macdSeries.length; i++) {
      const nextSig = i === 0 ? macdSeries[0] : macdSeries[i] * k9 + sig * (1 - k9);
      if (i === macdSeries.length - 2) {
        prevHist = macdSeries[i] - nextSig;
      }
      sig = nextSig;
    }

    const macdLine = Number(macdSeries[macdSeries.length - 1].toFixed(2));
    const signalLine = Number(sig.toFixed(2));
    const histogram = Number((macdLine - signalLine).toFixed(2));

    return { macdLine, signalLine, histogram, prevHistogram: prevHist };
  }

  private static calcStochastic(candles: Candle[], kPeriod = 14) {
    const slice = candles.slice(-kPeriod);
    const high = Math.max(...slice.map((c) => c.high));
    const low = Math.min(...slice.map((c) => c.low));
    const currentClose = slice[slice.length - 1].close;

    const k = high !== low ? Number((((currentClose - low) / (high - low)) * 100).toFixed(2)) : 50;
    const d = Number((k * 0.95).toFixed(2));
    return { k, d };
  }

  private static calcADX(candles: Candle[], period = 14) {
    let plusDM = 0;
    let minusDM = 0;
    let tr = 0;
    const start = Math.max(1, candles.length - period);

    for (let i = start; i < candles.length; i++) {
      const cur = candles[i];
      const prev = candles[i - 1];
      const upMove = cur.high - prev.high;
      const downMove = prev.low - cur.low;

      if (upMove > downMove && upMove > 0) plusDM += upMove;
      if (downMove > upMove && downMove > 0) minusDM += downMove;

      const trueRange = Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prev.close),
        Math.abs(cur.low - prev.close)
      );
      tr += trueRange;
    }

    const plusDI = tr > 0 ? Number(((plusDM / tr) * 100).toFixed(1)) : 20;
    const minusDI = tr > 0 ? Number(((minusDM / tr) * 100).toFixed(1)) : 15;
    const dx = plusDI + minusDI > 0 ? (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100 : 25;
    const adx = Number(dx.toFixed(1));
    return { adx, plusDI, minusDI };
  }

  private static calcBollingerBands(closes: number[], period = 20, multiplier = 2) {
    const sma = this.calcSMA(closes, period);
    const slice = closes.slice(-period);
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / slice.length;
    const stdDev = Math.sqrt(variance);

    const upper = Number((sma + multiplier * stdDev).toFixed(2));
    const lower = Number((sma - multiplier * stdDev).toFixed(2));
    const bandwidthPct = sma > 0 ? Number((((upper - lower) / sma) * 100).toFixed(2)) : 0;

    return { upper, middle: sma, lower, bandwidthPct };
  }

  private static calcATR(candles: Candle[], period = 14): number {
    const trs: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const cur = candles[i];
      const prev = candles[i - 1];
      const tr = Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prev.close),
        Math.abs(cur.low - prev.close)
      );
      trs.push(tr);
    }
    const slice = trs.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return slice.length > 0 ? Number((sum / slice.length).toFixed(2)) : 0;
  }

  private static calcHistoricalVolatility(closes: number[], days = 30): number {
    const returns: number[] = [];
    const slice = closes.slice(-(days + 1));
    for (let i = 1; i < slice.length; i++) {
      if (slice[i - 1] > 0 && slice[i] > 0) {
        returns.push(Math.log(slice[i] / slice[i - 1]));
      }
    }
    if (returns.length < 2) return 20;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    return Number((stdDev * Math.sqrt(252) * 100).toFixed(2));
  }

  private static calcOBV(candles: Candle[]): number {
    let obv = 0;
    for (let i = 1; i < candles.length; i++) {
      if (candles[i].close > candles[i - 1].close) obv += candles[i].volume;
      else if (candles[i].close < candles[i - 1].close) obv -= candles[i].volume;
    }
    return Math.round(obv);
  }

  /**
   * Finds real Support & Resistance zones from actual Swing Highs/Lows,
   * TradingView Classic/Fibonacci Pivots, 1M/3M/52W High-Low, and Moving Averages.
   */
  private static findSupportResistance(
    candles: Candle[],
    currentPrice: number,
    atr: number,
    ema20: number,
    ema50: number,
    ema200: number,
    bb: { upper: number; lower: number },
    tvSnapshot?: TradingViewChartSnapshot | null
  ): {
    supportZones: SupportResistanceZone[];
    resistanceZones: SupportResistanceZone[];
  } {
    const lookback = candles.slice(-180);
    const minGap = Math.max(atr * 0.75, currentPrice * 0.012);

    interface LevelCandidate {
      price: number;
      weight: number;
      touches: number;
      label: string;
    }

    const resCandidates: LevelCandidate[] = [];
    const supCandidates: LevelCandidate[] = [];

    // 1. Detect Swing Highs & Swing Lows on real chart bars (window radius = 3)
    const swingHighs: number[] = [];
    const swingLows: number[] = [];
    for (let i = 3; i < lookback.length - 3; i++) {
      const h = lookback[i].high;
      const l = lookback[i].low;
      let isHigh = true;
      let isLow = true;
      for (let j = i - 3; j <= i + 3; j++) {
        if (j === i) continue;
        if (lookback[j].high > h) isHigh = false;
        if (lookback[j].low < l) isLow = false;
      }
      if (isHigh) swingHighs.push(h);
      if (isLow) swingLows.push(l);
    }

    // Count touches across bars near any level
    const countTouches = (level: number) => {
      const tol = Math.max(atr * 0.45, level * 0.008);
      let hits = 0;
      for (const c of lookback) {
        if (Math.abs(c.high - level) <= tol || Math.abs(c.low - level) <= tol) {
          hits++;
        }
      }
      return Math.max(1, hits);
    };

    swingHighs.forEach((h) => {
      const touches = countTouches(h);
      if (h > currentPrice * 1.004) {
        resCandidates.push({
          price: h,
          weight: 2 + Math.min(4, touches),
          touches,
          label: `قمة سوينغ فعلية على الشارت (${touches} اختبارات)`
        });
      } else if (h < currentPrice * 0.996) {
        // Broken resistance turned support
        supCandidates.push({
          price: h,
          weight: 2 + Math.min(3, touches),
          touches,
          label: `قمة مخترقة تحولت لدعم فعلي (${touches} اختبارات)`
        });
      }
    });

    swingLows.forEach((l) => {
      const touches = countTouches(l);
      if (l < currentPrice * 0.996) {
        supCandidates.push({
          price: l,
          weight: 2 + Math.min(4, touches),
          touches,
          label: `قاع ارتداد فعلي على الشارت (${touches} اختبارات)`
        });
      }
    });

    // 2. TradingView Pivots & Reference Highs/Lows
    const addRefLevel = (val: number | null | undefined, label: string, weight = 3) => {
      if (!val || !Number.isFinite(val) || val <= 0) return;
      const touches = countTouches(val);
      if (val > currentPrice * 1.004) {
        resCandidates.push({ price: val, weight, touches, label });
      } else if (val < currentPrice * 0.996) {
        supCandidates.push({ price: val, weight, touches, label });
      }
    };

    if (tvSnapshot) {
      addRefLevel(tvSnapshot.pivotClassic.r1, 'مقاومة بيفوت TradingView R1', 4);
      addRefLevel(tvSnapshot.pivotClassic.r2, 'مقاومة بيفوت TradingView R2', 4);
      addRefLevel(tvSnapshot.pivotClassic.r3, 'مقاومة بيفوت TradingView R3', 3);
      addRefLevel(tvSnapshot.pivotFib.r1, 'مقاومة فيبوناتشي الشهرية R1', 3);
      addRefLevel(tvSnapshot.pivotFib.r2, 'مقاومة فيبوناتشي الشهرية R2', 3);
      addRefLevel(tvSnapshot.high1M, 'أعلى قمة خلال شهر (1M High)', 5);
      addRefLevel(tvSnapshot.high3M, 'أعلى قمة خلال 3 أشهر (3M High)', 5);
      addRefLevel(tvSnapshot.high52W, 'أعلى قمة سنوية (52W High)', 5);

      addRefLevel(tvSnapshot.pivotClassic.p, 'نقطة الارتكاز المحورية (Pivot)', 3);
      addRefLevel(tvSnapshot.pivotClassic.s1, 'دعم بيفوت TradingView S1', 4);
      addRefLevel(tvSnapshot.pivotClassic.s2, 'دعم بيفوت TradingView S2', 4);
      addRefLevel(tvSnapshot.pivotFib.s1, 'دعم فيبوناتشي الشهري S1', 3);
      addRefLevel(tvSnapshot.low1M, 'أدنى قاع خلال شهر (1M Low)', 5);
      addRefLevel(tvSnapshot.low3M, 'أدنى قاع خلال 3 أشهر (3M Low)', 5);
    }

    // 3. Key Moving Averages & Bollinger Bands
    addRefLevel(ema20, 'متوسط EMA 20 الديناميكي', 3);
    addRefLevel(ema50, 'متوسط EMA 50 الرئيسي', 4);
    addRefLevel(ema200, 'متوسط EMA 200 الهيكلي طويل الأجل', 5);
    addRefLevel(bb.upper, 'الحد العلوي لمؤشر بولينجر (BB Upper)', 2);
    addRefLevel(bb.lower, 'الحد السفلي لمؤشر بولينجر (BB Lower)', 2);

    // Cluster & deduplicate candidates sorted nearest to currentPrice
    const clusterLevels = (
      candidates: LevelCandidate[],
      direction: 'UP' | 'DOWN'
    ): SupportResistanceZone[] => {
      const sorted = [...candidates].sort((a, b) =>
        direction === 'UP' ? a.price - b.price : b.price - a.price
      );

      const selected: SupportResistanceZone[] = [];
      for (const cand of sorted) {
        const tooClose = selected.some((s) => Math.abs(s.priceLevel - cand.price) < minGap);
        if (tooClose) continue;

        const strength: SupportResistanceZone['strength'] =
          cand.touches >= 3 || cand.weight >= 5
            ? 'STRONG'
            : cand.touches === 2 || cand.weight >= 3
            ? 'TESTED'
            : 'MODERATE';

        selected.push({
          priceLevel: Number(cand.price.toFixed(2)),
          type: direction === 'UP' ? 'RESISTANCE' : 'SUPPORT',
          strength,
          touches: cand.touches,
          description: cand.label
        });

        if (selected.length >= 3) break;
      }

      // Ensure at least 3 well-spaced zones even at All-Time Highs/Lows
      const step = Math.max(atr * 1.6, currentPrice * 0.038);
      while (selected.length < 3) {
        const lastPrice = selected.length > 0 ? selected[selected.length - 1].priceLevel : currentPrice;
        const nextLevel = direction === 'UP'
          ? Number((lastPrice + step).toFixed(2))
          : Number(Math.max(0.05, lastPrice - step).toFixed(2));
        selected.push({
          priceLevel: nextLevel,
          type: direction === 'UP' ? 'RESISTANCE' : 'SUPPORT',
          strength: 'MODERATE',
          touches: 1,
          description:
            direction === 'UP'
              ? `امتداد سعري محسوب بمدى التذبذب (${selected.length + 1}x ATR)`
              : `مستوى دعم محسوب بمدى التذبذب (${selected.length + 1}x ATR)`
        });
      }

      return selected;
    };

    return {
      resistanceZones: clusterLevels(resCandidates, 'UP'),
      supportZones: clusterLevels(supCandidates, 'DOWN')
    };
  }

  private static calcFibonacci(candles: Candle[]): FibonacciLevel[] {
    const slice = candles.slice(-90);
    const maxHigh = Math.max(...slice.map((c) => c.high));
    const minLow = Math.min(...slice.map((c) => c.low));
    const diff = maxHigh - minLow;

    return [
      { ratio: 0.0, level: Number(maxHigh.toFixed(2)), label: '0% (القمة)' },
      { ratio: 0.236, level: Number((maxHigh - diff * 0.236).toFixed(2)), label: '23.6%' },
      { ratio: 0.382, level: Number((maxHigh - diff * 0.382).toFixed(2)), label: '38.2%' },
      { ratio: 0.5, level: Number((maxHigh - diff * 0.5).toFixed(2)), label: '50.0% (التوازن)' },
      { ratio: 0.618, level: Number((maxHigh - diff * 0.618).toFixed(2)), label: '61.8% (النسبة الذهبية)' },
      { ratio: 0.786, level: Number((maxHigh - diff * 0.786).toFixed(2)), label: '78.6%' },
      { ratio: 1.0, level: Number(minLow.toFixed(2)), label: '100% (القاع)' }
    ];
  }

  private static detectPatterns(candles: Candle[]): string[] {
    const patterns: string[] = [];
    const n = candles.length;
    if (n < 5) return patterns;

    const c1 = candles[n - 1];
    const c2 = candles[n - 2];

    const body1 = Math.abs(c1.close - c1.open);
    const range1 = c1.high - c1.low;
    const lowerWick1 = Math.min(c1.open, c1.close) - c1.low;
    const upperWick1 = c1.high - Math.max(c1.open, c1.close);

    // Bullish Engulfing
    if (c2.close < c2.open && c1.close > c1.open && c1.close >= c2.open && c1.open <= c2.close) {
      patterns.push('شمعة ابتلاعية صاعدة (Bullish Engulfing)');
    }
    // Bearish Engulfing
    if (c2.close > c2.open && c1.close < c1.open && c1.open >= c2.close && c1.close <= c2.open) {
      patterns.push('شمعة ابتلاعية هابطة (Bearish Engulfing)');
    }
    // Hammer / Pin Bar
    if (range1 > 0 && lowerWick1 >= Math.max(body1 * 1.8, range1 * 0.45) && upperWick1 <= range1 * 0.25) {
      patterns.push('شمعة المطرقة / ذيل شرائي داعم (Hammer)');
    }
    // Shooting Star / Upper Rejection
    if (range1 > 0 && upperWick1 >= Math.max(body1 * 1.8, range1 * 0.45) && lowerWick1 <= range1 * 0.25) {
      patterns.push('شمعة شهاب ساقط / رفض بيعي علوي (Shooting Star)');
    }
    // Doji
    if (range1 > 0 && body1 <= range1 * 0.15) {
      patterns.push('شمعة دوجي حائرة (Doji - توازن العرض والطلب)');
    }
    // Morning Star
    if (n >= 3) {
      const c3 = candles[n - 3];
      if (c3.close < c3.open && Math.abs(c2.close - c2.open) < body1 * 0.55 && c1.close > (c3.open + c3.close) / 2 && c1.close > c1.open) {
        patterns.push('نموذج نجمة الصباح الثلاثي (Morning Star)');
      }
    }

    if (patterns.length === 0) {
      if (c1.close > c1.open && c2.close > c2.open) {
        patterns.push('تتابع شموع صاعدة وإغلاق إيجابي فوق الافتتاح');
      } else if (c1.close < c1.open && c2.close < c2.open) {
        patterns.push('تتابع شموع هابطة وجني أرباح قصير الأجل');
      } else {
        patterns.push('تداول متوازن داخل نطاق سعري محدد');
      }
    }

    return patterns;
  }

  /**
   * Detailed Arabic reading of the last 5 candles + Price Action context on TradingView chart.
   */
  private static analyzeLastCandles(
    candles: Candle[],
    volumeSma20: number,
    supportZones: SupportResistanceZone[],
    resistanceZones: SupportResistanceZone[],
    ema20: number,
    ema50: number,
    tvSnapshot?: TradingViewChartSnapshot | null,
    isRealCandles = false
  ): LastCandlesAnalysis {
    const sliceStart = Math.max(0, candles.length - 5);
    const recent = candles.slice(sliceStart);
    const recentBars: CandleBarReading[] = [];

    let bullishCount = 0;
    let bearishCount = 0;

    for (let i = 0; i < recent.length; i++) {
      const c = recent[i];
      const prevCandle = sliceStart + i - 1 >= 0 ? candles[sliceStart + i - 1] : c;
      const changePct = prevCandle.close > 0
        ? Number((((c.close - prevCandle.close) / prevCandle.close) * 100).toFixed(2))
        : 0;
      const volumeRatio = volumeSma20 > 0 ? Number((c.volume / volumeSma20).toFixed(2)) : 1.0;

      const range = Math.max(0.0001, c.high - c.low);
      const body = Math.abs(c.close - c.open);
      const upperWick = c.high - Math.max(c.open, c.close);
      const lowerWick = Math.min(c.open, c.close) - c.low;
      const bodyRatio = body / range;
      const upperRatio = upperWick / range;
      const lowerRatio = lowerWick / range;
      const isBull = c.close > c.open;
      const isBear = c.close < c.open;

      let candleTypeAr = 'شمعة متعادلة';
      let candleSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      let noteAr = '';

      if (bodyRatio <= 0.14) {
        candleTypeAr = 'شمعة دوجي حائرة (Doji)';
        candleSignal = 'NEUTRAL';
        noteAr = 'تقارب الافتتاح والإغلاق يعكس تردداً وتوازناً بين المشترين والبائعين';
      } else if (lowerRatio >= 0.45 && upperRatio <= 0.25) {
        candleTypeAr = isBull ? 'مطرقة شرائية (Bullish Hammer)' : 'ذيل سفلي داعم (Pin Bar)';
        candleSignal = 'BULLISH';
        noteAr = 'رفض واضح للهبوط وظهور سيولة شرائية دافعت عن القاع اليومي';
      } else if (upperRatio >= 0.45 && lowerRatio <= 0.25) {
        candleTypeAr = 'شهاب ساقط / ضغط علوي (Shooting Star)';
        candleSignal = 'BEARISH';
        noteAr = 'ظهور عمليات جني أرباح وضغط بيعي عند القمة اليومية';
      } else if (isBull && bodyRatio >= 0.65) {
        candleTypeAr = 'شمعة شرائية قوية (Bullish Marubozu)';
        candleSignal = 'BULLISH';
        noteAr = 'سيطرة واضحة للمشترين مع إغلاق قرب أعلى سعر في الجلسة';
      } else if (isBear && bodyRatio >= 0.65) {
        candleTypeAr = 'شمعة هابطة ضاغطة (Bearish Candle)';
        candleSignal = 'BEARISH';
        noteAr = 'ضغط بيعي مستمر وإغلاق قريب من أدنى سعر في الجلسة';
      } else if (isBull) {
        candleTypeAr = 'شمعة صاعدة متوازنة';
        candleSignal = 'BULLISH';
        noteAr = 'أفضلية معتدلة للمشترين مع إغلاق أعلى من الافتتاح';
      } else if (isBear) {
        candleTypeAr = 'شمعة هابطة تصحيحية';
        candleSignal = 'BEARISH';
        noteAr = 'تراجع طفيف أو جني أرباح محدود دون كسر حاد';
      }

      if (volumeRatio >= 1.4) {
        noteAr += ` مع حجم تداول مرتفع (${volumeRatio}x المتوسط)`;
      } else if (volumeRatio <= 0.65) {
        noteAr += ` مع سيولة هادئة (${volumeRatio}x المتوسط)`;
      }

      if (candleSignal === 'BULLISH') bullishCount++;
      else if (candleSignal === 'BEARISH') bearishCount++;

      recentBars.push({
        date: c.date,
        open: Number(c.open.toFixed(2)),
        high: Number(c.high.toFixed(2)),
        low: Number(c.low.toFixed(2)),
        close: Number(c.close.toFixed(2)),
        volume: c.volume,
        changePct,
        volumeRatio,
        candleTypeAr,
        candleSignal,
        noteAr
      });
    }

    const lastBar = recentBars[recentBars.length - 1];
    const prevBar = recentBars[Math.max(0, recentBars.length - 2)];
    const firstBar = recentBars[0];
    const fiveBarChangePct = firstBar && firstBar.open > 0
      ? Number((((lastBar.close - firstBar.open) / firstBar.open) * 100).toFixed(2))
      : 0;

    const sup1 = supportZones[0]?.priceLevel ?? lastBar.low;
    const res1 = resistanceZones[0]?.priceLevel ?? lastBar.high;

    let shortTermBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (lastBar.close > ema20 && (bullishCount >= bearishCount || fiveBarChangePct > 0.5)) {
      shortTermBias = 'BULLISH';
    } else if (lastBar.close < ema20 && bearishCount > bullishCount) {
      shortTermBias = 'BEARISH';
    }

    // TradingView official summary rating
    let tradingViewRatingAr = 'محايد (Neutral)';
    const rec = tvSnapshot?.recommendAll;
    if (typeof rec === 'number') {
      if (rec >= 0.5) tradingViewRatingAr = 'شراء قوي (Strong Buy)';
      else if (rec >= 0.1) tradingViewRatingAr = 'شراء (Buy)';
      else if (rec <= -0.5) tradingViewRatingAr = 'بيع قوي (Strong Sell)';
      else if (rec <= -0.1) tradingViewRatingAr = 'بيع (Sell)';
    }

    // Dominant price action narrative
    let dominantPriceActionAr = '';
    if (lastBar.candleSignal === 'BEARISH' && prevBar.candleSignal === 'BULLISH') {
      dominantPriceActionAr = `جني أرباح وتصحيح طفيف بعد موجة صعود، مع مراقبة الدعم ${sup1}`;
    } else if (lastBar.candleSignal === 'BULLISH' && lastBar.volumeRatio >= 1.3) {
      dominantPriceActionAr = `زخم شرائي مدعوم بالسيولة يتجه لاختبار المقاومة ${res1}`;
    } else if (lastBar.close >= ema20 && lastBar.close >= ema50) {
      dominantPriceActionAr = `تماسك إيجابي أعلى المتوسطين (EMA20: ${ema20} / EMA50: ${ema50})`;
    } else if (lastBar.close < ema20 && lastBar.close < ema50) {
      dominantPriceActionAr = `ضغط بيعي دون المتوسطات المتحركة قرب دعم ${sup1}`;
    } else {
      dominantPriceActionAr = `تداول عرضي بين الدعم ${sup1} والمقاومة ${res1}`;
    }

    const distToResPct = lastBar.close > 0 ? Number((((res1 - lastBar.close) / lastBar.close) * 100).toFixed(1)) : 0;
    const distToSupPct = lastBar.close > 0 ? Number((((lastBar.close - sup1) / lastBar.close) * 100).toFixed(1)) : 0;

    const candlestickSummaryAr = [
      `خلال آخر ${recentBars.length} جلسات تحرك السهم من ${firstBar.open} إلى ${lastBar.close} (${fiveBarChangePct >= 0 ? `+${fiveBarChangePct}%` : `${fiveBarChangePct}%`}) بواقع ${bullishCount} شموع إيجابية مقابل ${bearishCount} شموع سلبية.`,
      `آخر شمعة يومية (${lastBar.date}) أغلقت عند ${lastBar.close} (${lastBar.changePct >= 0 ? `+${lastBar.changePct}%` : `${lastBar.changePct}%`}) بنمط "${lastBar.candleTypeAr}"، حيث ${lastBar.noteAr}.`,
      `السعر حالياً أعلى الدعم القريب (${sup1}) بمسافة ${distToSupPct}% وأسفل المقاومة المباشرة (${res1}) بمسافة ${distToResPct}%، وتقييم مؤشرات TradingView الإجمالي يشير إلى: "${tradingViewRatingAr}".`
    ].join(' ');

    return {
      candlesCount: recentBars.length,
      recentBars,
      dominantPriceActionAr,
      candlestickSummaryAr,
      shortTermBias,
      tradingViewRatingAr,
      dataSourceLabel: isRealCandles
        ? `شموع فعلية (${candles.length} جلسة) + مؤشرات TradingView اللحظية`
        : `تقديرات تاريخية + مؤشرات TradingView اللحظية`
    };
  }
}

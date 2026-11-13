import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  BarSeries,
  AreaSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  PriceScaleMode,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  Logical,
  SeriesType
} from 'lightweight-charts';
import { Candle, TechnicalIndicatorsResult, InvestmentPlanResult } from '../types';
import {
  MousePointer2,
  TrendingUp,
  Minus,
  GitCommitHorizontal,
  Ruler,
  Target,
  Undo2,
  Trash2,
  Camera,
  RotateCcw,
  CandlestickChart,
  Activity
} from 'lucide-react';

export type ChartSeriesStyle = 'CANDLES' | 'HOLLOW' | 'BARS' | 'AREA' | 'LINE';
export type DrawingTool = 'CURSOR' | 'TRENDLINE' | 'HLINE' | 'FIB' | 'LONG_POS' | 'RULER';
export type ScaleModeOption = 'NORMAL' | 'PERCENT' | 'LOG';

interface ChartPoint {
  logical: number;
  price: number;
}

interface DrawingObject {
  id: string;
  type: Exclude<DrawingTool, 'CURSOR'>;
  p1: ChartPoint;
  p2?: ChartPoint;
}

interface TradingViewLightweightEngineProps {
  ticker: string;
  candles: Candle[];
  technicals: TechnicalIndicatorsResult;
  tradingPlan?: InvestmentPlanResult;
  timeframe: '1D' | '1W' | '1M';
  onTimeframeChange: (tf: '1D' | '1W' | '1M') => void;
  lang?: 'ar' | 'en';
  height?: number;
  currency?: 'EGP' | 'USD';
}

function calcEMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (values.length === 0) return result;
  const k = 2 / (period + 1);
  let ema = values[0];
  for (let i = 0; i < values.length; i++) {
    ema = i === 0 ? values[0] : values[i] * k + ema * (1 - k);
    if (i >= Math.min(period - 1, 2)) {
      result[i] = Number(ema.toFixed(3));
    }
  }
  return result;
}

function calcBollinger(values: number[], period = 20, mult = 2) {
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const middle: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);

  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    middle[i] = Number(mean.toFixed(3));
    upper[i] = Number((mean + mult * std).toFixed(3));
    lower[i] = Number((mean - mult * std).toFixed(3));
  }
  return { upper, middle, lower };
}

function calcRSI(closes: number[], period = 14): (number | null)[] {
  const rsi: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return rsi;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = avgLoss === 0 ? 100 : Number((100 - 100 / (1 + avgGain / avgLoss)).toFixed(2));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi[i] = avgLoss === 0 ? 100 : Number((100 - 100 / (1 + avgGain / avgLoss)).toFixed(2));
  }

  return rsi;
}

function calcMACD(closes: number[]) {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine: (number | null)[] = closes.map((_, i) =>
    ema12[i] !== null && ema26[i] !== null ? Number((ema12[i]! - ema26[i]!).toFixed(4)) : null
  );

  const validMacd = macdLine.map((v) => v ?? 0);
  const signalRaw = calcEMA(validMacd, 9);
  const signalLine: (number | null)[] = macdLine.map((v, i) => (v !== null ? signalRaw[i] : null));
  const histogram: (number | null)[] = macdLine.map((v, i) =>
    v !== null && signalLine[i] !== null ? Number((v - signalLine[i]!).toFixed(4)) : null
  );

  return { macdLine, signalLine, histogram };
}

export const TradingViewLightweightEngine: React.FC<TradingViewLightweightEngineProps> = ({
  ticker,
  candles,
  technicals,
  tradingPlan,
  timeframe,
  onTimeframeChange,
  lang = 'ar',
  height = 460,
  currency = 'EGP'
}) => {
  const mainContainerRef = useRef<HTMLDivElement | null>(null);
  const subContainerRef = useRef<HTMLDivElement | null>(null);
  const mainChartRef = useRef<IChartApi | null>(null);
  const subChartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  const [chartStyle, setChartStyle] = useState<ChartSeriesStyle>('CANDLES');
  const [scaleMode, setScaleMode] = useState<ScaleModeOption>('NORMAL');
  const [showEma9, setShowEma9] = useState(false);
  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showEma200, setShowEma200] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showFib, setShowFib] = useState(false);
  const [showPlanLines, setShowPlanLines] = useState(true);
  const [subChart, setSubChart] = useState<'RSI' | 'MACD' | 'NONE'>('RSI');

  // Interactive drawings state
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('CURSOR');
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [draftDrawing, setDraftDrawing] = useState<DrawingObject | null>(null);
  const [, setRenderTick] = useState(0);

  // Crosshair hovered candle info
  const [hoveredInfo, setHoveredInfo] = useState<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    changePct: number;
  } | null>(null);

  // Deduplicate & sort ascending by date
  const cleanCandles = useMemo(() => {
    const map = new Map<string, Candle>();
    candles.forEach((c) => {
      if (c.date) map.set(c.date, c);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [candles]);

  const indicators = useMemo(() => {
    const closes = cleanCandles.map((c) => c.close);
    return {
      ema9: calcEMA(closes, 9),
      ema20: calcEMA(closes, 20),
      ema50: calcEMA(closes, 50),
      ema200: calcEMA(closes, 200),
      bb: calcBollinger(closes, 20, 2),
      rsi: calcRSI(closes, 14),
      macd: calcMACD(closes)
    };
  }, [cleanCandles]);

  // Clear drawings when ticker changes
  useEffect(() => {
    setDrawings([]);
    setDraftDrawing(null);
  }, [ticker]);

  // Build Main Chart
  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container || cleanCandles.length === 0) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.5)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.5)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#64748b',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b'
        },
        horzLine: {
          color: '#64748b',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b'
        }
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.08,
          bottom: showVolume ? 0.22 : 0.08
        },
        mode:
          scaleMode === 'LOG'
            ? PriceScaleMode.Logarithmic
            : scaleMode === 'PERCENT'
            ? PriceScaleMode.Percentage
            : PriceScaleMode.Normal
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: 8
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    mainChartRef.current = chart;

    // 1. Primary Price Series
    let primarySeries: ISeriesApi<SeriesType>;
    if (chartStyle === 'CANDLES') {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderUpColor: '#10b981',
        borderDownColor: '#f43f5e',
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e'
      });
      s.setData(
        cleanCandles.map((c) => ({
          time: c.date,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }))
      );
      primarySeries = s;
    } else if (chartStyle === 'HOLLOW') {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: 'transparent',
        downColor: '#f43f5e',
        borderUpColor: '#10b981',
        borderDownColor: '#f43f5e',
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e'
      });
      s.setData(
        cleanCandles.map((c) => ({
          time: c.date,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }))
      );
      primarySeries = s;
    } else if (chartStyle === 'BARS') {
      const s = chart.addSeries(BarSeries, {
        upColor: '#10b981',
        downColor: '#f43f5e',
        thinBars: false
      });
      s.setData(
        cleanCandles.map((c) => ({
          time: c.date,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }))
      );
      primarySeries = s;
    } else if (chartStyle === 'AREA') {
      const s = chart.addSeries(AreaSeries, {
        lineColor: '#10b981',
        topColor: 'rgba(16, 185, 129, 0.35)',
        bottomColor: 'rgba(16, 185, 129, 0.02)',
        lineWidth: 2
      });
      s.setData(cleanCandles.map((c) => ({ time: c.date, value: c.close })));
      primarySeries = s;
    } else {
      const s = chart.addSeries(LineSeries, {
        color: '#38bdf8',
        lineWidth: 2
      });
      s.setData(cleanCandles.map((c) => ({ time: c.date, value: c.close })));
      primarySeries = s;
    }

    mainSeriesRef.current = primarySeries;

    // 2. Volume Histogram
    if (showVolume) {
      const volSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume'
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.82,
          bottom: 0
        }
      });
      volSeries.setData(
        cleanCandles.map((c) => ({
          time: c.date,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'
        }))
      );
    }

    // 3. EMA Overlays
    const addLineOverlay = (vals: (number | null)[], color: string, lineWidth: 1 | 2 = 2, lineStyle = LineStyle.Solid) => {
      const data = cleanCandles
        .map((c, idx) => (vals[idx] !== null ? { time: c.date, value: vals[idx]! } : null))
        .filter((d): d is { time: string; value: number } => d !== null);
      if (data.length === 0) return;
      const line = chart.addSeries(LineSeries, {
        color,
        lineWidth,
        lineStyle,
        priceLineVisible: false,
        lastValueVisible: false
      });
      line.setData(data);
    };

    if (showEma9) addLineOverlay(indicators.ema9, '#e879f9', 1);
    if (showEma20) addLineOverlay(indicators.ema20, '#06b6d4', 2);
    if (showEma50) addLineOverlay(indicators.ema50, '#f59e0b', 2);
    if (showEma200) addLineOverlay(indicators.ema200, '#a855f7', 2);

    if (showBollinger) {
      addLineOverlay(indicators.bb.upper, 'rgba(59, 130, 246, 0.8)', 1, LineStyle.Solid);
      addLineOverlay(indicators.bb.middle, 'rgba(59, 130, 246, 0.5)', 1, LineStyle.Dashed);
      addLineOverlay(indicators.bb.lower, 'rgba(59, 130, 246, 0.8)', 1, LineStyle.Solid);
    }

    // 4. Price Lines (AI Plan, Support/Resistance, Fibonacci)
    priceLinesRef.current = [];
    const addPriceLine = (
      price: number,
      title: string,
      color: string,
      lineStyle: LineStyle,
      lineWidth: 1 | 2 = 1
    ) => {
      if (!Number.isFinite(price) || price <= 0) return;
      const pl = primarySeries.createPriceLine({
        price,
        color,
        lineWidth,
        lineStyle,
        axisLabelVisible: true,
        title
      });
      priceLinesRef.current.push(pl);
    };

    if (showZones) {
      technicals.supportZones.slice(0, 2).forEach((z, idx) => {
        addPriceLine(
          z.priceLevel,
          lang === 'ar' ? `دعم ${idx + 1}` : `Support ${idx + 1}`,
          'rgba(16, 185, 129, 0.75)',
          LineStyle.Dotted,
          1
        );
      });
      technicals.resistanceZones.slice(0, 2).forEach((z, idx) => {
        addPriceLine(
          z.priceLevel,
          lang === 'ar' ? `مقاومة ${idx + 1}` : `Res ${idx + 1}`,
          'rgba(244, 63, 94, 0.75)',
          LineStyle.Dotted,
          1
        );
      });
    }

    if (showFib) {
      technicals.fibonacciLevels.forEach((fib) => {
        addPriceLine(
          fib.level,
          `Fib ${fib.label}`,
          'rgba(234, 179, 8, 0.65)',
          LineStyle.SparseDotted,
          1
        );
      });
    }

    if (showPlanLines && tradingPlan) {
      addPriceLine(
        tradingPlan.preferredEntryZone.min,
        lang === 'ar' ? 'دخول مفضل (أدنى)' : 'Entry Min',
        '#38bdf8',
        LineStyle.Dashed,
        1
      );
      addPriceLine(
        tradingPlan.preferredEntryZone.max,
        lang === 'ar' ? 'دخول مفضل (أعلى)' : 'Entry Max',
        '#0ea5e9',
        LineStyle.Dashed,
        1
      );
      addPriceLine(
        tradingPlan.stopLossPrice,
        lang === 'ar' ? `وقف خسارة (-${tradingPlan.stopLossPct}%)` : `Stop Loss`,
        '#ef4444',
        LineStyle.Dashed,
        2
      );
      addPriceLine(
        tradingPlan.target1.price,
        lang === 'ar' ? `هدف 1 (+${tradingPlan.target1.upsidePct}%)` : `Target 1`,
        '#10b981',
        LineStyle.Dashed,
        2
      );
      addPriceLine(
        tradingPlan.target2.price,
        lang === 'ar' ? `هدف 2 (+${tradingPlan.target2.upsidePct}%)` : `Target 2`,
        '#059669',
        LineStyle.LargeDashed,
        2
      );
    }

    // 5. Crosshair Readout
    const lastCandle = cleanCandles[cleanCandles.length - 1];
    const prevLast = cleanCandles[cleanCandles.length - 2] || lastCandle;
    setHoveredInfo({
      date: lastCandle.date,
      open: lastCandle.open,
      high: lastCandle.high,
      low: lastCandle.low,
      close: lastCandle.close,
      volume: lastCandle.volume,
      changePct: prevLast.close > 0 ? Number((((lastCandle.close - prevLast.close) / prevLast.close) * 100).toFixed(2)) : 0
    });

    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setHoveredInfo({
          date: lastCandle.date,
          open: lastCandle.open,
          high: lastCandle.high,
          low: lastCandle.low,
          close: lastCandle.close,
          volume: lastCandle.volume,
          changePct: prevLast.close > 0 ? Number((((lastCandle.close - prevLast.close) / prevLast.close) * 100).toFixed(2)) : 0
        });
        return;
      }
      const dateStr = String(param.time);
      const idx = cleanCandles.findIndex((c) => c.date === dateStr);
      if (idx >= 0) {
        const c = cleanCandles[idx];
        const prev = cleanCandles[Math.max(0, idx - 1)];
        setHoveredInfo({
          date: c.date,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          changePct: prev.close > 0 ? Number((((c.close - prev.close) / prev.close) * 100).toFixed(2)) : 0
        });
      }
    });

    // Trigger drawing SVG re-projection on pan/zoom
    const onRangeChange = () => {
      setRenderTick((t) => t + 1);
      if (subChartRef.current) {
        const range = chart.timeScale().getVisibleLogicalRange();
        if (range) {
          subChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      }
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);

    // Show last ~75 candles nicely on initial load
    const totalBars = cleanCandles.length;
    if (totalBars > 75) {
      chart.timeScale().setVisibleLogicalRange({
        from: totalBars - 75,
        to: totalBars + 5
      });
    } else {
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (mainContainerRef.current && mainChartRef.current) {
        mainChartRef.current.applyOptions({ width: mainContainerRef.current.clientWidth });
        setRenderTick((t) => t + 1);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRangeChange);
      chart.remove();
      mainChartRef.current = null;
      mainSeriesRef.current = null;
    };
  }, [
    cleanCandles,
    indicators,
    chartStyle,
    scaleMode,
    showEma9,
    showEma20,
    showEma50,
    showEma200,
    showBollinger,
    showVolume,
    showZones,
    showFib,
    showPlanLines,
    tradingPlan,
    technicals,
    height,
    lang
  ]);

  // Build Synchronized Sub-Chart (RSI / MACD)
  useEffect(() => {
    const container = subContainerRef.current;
    if (!container || subChart === 'NONE' || cleanCandles.length === 0) return;

    const sub = createChart(container, {
      width: container.clientWidth,
      height: 130,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)' }
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.12, bottom: 0.12 }
      },
      timeScale: {
        borderColor: '#1e293b',
        visible: true,
        rightOffset: 8,
        barSpacing: 8
      },
      crosshair: {
        mode: CrosshairMode.Normal
      }
    });

    subChartRef.current = sub;

    if (subChart === 'RSI') {
      const rsiSeries = sub.addSeries(LineSeries, {
        color: '#a855f7',
        lineWidth: 2
      });
      const rsiData = cleanCandles
        .map((c, i) => (indicators.rsi[i] !== null ? { time: c.date, value: indicators.rsi[i]! } : null))
        .filter((d): d is { time: string; value: number } => d !== null);
      rsiSeries.setData(rsiData);

      rsiSeries.createPriceLine({
        price: 70,
        color: 'rgba(244, 63, 94, 0.6)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '70'
      });
      rsiSeries.createPriceLine({
        price: 30,
        color: 'rgba(16, 185, 129, 0.6)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '30'
      });
    } else if (subChart === 'MACD') {
      const histSeries = sub.addSeries(HistogramSeries, {
        priceLineVisible: false
      });
      const histData = cleanCandles
        .map((c, i) =>
          indicators.macd.histogram[i] !== null
            ? {
                time: c.date,
                value: indicators.macd.histogram[i]!,
                color: indicators.macd.histogram[i]! >= 0 ? 'rgba(16, 185, 129, 0.65)' : 'rgba(244, 63, 94, 0.65)'
              }
            : null
        )
        .filter((d): d is { time: string; value: number; color: string } => d !== null);
      histSeries.setData(histData);

      const macdLineSeries = sub.addSeries(LineSeries, {
        color: '#38bdf8',
        lineWidth: 2,
        priceLineVisible: false
      });
      macdLineSeries.setData(
        cleanCandles
          .map((c, i) => (indicators.macd.macdLine[i] !== null ? { time: c.date, value: indicators.macd.macdLine[i]! } : null))
          .filter((d): d is { time: string; value: number } => d !== null)
      );

      const signalSeries = sub.addSeries(LineSeries, {
        color: '#f97316',
        lineWidth: 1,
        priceLineVisible: false
      });
      signalSeries.setData(
        cleanCandles
          .map((c, i) => (indicators.macd.signalLine[i] !== null ? { time: c.date, value: indicators.macd.signalLine[i]! } : null))
          .filter((d): d is { time: string; value: number } => d !== null)
      );
    }

    // Sync initial visible range from main chart
    if (mainChartRef.current) {
      const mainRange = mainChartRef.current.timeScale().getVisibleLogicalRange();
      if (mainRange) {
        sub.timeScale().setVisibleLogicalRange(mainRange);
      }
    }

    const onSubRangeChange = () => {
      if (mainChartRef.current) {
        const range = sub.timeScale().getVisibleLogicalRange();
        if (range) {
          mainChartRef.current.timeScale().setVisibleLogicalRange(range);
        }
      }
    };
    sub.timeScale().subscribeVisibleLogicalRangeChange(onSubRangeChange);

    const handleResize = () => {
      if (subContainerRef.current && subChartRef.current) {
        subChartRef.current.applyOptions({ width: subContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      sub.timeScale().unsubscribeVisibleLogicalRangeChange(onSubRangeChange);
      sub.remove();
      subChartRef.current = null;
    };
  }, [subChart, cleanCandles, indicators]);

  // Coordinate helpers for Interactive Drawing Overlay
  const toChartPoint = useCallback((clientX: number, clientY: number): ChartPoint | null => {
    const container = mainContainerRef.current;
    const chart = mainChartRef.current;
    const series = mainSeriesRef.current;
    if (!container || !chart || !series) return null;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const logical = chart.timeScale().coordinateToLogical(x);
    const price = series.coordinateToPrice(y);
    if (logical === null || price === null) return null;

    return { logical: Number(logical), price: Number(price) };
  }, []);

  const toPixelPoint = useCallback((pt: ChartPoint): { x: number; y: number } | null => {
    const chart = mainChartRef.current;
    const series = mainSeriesRef.current;
    if (!chart || !series) return null;

    const x = chart.timeScale().logicalToCoordinate(pt.logical as Logical);
    const y = series.priceToCoordinate(pt.price);
    if (x === null || y === null) return null;
    return { x: Number(x), y: Number(y) };
  }, []);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drawingTool === 'CURSOR') return;
    const pt = toChartPoint(e.clientX, e.clientY);
    if (!pt) return;

    if (drawingTool === 'HLINE') {
      setDrawings((prev) => [
        ...prev,
        { id: `${Date.now()}`, type: 'HLINE', p1: pt }
      ]);
      setDrawingTool('CURSOR');
      return;
    }

    if (!draftDrawing) {
      setDraftDrawing({
        id: `${Date.now()}`,
        type: drawingTool,
        p1: pt,
        p2: pt
      });
    } else {
      setDrawings((prev) => [...prev, { ...draftDrawing, p2: pt }]);
      setDraftDrawing(null);
      setDrawingTool('CURSOR');
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draftDrawing) return;
    const pt = toChartPoint(e.clientX, e.clientY);
    if (!pt) return;
    setDraftDrawing((prev) => (prev ? { ...prev, p2: pt } : null));
  };

  const handleFitContent = () => {
    mainChartRef.current?.timeScale().fitContent();
  };

  const handleScreenshot = () => {
    if (!mainChartRef.current) return;
    try {
      const canvas = mainChartRef.current.takeScreenshot(true, false);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ticker}-TradingView-EGX.png`;
      a.click();
    } catch (err) {
      console.error('Screenshot failed:', err);
    }
  };

  const allDrawings = draftDrawing ? [...drawings, draftDrawing] : drawings;
  const svgWidth = mainContainerRef.current?.clientWidth || 800;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Top Pro Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 border border-slate-800 rounded-xl p-2">
        {/* Timeframes & Candle Styles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            {(['1D', '1W', '1M'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  timeframe === tf
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === '1D' ? (lang === 'ar' ? 'يومي' : '1D') : tf === '1W' ? (lang === 'ar' ? 'أسبوعي' : '1W') : (lang === 'ar' ? 'شهري' : '1M')}
              </button>
            ))}
          </div>

          {/* Series Style Selector */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
            <CandlestickChart className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={chartStyle}
              onChange={(e) => setChartStyle(e.target.value as ChartSeriesStyle)}
              className="bg-transparent text-xs text-slate-200 font-semibold outline-none cursor-pointer"
            >
              <option value="CANDLES">{lang === 'ar' ? 'شموع يابانية' : 'Candles'}</option>
              <option value="HOLLOW">{lang === 'ar' ? 'شموع مفرغة' : 'Hollow Candles'}</option>
              <option value="BARS">{lang === 'ar' ? 'أعمدة OHLC' : 'Bars'}</option>
              <option value="AREA">{lang === 'ar' ? 'مساحي (Area)' : 'Area'}</option>
              <option value="LINE">{lang === 'ar' ? 'خطي (Line)' : 'Line'}</option>
            </select>
          </div>

          {/* Scale Mode */}
          <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
            {(['NORMAL', 'PERCENT', 'LOG'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setScaleMode(m)}
                className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  scaleMode === m ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'NORMAL' ? (lang === 'ar' ? 'عادي' : 'Lin') : m === 'PERCENT' ? '%' : 'Log'}
              </button>
            ))}
          </div>
        </div>

        {/* Indicators & Overlays */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setShowEma20((v) => !v)}
            className={`px-2 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showEma20 ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            EMA 20
          </button>
          <button
            type="button"
            onClick={() => setShowEma50((v) => !v)}
            className={`px-2 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showEma50 ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            EMA 50
          </button>
          <button
            type="button"
            onClick={() => setShowEma9((v) => !v)}
            className={`px-2 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showEma9 ? 'bg-fuchsia-950/70 border-fuchsia-500/50 text-fuchsia-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            EMA 9
          </button>
          <button
            type="button"
            onClick={() => setShowEma200((v) => !v)}
            className={`px-2 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showEma200 ? 'bg-purple-950/70 border-purple-500/50 text-purple-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            EMA 200
          </button>
          <button
            type="button"
            onClick={() => setShowBollinger((v) => !v)}
            className={`px-2 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showBollinger ? 'bg-blue-950/70 border-blue-500/50 text-blue-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            BB (20,2)
          </button>
          <button
            type="button"
            onClick={() => setShowVolume((v) => !v)}
            className={`px-2 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showVolume ? 'bg-slate-800 border-slate-600 text-slate-200 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {lang === 'ar' ? 'الحجم' : 'Vol'}
          </button>
          <button
            type="button"
            onClick={() => setShowZones((v) => !v)}
            className={`px-2 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showZones ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {lang === 'ar' ? 'الدعم/المقاومة' : 'S/R'}
          </button>
          <button
            type="button"
            onClick={() => setShowFib((v) => !v)}
            className={`px-2 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showFib ? 'bg-yellow-950/70 border-yellow-500/50 text-yellow-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {lang === 'ar' ? 'فيبوناتشي' : 'Fib'}
          </button>
          <button
            type="button"
            onClick={() => setShowPlanLines((v) => !v)}
            className={`px-2 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showPlanLines ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {lang === 'ar' ? 'أهداف AI ووقف الخسارة' : 'AI Targets & Stop'}
          </button>

          {/* Sub-Chart Oscillator Selector */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
            <Activity className="w-3 h-3 text-purple-400" />
            <select
              value={subChart}
              onChange={(e) => setSubChart(e.target.value as 'RSI' | 'MACD' | 'NONE')}
              className="bg-transparent text-slate-200 font-semibold outline-none cursor-pointer"
            >
              <option value="RSI">RSI (14)</option>
              <option value="MACD">MACD (12,26,9)</option>
              <option value="NONE">{lang === 'ar' ? 'بدون مؤشر سفلي' : 'No Oscillator'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live OHLCV Crosshair Header */}
      {hoveredInfo && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono-numbers">
          <div className="flex flex-wrap items-center gap-3.5 text-slate-300">
            <span className="font-bold text-white">{ticker}</span>
            <span className="text-slate-400">{hoveredInfo.date}</span>
            <span>
              {lang === 'ar' ? 'فتح' : 'O'}: <strong className="text-white">{hoveredInfo.open}</strong>
            </span>
            <span>
              {lang === 'ar' ? 'أعلى' : 'H'}: <strong className="text-emerald-400">{hoveredInfo.high}</strong>
            </span>
            <span>
              {lang === 'ar' ? 'أدنى' : 'L'}: <strong className="text-rose-400">{hoveredInfo.low}</strong>
            </span>
            <span>
              {lang === 'ar' ? 'إغلاق' : 'C'}:{' '}
              <strong className={hoveredInfo.close >= hoveredInfo.open ? 'text-emerald-400' : 'text-rose-400'}>
                {hoveredInfo.close} {currency === 'USD' ? '$' : lang === 'ar' ? 'جم' : 'EGP'}
              </strong>
            </span>
            <span className={hoveredInfo.changePct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              ({hoveredInfo.changePct >= 0 ? `+${hoveredInfo.changePct}%` : `${hoveredInfo.changePct}%`})
            </span>
            <span>
              {lang === 'ar' ? 'حجم' : 'Vol'}:{' '}
              <strong className="text-sky-400">{hoveredInfo.volume.toLocaleString()}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFitContent}
              title={lang === 'ar' ? 'إعادة ضبط التكبير' : 'Fit Chart'}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-sans"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{lang === 'ar' ? 'ملاءمة' : 'Fit'}</span>
            </button>
            <button
              type="button"
              onClick={handleScreenshot}
              title={lang === 'ar' ? 'حفظ صورة الشارت' : 'Save Snapshot'}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-sans"
            >
              <Camera className="w-3 h-3" />
              <span>PNG</span>
            </button>
          </div>
        </div>
      )}

      {/* Workspace: Left Drawing Toolbar + Main Chart + Sub Chart */}
      <div className="flex gap-2 items-stretch" dir="ltr">
        {/* TradingView-style Left Drawing Toolbar */}
        <div className="flex flex-col items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1.5 shrink-0">
          {[
            { id: 'CURSOR' as const, icon: MousePointer2, label: lang === 'ar' ? 'مؤشر التصفح والتكبير' : 'Crosshair / Pan' },
            { id: 'TRENDLINE' as const, icon: TrendingUp, label: lang === 'ar' ? 'خط اتجاه (Trendline)' : 'Trendline' },
            { id: 'HLINE' as const, icon: Minus, label: lang === 'ar' ? 'خط سعر أفقي' : 'Horizontal Line' },
            { id: 'FIB' as const, icon: GitCommitHorizontal, label: lang === 'ar' ? 'تصحيح فيبوناتشي' : 'Fib Retracement' },
            { id: 'LONG_POS' as const, icon: Target, label: lang === 'ar' ? 'أداة حساب صفقة (Entry / R:R)' : 'Long Position R:R' },
            { id: 'RULER' as const, icon: Ruler, label: lang === 'ar' ? 'مسطرة قياس السعر والنسبة' : 'Measure Ruler' }
          ].map((tool) => {
            const Icon = tool.icon;
            const active = drawingTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                title={tool.label}
                onClick={() => {
                  setDraftDrawing(null);
                  setDrawingTool(tool.id);
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}

          <div className="w-5 h-px bg-slate-800 my-1" />

          <button
            type="button"
            title={lang === 'ar' ? 'تراجع عن آخر رسم' : 'Undo Last Drawing'}
            disabled={drawings.length === 0}
            onClick={() => setDrawings((prev) => prev.slice(0, -1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            title={lang === 'ar' ? 'مسح كل الرسومات' : 'Clear Drawings'}
            disabled={drawings.length === 0 && !draftDrawing}
            onClick={() => {
              setDrawings([]);
              setDraftDrawing(null);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-950/50 disabled:opacity-30"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chart Area (Strictly LTR for coordinate accuracy) */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {drawingTool !== 'CURSOR' && (
            <div
              className="px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 font-semibold flex items-center justify-between"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              <span>
                {drawingTool === 'HLINE'
                  ? lang === 'ar'
                    ? 'اضغط على الرسم البياني لتثبيت خط السعر الأفقي'
                    : 'Click on chart to place Horizontal Line'
                  : draftDrawing
                  ? lang === 'ar'
                    ? 'اضغط النقطة الثانية لإتمام الرسم'
                    : 'Click second point to complete drawing'
                  : lang === 'ar'
                  ? 'اضغط النقطة الأولى على الرسم البياني لبدء الرسم'
                  : 'Click first point on chart to start drawing'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDraftDrawing(null);
                  setDrawingTool('CURSOR');
                }}
                className="text-xs underline text-slate-300 hover:text-white"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}

          {/* Main Candlestick Canvas + Interactive SVG Drawing Layer */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#090d16]">
            <div ref={mainContainerRef} className="w-full" style={{ height: `${height}px` }} />

            {/* Coordinate-synced SVG Drawing Overlay */}
            <svg
              width={svgWidth}
              height={height}
              onClick={handleSvgClick}
              onMouseMove={handleSvgMouseMove}
              className={`absolute inset-0 z-10 ${
                drawingTool === 'CURSOR' ? 'pointer-events-none' : 'pointer-events-auto cursor-crosshair'
              }`}
            >
              {allDrawings.map((d) => {
                const px1 = toPixelPoint(d.p1);
                if (!px1) return null;

                if (d.type === 'HLINE') {
                  return (
                    <g key={d.id}>
                      <line x1={0} y1={px1.y} x2={svgWidth} y2={px1.y} stroke="#38bdf8" strokeWidth="1.5" />
                      <rect x={8} y={px1.y - 10} width="64" height="18" rx="4" fill="#0284c7" />
                      <text x={40} y={px1.y + 3} fill="#fff" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">
                        {d.p1.price.toFixed(2)}
                      </text>
                    </g>
                  );
                }

                const px2 = d.p2 ? toPixelPoint(d.p2) : null;
                if (!px2 || !d.p2) return null;

                if (d.type === 'TRENDLINE') {
                  return (
                    <g key={d.id}>
                      <line x1={px1.x} y1={px1.y} x2={px2.x} y2={px2.y} stroke="#38bdf8" strokeWidth="2" />
                      <circle cx={px1.x} cy={px1.y} r="4" fill="#38bdf8" />
                      <circle cx={px2.x} cy={px2.y} r="4" fill="#38bdf8" />
                    </g>
                  );
                }

                if (d.type === 'RULER') {
                  const left = Math.min(px1.x, px2.x);
                  const top = Math.min(px1.y, px2.y);
                  const w = Math.max(4, Math.abs(px2.x - px1.x));
                  const h = Math.max(4, Math.abs(px2.y - px1.y));
                  const priceDiff = d.p2.price - d.p1.price;
                  const pct = d.p1.price !== 0 ? (priceDiff / d.p1.price) * 100 : 0;
                  const bars = Math.abs(Math.round(d.p2.logical - d.p1.logical));
                  const isUp = priceDiff >= 0;
                  return (
                    <g key={d.id}>
                      <rect
                        x={left}
                        y={top}
                        width={w}
                        height={h}
                        fill={isUp ? 'rgba(16, 185, 129, 0.14)' : 'rgba(244, 63, 94, 0.14)'}
                        stroke={isUp ? '#10b981' : '#f43f5e'}
                        strokeWidth="1"
                        strokeDasharray="4 3"
                      />
                      <rect
                        x={left + w / 2 - 70}
                        y={top - 26}
                        width="140"
                        height="22"
                        rx="5"
                        fill={isUp ? '#065f46' : '#881337'}
                      />
                      <text
                        x={left + w / 2}
                        y={top - 11}
                        fill="#fff"
                        fontSize="10"
                        fontFamily="JetBrains Mono"
                        textAnchor="middle"
                      >
                        {`${priceDiff >= 0 ? '+' : ''}${priceDiff.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%) · ${bars}b`}
                      </text>
                    </g>
                  );
                }

                if (d.type === 'FIB') {
                  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
                  const colors = ['#94a3b8', '#f59e0b', '#10b981', '#06b6d4', '#eab308', '#a855f7', '#94a3b8'];
                  const minX = Math.min(px1.x, px2.x);
                  const maxX = Math.max(px1.x, px2.x, minX + 180);
                  return (
                    <g key={d.id}>
                      <line x1={px1.x} y1={px1.y} x2={px2.x} y2={px2.y} stroke="#eab308" strokeDasharray="3 3" strokeWidth="1" />
                      {levels.map((ratio, idx) => {
                        const y = px1.y + (px2.y - px1.y) * ratio;
                        const priceVal = d.p1.price + (d.p2!.price - d.p1.price) * ratio;
                        return (
                          <g key={ratio}>
                            <line x1={minX} y1={y} x2={maxX} y2={y} stroke={colors[idx]} strokeWidth="1.2" strokeOpacity="0.85" />
                            <text x={minX + 4} y={y - 3} fill={colors[idx]} fontSize="10" fontFamily="JetBrains Mono">
                              {`${(ratio * 100).toFixed(1)}% (${priceVal.toFixed(2)})`}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                }

                if (d.type === 'LONG_POS') {
                  // p1 = entry, p2 = target; stop mirrors at 0.5x risk or bottom
                  const entryY = px1.y;
                  const targetY = Math.min(px1.y - 10, px2.y);
                  const rewardPx = Math.max(12, entryY - targetY);
                  const riskPx = Math.max(10, rewardPx * 0.5);
                  const stopY = entryY + riskPx;
                  const left = Math.min(px1.x, px2.x);
                  const width = Math.max(110, Math.abs(px2.x - px1.x));
                  const targetPrice = Math.max(d.p1.price, d.p2.price);
                  const rewardVal = targetPrice - d.p1.price;
                  const stopPrice = d.p1.price - rewardVal * 0.5;
                  return (
                    <g key={d.id}>
                      {/* Profit zone */}
                      <rect x={left} y={targetY} width={width} height={rewardPx} fill="rgba(16, 185, 129, 0.22)" stroke="#10b981" strokeWidth="1" />
                      {/* Stop zone */}
                      <rect x={left} y={entryY} width={width} height={riskPx} fill="rgba(244, 63, 94, 0.22)" stroke="#f43f5e" strokeWidth="1" />
                      <line x1={left} y1={entryY} x2={left + width} y2={entryY} stroke="#e2e8f0" strokeWidth="1.5" />
                      <text x={left + 6} y={targetY + 13} fill="#a7f3d0" fontSize="10" fontFamily="JetBrains Mono">
                        {`Target: ${targetPrice.toFixed(2)} (R:R 2.0)`}
                      </text>
                      <text x={left + 6} y={stopY - 4} fill="#fecdd3" fontSize="10" fontFamily="JetBrains Mono">
                        {`Stop: ${stopPrice.toFixed(2)}`}
                      </text>
                    </g>
                  );
                }

                return null;
              })}
            </svg>
          </div>

          {/* Synchronized Sub-Chart Pane (RSI / MACD) */}
          {subChart !== 'NONE' && (
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#090d16]">
              <div className="absolute top-1.5 left-2.5 z-10 pointer-events-none flex items-center gap-3 text-[10px] font-mono">
                {subChart === 'RSI' ? (
                  <span className="text-purple-400 font-bold">RSI (14): {technicals.rsi14}</span>
                ) : (
                  <>
                    <span className="text-sky-400 font-bold">MACD: {technicals.macd.macdLine}</span>
                    <span className="text-orange-400 font-bold">Signal: {technicals.macd.signalLine}</span>
                    <span className="text-emerald-400 font-bold">Hist: {technicals.macd.histogram}</span>
                  </>
                )}
              </div>
              <div ref={subContainerRef} className="w-full" style={{ height: '130px' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

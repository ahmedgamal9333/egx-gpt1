import React, { useState } from 'react';
import { Candle, TechnicalIndicatorsResult, InvestmentPlanResult } from '../types';
import { TradingViewWidget } from './TradingViewWidget';
import { TradingViewLightweightEngine } from './TradingViewLightweightEngine';
import { Maximize2, Minimize2, LineChart, Cpu, ExternalLink } from 'lucide-react';

interface InteractiveChartProps {
  ticker?: string;
  stockNameAr?: string;
  currency?: 'EGP' | 'USD';
  candles: Candle[];
  technicals: TechnicalIndicatorsResult;
  tradingPlan?: InvestmentPlanResult;
  timeframe: '1D' | '1W' | '1M';
  onTimeframeChange: (tf: '1D' | '1W' | '1M') => void;
  lang?: 'ar' | 'en';
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  ticker = 'COMI',
  stockNameAr,
  currency = 'EGP',
  candles,
  technicals,
  tradingPlan,
  timeframe,
  onTimeframeChange,
  lang = 'ar'
}) => {
  const [chartMode, setChartMode] = useState<'TRADINGVIEW_LIVE' | 'AI_ENGINE'>('TRADINGVIEW_LIVE');
  const [tvInterval, setTvInterval] = useState<'15' | '60' | '240' | 'D' | 'W' | 'M'>('D');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const tvSymbol = `EGX:${ticker.replace('.CA', '').toUpperCase()}`;

  const handleTvIntervalChange = (interval: '15' | '60' | '240' | 'D' | 'W' | 'M') => {
    setTvInterval(interval);
    if (interval === 'W') onTimeframeChange('1W');
    else if (interval === 'M') onTimeframeChange('1M');
    else onTimeframeChange('1D');
  };

  return (
    <div
      className={`bg-slate-900/95 border border-slate-800 shadow-2xl flex flex-col gap-3 transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-4 overflow-y-auto rounded-none'
          : 'rounded-2xl p-4'
      }`}
    >
      {/* Top Unified TradingView Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        {/* Title & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-white leading-tight whitespace-nowrap">
                {lang === 'ar'
                  ? `الرسم البياني الاحترافي - ${tvSymbol}`
                  : `TradingView Chart - ${tvSymbol}`}
              </h2>
              {stockNameAr && (
                <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
                  {stockNameAr}
                </p>
              )}
            </div>
          </div>

          {/* Segmented Switcher: Official TradingView Live vs AI Engine */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setChartMode('TRADINGVIEW_LIVE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                chartMode === 'TRADINGVIEW_LIVE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'TradingView المباشر' : 'TradingView Live'}</span>
            </button>

            <button
              type="button"
              onClick={() => setChartMode('AI_ENGINE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                chartMode === 'AI_ENGINE'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'أهداف AI + أدوات الرسم' : 'AI Overlays + Draw'}</span>
            </button>
          </div>
        </div>

        {/* Quick Controls (Timeframe for Live Widget, Open External, Fullscreen) */}
        <div className="flex flex-wrap items-center gap-2">
          {chartMode === 'TRADINGVIEW_LIVE' && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-[11px]">
              {(
                [
                  { id: '15', label: '15m' },
                  { id: '60', label: '1H' },
                  { id: '240', label: '4H' },
                  { id: 'D', label: '1D' },
                  { id: 'W', label: '1W' },
                  { id: 'M', label: '1M' }
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTvIntervalChange(item.id)}
                  className={`px-2 py-1 rounded-md font-bold transition-colors whitespace-nowrap shrink-0 ${
                    tvInterval === item.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <a
            href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors whitespace-nowrap shrink-0"
            title={lang === 'ar' ? 'فتح السهم على موقع TradingView' : 'Open on TradingView'}
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">TradingView.com</span>
          </a>

          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors whitespace-nowrap shrink-0"
            title={isFullscreen ? (lang === 'ar' ? 'تصغير' : 'Exit Fullscreen') : (lang === 'ar' ? 'ملء الشاشة' : 'Fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isFullscreen ? (lang === 'ar' ? 'خروج' : 'Exit') : (lang === 'ar' ? 'ملء الشاشة' : 'Fullscreen')}</span>
          </button>
        </div>
      </div>

      {/* Active Chart Canvas */}
      {chartMode === 'TRADINGVIEW_LIVE' ? (
        <TradingViewWidget
          symbol={tvSymbol}
          interval={tvInterval}
          lang={lang}
          height={isFullscreen ? Math.max(540, window.innerHeight - 210) : 580}
          studies={['STD;EMA', 'STD;RSI']}
          allowSymbolChange={true}
          hideSideToolbar={false}
          onFallbackRequested={() => setChartMode('AI_ENGINE')}
        />
      ) : (
        <TradingViewLightweightEngine
          ticker={ticker}
          candles={candles}
          technicals={technicals}
          tradingPlan={tradingPlan}
          timeframe={timeframe}
          onTimeframeChange={onTimeframeChange}
          lang={lang}
          height={isFullscreen ? Math.max(460, window.innerHeight - 310) : 450}
          currency={currency}
        />
      )}

      {/* AI Key Levels Quick Reference Bar */}
      {tradingPlan && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/70 text-xs font-mono-numbers">
          <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block font-sans">
              {lang === 'ar' ? 'منطقة الدخول المفضلة' : 'Entry Zone'}
            </span>
            <strong className="text-cyan-400">
              {tradingPlan.preferredEntryZone.min} - {tradingPlan.preferredEntryZone.max}
            </strong>
          </div>
          <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block font-sans">
              {lang === 'ar' ? 'وقف الخسارة' : 'Stop Loss'}
            </span>
            <strong className="text-rose-400">
              {tradingPlan.stopLossPrice} (-{tradingPlan.stopLossPct}%)
            </strong>
          </div>
          <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block font-sans">
              {lang === 'ar' ? 'الهدف الأول' : 'Target 1'}
            </span>
            <strong className="text-emerald-400">
              {tradingPlan.target1.price} (+{tradingPlan.target1.upsidePct}%)
            </strong>
          </div>
          <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block font-sans">
              {lang === 'ar' ? 'الهدف الثاني' : 'Target 2'}
            </span>
            <strong className="text-emerald-300">
              {tradingPlan.target2.price} (+{tradingPlan.target2.upsidePct}%)
            </strong>
          </div>
          <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block font-sans">
              {lang === 'ar' ? 'نسبة العائد للمخاطرة' : 'Reward : Risk'}
            </span>
            <strong className="text-amber-400">1 : {tradingPlan.rewardRiskRatio}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

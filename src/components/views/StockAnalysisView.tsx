import React, { useState } from 'react';
import { DetailedStockPayload } from '../../types';
import { InteractiveChart } from '../InteractiveChart';
import { TradingPlanCard } from '../TradingPlanCard';
import {
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  FileText,
  Sliders,
  RefreshCw,
  ExternalLink,
  Building2,
  AlertCircle,
  CandlestickChart
} from 'lucide-react';

interface StockAnalysisViewProps {
  data: DetailedStockPayload;
  onRefreshData?: () => void;
  lang?: 'ar' | 'en';
}

export const StockAnalysisView: React.FC<StockAnalysisViewProps> = ({
  data,
  onRefreshData,
  lang = 'ar'
}) => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M'>('1D');
  const [activeTab, setActiveTab] = useState<'PLAN' | 'TECH' | 'FUND' | 'VALUATION' | 'NEWS' | 'AI_REPORT'>('AI_REPORT');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [currentAiReport, setCurrentAiReport] = useState<string>(data.aiDecision.arabicAiReport);

  React.useEffect(() => {
    setCurrentAiReport(data.aiDecision.arabicAiReport);
  }, [data.stock.ticker, data.aiDecision.arabicAiReport]);

  const handleGenerateAiReport = () => {
    setIsGeneratingReport(true);
    fetch(`/api/stocks/${data.stock.ticker}/ai-report`, { method: 'POST' })
      .then(res => res.json())
      .then(decision => {
        if (decision.arabicAiReport) {
          setCurrentAiReport(decision.arabicAiReport);
        }
        setIsGeneratingReport(false);
      })
      .catch(err => {
        console.error("Failed to generate fresh AI report:", err);
        setIsGeneratingReport(false);
      });
  };
  
  // Custom DCF sliders
  const [customWacc, setCustomWacc] = useState<number>(data.fairValueValuation.dcfAssumptions.waccDiscountRate);
  const [customGrowth, setCustomGrowth] = useState<number>(data.fairValueValuation.dcfAssumptions.terminalGrowthRate);

  // Recalculate dynamic fair value based on slider
  const dynamicFairValue = Number((
    data.fairValueValuation.estimatedFairValue * 
    (1 + (customGrowth - data.fairValueValuation.dcfAssumptions.terminalGrowthRate) * 0.04) *
    (1 - (customWacc - data.fairValueValuation.dcfAssumptions.waccDiscountRate) * 0.03)
  ).toFixed(2));
  const dynamicMargin = Number((((dynamicFairValue - data.stock.currentPrice) / data.stock.currentPrice) * 100).toFixed(1));

  const candles = timeframe === '1D' ? data.candlesDaily : timeframe === '1W' ? data.candlesWeekly : data.candlesMonthly;

  return (
    <div className="space-y-6">
      {/* Stock Top Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-mono font-black text-2xl text-white tracking-wide">
              {data.stock.ticker}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {data.stock.yahooTicker}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {data.stock.isin}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              {data.stock.index}
            </span>
          </div>

          <h1 className="text-xl lg:text-2xl font-black text-white">
            {data.stock.nameAr}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{data.stock.nameEn}</span>
            <span>•</span>
            <span className="text-cyan-400 font-semibold">{data.stock.sectorAr}</span>
            <span>•</span>
            <span>{data.stock.industryAr}</span>
          </div>
        </div>

        {/* Live Price & Change Badge */}
        <div className="flex items-center gap-5 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 font-mono-numbers">
          <div>
            <span className="text-[11px] text-slate-400 block">{lang === 'ar' ? 'السعر السوقي اللحظي' : 'Market Price'}</span>
            <span className="text-2xl lg:text-3xl font-black text-white">
              {data.stock.currentPrice} <span className="text-sm font-normal text-slate-400">جم</span>
            </span>
          </div>
          <div className="w-px h-10 bg-slate-800"></div>
          <div>
            <span className="text-[11px] text-slate-400 block">{lang === 'ar' ? 'التغير اليومي' : 'Daily Change'}</span>
            <div className={`text-base font-bold flex items-center gap-1 ${data.technicalAnalysis.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <TrendingUp className="w-4 h-4" />
              {data.technicalAnalysis.changePct >= 0 ? `+${data.technicalAnalysis.changePct}%` : `${data.technicalAnalysis.changePct}%`}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {lang === 'ar' ? `إغلاق سابق: ${data.stock.prevClose} جم` : `Prev: ${data.stock.prevClose}`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive TradingView Candlestick Chart */}
      <InteractiveChart
        ticker={data.stock.tvTicker || data.stock.ticker}
        stockNameAr={data.stock.nameAr}
        currency={data.stock.currency}
        candles={candles}
        technicals={data.technicalAnalysis}
        tradingPlan={data.aiDecision}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        lang={lang}
      />

      {/* Last Candles Reading & TradingView Chart Structure Panel */}
      {data.technicalAnalysis.lastCandlesAnalysis && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CandlestickChart className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white">
                  {lang === 'ar'
                    ? `قراءة آخر ${data.technicalAnalysis.lastCandlesAnalysis.candlesCount} شموع على شارت TradingView (${data.stock.ticker})`
                    : `Last ${data.technicalAnalysis.lastCandlesAnalysis.candlesCount} Candles Reading (${data.stock.ticker})`}
                </h3>
                <p className="text-xs text-slate-400">
                  {data.technicalAnalysis.lastCandlesAnalysis.dataSourceLabel} · {data.technicalAnalysis.lastCandlesAnalysis.tradingViewRatingAr}
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold">
              <span
                className={
                  data.technicalAnalysis.lastCandlesAnalysis.shortTermBias === 'BULLISH'
                    ? 'text-emerald-400'
                    : data.technicalAnalysis.lastCandlesAnalysis.shortTermBias === 'BEARISH'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }
              >
                {data.technicalAnalysis.lastCandlesAnalysis.dominantPriceActionAr}
              </span>
            </div>
          </div>

          {/* Price Action Summary */}
          <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
            {data.technicalAnalysis.lastCandlesAnalysis.candlestickSummaryAr}
          </p>

          {/* Last 5 Daily Candles OHLCV Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono-numbers">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3 text-right font-sans">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="py-2 px-2 text-left">{lang === 'ar' ? 'افتتاح' : 'Open'}</th>
                  <th className="py-2 px-2 text-left">{lang === 'ar' ? 'أعلى' : 'High'}</th>
                  <th className="py-2 px-2 text-left">{lang === 'ar' ? 'أدنى' : 'Low'}</th>
                  <th className="py-2 px-2 text-left">{lang === 'ar' ? 'إغلاق' : 'Close'}</th>
                  <th className="py-2 px-2 text-left">{lang === 'ar' ? 'التغير' : 'Chg%'}</th>
                  <th className="py-2 px-2 text-left">{lang === 'ar' ? 'السيولة' : 'RVOL'}</th>
                  <th className="py-2 px-3 text-right font-sans">{lang === 'ar' ? 'نمط وقراءة الشمعة' : 'Candlestick Reading'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[...data.technicalAnalysis.lastCandlesAnalysis.recentBars].reverse().map((bar) => (
                  <tr key={bar.date} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-300 font-semibold whitespace-nowrap">{bar.date}</td>
                    <td className="py-2.5 px-2 text-slate-300">{bar.open}</td>
                    <td className="py-2.5 px-2 text-emerald-400">{bar.high}</td>
                    <td className="py-2.5 px-2 text-rose-400">{bar.low}</td>
                    <td className={`py-2.5 px-2 font-bold ${bar.close >= bar.open ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {bar.close}
                    </td>
                    <td className={`py-2.5 px-2 font-bold ${bar.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {bar.changePct >= 0 ? `+${bar.changePct}%` : `${bar.changePct}%`}
                    </td>
                    <td className="py-2.5 px-2 text-cyan-400">{bar.volumeRatio}x</td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <span
                        className={`font-bold block ${
                          bar.candleSignal === 'BULLISH'
                            ? 'text-emerald-400'
                            : bar.candleSignal === 'BEARISH'
                            ? 'text-rose-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {bar.candleTypeAr}
                      </span>
                      <span className="text-[11px] text-slate-400">{bar.noteAr}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Verified Support & Resistance Zones extracted from Chart Swings & Pivots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-emerald-900/40 space-y-2">
              <h4 className="text-xs font-bold text-emerald-400">
                {lang === 'ar' ? 'الدعوم الفعلية المستخرجة من الشارت:' : 'Chart-Verified Support Levels:'}
              </h4>
              <div className="space-y-1.5 text-xs">
                {data.technicalAnalysis.supportZones.map((z, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <span className="text-slate-300">{z.description}</span>
                    <strong className="font-mono-numbers text-emerald-400 shrink-0">{z.priceLevel}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-rose-900/40 space-y-2">
              <h4 className="text-xs font-bold text-rose-400">
                {lang === 'ar' ? 'المقاومات والأهداف الفعلية المستخرجة من الشارت:' : 'Chart-Verified Resistance Levels:'}
              </h4>
              <div className="space-y-1.5 text-xs">
                {data.technicalAnalysis.resistanceZones.map((z, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <span className="text-slate-300">{z.description}</span>
                    <strong className="font-mono-numbers text-rose-400 shrink-0">{z.priceLevel}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operational Swing Trading Plan Card (Part 9 & 10) */}
      <TradingPlanCard plan={data.aiDecision} lang={lang} />

      {/* Deep-Dive Analysis Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('AI_REPORT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'AI_REPORT'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'تقرير قراءة الشارت والتحليل الذكي' : 'AI Chart & Investment Report'}
        </button>

        <button
          onClick={() => setActiveTab('TECH')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'TECH'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'المؤشرات الفنية وتوافق الفترات' : 'Technical Indicators'}
        </button>

        <button
          onClick={() => setActiveTab('FUND')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'FUND'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'القوائم المالية والنسب الأساسية' : 'Financials & Ratios'}
        </button>

        <button
          onClick={() => setActiveTab('VALUATION')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'VALUATION'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'محرك القيمة العادلة ونماذج DCF' : 'Fair Value Engine'}
        </button>

        <button
          onClick={() => setActiveTab('NEWS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'NEWS'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'الإفصاحات وأحداث الشركات' : 'Disclosures & Events'}
        </button>
      </div>

      {/* Tab Content 1: Arabic AI Investment Report & Scenarios */}
      {activeTab === 'AI_REPORT' && (
        <div className="space-y-6">
          {/* Decision Highlight Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {lang === 'ar' ? 'التقرير التحليلي المالي الشامل المعتمد بالذكاء الاصطناعي' : 'Full AI Investment Report'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateAiReport}
                  disabled={isGeneratingReport}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 transition-all disabled:opacity-50"
                  title="تحديث قراءة الشارت والتقرير بالذكاء الاصطناعي"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingReport ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingReport ? (lang === 'ar' ? 'جاري قراءة الشارت...' : 'Analyzing Chart...') : (lang === 'ar' ? 'تحديث قراءة الشارت بالذكاء الاصطناعي' : 'Refresh AI Chart Analysis')}</span>
                </button>
              </div>
            </div>

            {/* Markdown rendered report */}
            <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-3 font-sans whitespace-pre-line bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
              {currentAiReport}
            </div>

            {/* Positive vs Negative Factors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
              <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-4">
                <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === 'ar' ? 'أهم العوامل الداعمة للقرار (الإيجابيات):' : 'Positive Supporting Factors:'}
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {data.aiDecision.positiveFactorsAr.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 shrink-0 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-950/30 border border-rose-900/40 rounded-xl p-4">
                <h4 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {lang === 'ar' ? 'المخاطر والتحديات الواجب مراقبتها (السلبيات):' : 'Risk & Negative Factors:'}
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {data.aiDecision.negativeFactorsAr.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-400 shrink-0 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 3 Scenarios: Bullish, Bearish, Neutral */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                {lang === 'ar' ? 'تحليل السيناريوهات المحتملة وشروط التحقق والإلغاء (Scenario Analysis):' : 'Scenario Analysis:'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-900/40 text-xs">
                  <span className="font-bold text-emerald-400 block mb-1">{data.aiDecision.bullishScenario.directionAr}</span>
                  <p className="text-slate-300 text-[11px] mb-2">{data.aiDecision.bullishScenario.keyLevelsAr}</p>
                  <span className="text-[10px] text-slate-500 block">{data.aiDecision.bullishScenario.invalidationTriggerAr}</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-900/40 text-xs">
                  <span className="font-bold text-rose-400 block mb-1">{data.aiDecision.bearishScenario.directionAr}</span>
                  <p className="text-slate-300 text-[11px] mb-2">{data.aiDecision.bearishScenario.keyLevelsAr}</p>
                  <span className="text-[10px] text-slate-500 block">{data.aiDecision.bearishScenario.invalidationTriggerAr}</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="font-bold text-amber-400 block mb-1">{data.aiDecision.neutralScenario.directionAr}</span>
                  <p className="text-slate-300 text-[11px] mb-2">{data.aiDecision.neutralScenario.keyLevelsAr}</p>
                  <span className="text-[10px] text-slate-500 block">{data.aiDecision.neutralScenario.invalidationTriggerAr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Technical Indicators Matrix */}
      {activeTab === 'TECH' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              {lang === 'ar' ? 'مصفوفة المؤشرات الفنية المتقدمة وتوافق الفترات الزمنية' : 'Technical Indicators Matrix'}
            </h3>
            <span className="text-xs bg-slate-800 text-cyan-400 font-bold px-3 py-1 rounded-full">
              {lang === 'ar' ? `الدرجة الفنية: ${data.technicalAnalysis.technicalScore}/100` : `Tech Score: ${data.technicalAnalysis.technicalScore}`}
            </span>
          </div>

          {/* Multi-Timeframe Trend Alignment Banner */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block mb-1">
                {lang === 'ar' ? 'حالة توافق الاتجاه عبر الفترات الزمنية:' : 'Trend Alignment Status:'}
              </span>
              <span className="font-bold text-emerald-400 text-sm">
                {data.technicalAnalysis.trendAlignmentStatusAr}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{lang === 'ar' ? 'يومي (1D)' : 'Daily'}</span>
                <strong className={data.technicalAnalysis.dailyTrend === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}>
                  {data.technicalAnalysis.dailyTrend}
                </strong>
              </div>
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{lang === 'ar' ? 'أسبوعي (1W)' : 'Weekly'}</span>
                <strong className={data.technicalAnalysis.weeklyTrend === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}>
                  {data.technicalAnalysis.weeklyTrend}
                </strong>
              </div>
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{lang === 'ar' ? 'شهري (1M)' : 'Monthly'}</span>
                <strong className={data.technicalAnalysis.monthlyTrend === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}>
                  {data.technicalAnalysis.monthlyTrend}
                </strong>
              </div>
            </div>
          </div>

          {/* Moving Averages Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'المتوسطات المتحركة الأسية والبسيطة (EMA & SMA):' : 'Moving Averages:'}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 font-mono-numbers text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">EMA 9</span>
                <span className="font-bold text-white">{data.technicalAnalysis.ema9} جم</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">EMA 20</span>
                <span className="font-bold text-cyan-400">{data.technicalAnalysis.ema20} جم</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">EMA 50</span>
                <span className="font-bold text-amber-400">{data.technicalAnalysis.ema50} جم</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">EMA 100</span>
                <span className="font-bold text-purple-400">{data.technicalAnalysis.ema100} جم</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">EMA 200</span>
                <span className="font-bold text-emerald-400">{data.technicalAnalysis.ema200} جم</span>
              </div>
            </div>
          </div>

          {/* Momentum & Volatility Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'مؤشرات العزم والسيولة والتذبذب:' : 'Momentum & Volatility:'}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-numbers text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">RSI (14)</span>
                <span className="font-bold text-base text-purple-400">{data.technicalAnalysis.rsi14}</span>
                <span className="text-[10px] text-slate-500 block">{data.technicalAnalysis.rsiStatus}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">MACD (12,26,9)</span>
                <span className="font-bold text-base text-cyan-400">{data.technicalAnalysis.macd.histogram}</span>
                <span className="text-[10px] text-emerald-400 block">{data.technicalAnalysis.macd.signal}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">ADX (14) قوة الاتجاه</span>
                <span className="font-bold text-base text-amber-400">{data.technicalAnalysis.adx14.adx}</span>
                <span className="text-[10px] text-slate-400 block">{data.technicalAnalysis.adx14.trendStrength}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">ATR (14) المدى السعري</span>
                <span className="font-bold text-base text-emerald-400">{data.technicalAnalysis.atr14} جم</span>
                <span className="text-[10px] text-slate-500 block">تذبذب: {data.technicalAnalysis.historicalVolatilityPct}%</span>
              </div>
            </div>
          </div>

          {/* Fibonacci Levels */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'مستويات فيبوناتشي التصحيحية (Fibonacci Retracement):' : 'Fibonacci Levels:'}</h4>
            <div className="flex flex-wrap gap-2 text-xs font-mono-numbers">
              {data.technicalAnalysis.fibonacciLevels.map((fib, idx) => (
                <div key={idx} className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">{fib.label}</span>
                  <span className="font-bold text-white">{fib.level} جم</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Fundamental Analysis & Financial Statements */}
      {activeTab === 'FUND' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                {lang === 'ar' ? 'التحليل المالي الأساسي والقوائم المالية المدققة' : 'Fundamental Financial Statements'}
              </h3>
              <span className="text-xs text-slate-400">
                {lang === 'ar' ? `المراجع القانوني: ${data.fundamentalAnalysis.auditorName}` : `Auditor: ${data.fundamentalAnalysis.auditorName}`}
              </span>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
              {lang === 'ar' ? `جودة الأرباح: ${data.fundamentalAnalysis.ratios.fundamentalQualityScore}/100` : `Quality: ${data.fundamentalAnalysis.ratios.fundamentalQualityScore}`}
            </span>
          </div>

          {/* Historical 4-Year Income Statement Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'تطور الأرباح والإيرادات لآخر 4 سنوات مالية (مليون جنيه):' : 'Historical Income Statement (M EGP):'}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right font-mono-numbers">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3 text-right">{lang === 'ar' ? 'السنة المالية' : 'Year'}</th>
                    <th className="py-2 px-3">{lang === 'ar' ? 'الإيرادات' : 'Revenue'}</th>
                    <th className="py-2 px-3">{lang === 'ar' ? 'مجمل الربح' : 'Gross Profit'}</th>
                    <th className="py-2 px-3">{lang === 'ar' ? 'الربح التشغيلي' : 'Operating Inc.'}</th>
                    <th className="py-2 px-3">{lang === 'ar' ? 'صافي الربح' : 'Net Income'}</th>
                    <th className="py-2 px-3">{lang === 'ar' ? 'ربحية السهم (EPS)' : 'EPS (EGP)'}</th>
                    <th className="py-2 px-3">{lang === 'ar' ? 'توزيعات السهم' : 'DPS'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.fundamentalAnalysis.historicalYears.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">{row.year}</td>
                      <td className="py-2.5 px-3 text-slate-200">{row.revenue.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-slate-300">{row.grossProfit.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-cyan-400">{row.operatingIncome.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">{row.netIncome.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{row.eps} جم</td>
                      <td className="py-2.5 px-3 text-amber-400">{row.dividendPerShare} جم</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ratios Matrix */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'المؤشرات المالية ومعدلات العائد:' : 'Financial Ratios & Multiples:'}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono-numbers text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">P/E مكرر الربحية</span>
                <span className="font-bold text-white text-sm">{data.fundamentalAnalysis.ratios.peRatio}x</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">P/B مضاعف القيمة الدفترية</span>
                <span className="font-bold text-white text-sm">{data.fundamentalAnalysis.ratios.pbRatio}x</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">ROE العائد على الملكية</span>
                <span className="font-bold text-emerald-400 text-sm">{data.fundamentalAnalysis.ratios.roe}%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">عائد التوزيعات النقدي</span>
                <span className="font-bold text-amber-400 text-sm">{data.fundamentalAnalysis.ratios.dividendYield}%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">نمو الإيرادات السنوي</span>
                <span className="font-bold text-cyan-400 text-sm">+{data.fundamentalAnalysis.ratios.revenueGrowthYoY}%</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">الدين إلى حقوق الملكية</span>
                <span className="font-bold text-slate-300 text-sm">{data.fundamentalAnalysis.ratios.debtToEquity}x</span>
              </div>
            </div>
          </div>

          {/* Sector Specific Metrics */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'مؤشرات خاصة بالقطاع (Sector-Specific Metrics):' : 'Sector-Specific Metrics:'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[11px] mb-0.5">{data.fundamentalAnalysis.ratios.sectorSpecific.label1}</span>
                <span className="font-bold text-white">{data.fundamentalAnalysis.ratios.sectorSpecific.value1}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[11px] mb-0.5">{data.fundamentalAnalysis.ratios.sectorSpecific.label2}</span>
                <span className="font-bold text-white">{data.fundamentalAnalysis.ratios.sectorSpecific.value2}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[11px] mb-0.5">{data.fundamentalAnalysis.ratios.sectorSpecific.label3}</span>
                <span className="font-bold text-white">{data.fundamentalAnalysis.ratios.sectorSpecific.value3}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Fair Value Valuation Engine */}
      {activeTab === 'VALUATION' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                {lang === 'ar' ? 'محرك تقييم القيمة العادلة المرجحة ونماذج DCF' : 'Fair Value Valuation Engine'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {data.fairValueValuation.summaryAr}
              </p>
            </div>
            <div className="text-right font-mono-numbers">
              <span className="text-2xl font-black text-emerald-400 block">{dynamicFairValue} جم</span>
              <span className="text-xs text-cyan-400 font-bold block">هامش أمان: +{dynamicMargin}%</span>
            </div>
          </div>

          {/* Interactive DCF Assumptions Sliders */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'تعديل افتراضات نموذج التدفقات النقدية المخصومة (DCF Sensitivity):' : 'DCF Sensitivity Sliders:'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono-numbers">
                  <span className="text-slate-400">{lang === 'ar' ? 'معدل خصم تكلفة رأس المال (WACC):' : 'WACC Discount Rate:'}</span>
                  <strong className="text-white">{customWacc.toFixed(1)}%</strong>
                </div>
                <input
                  type="range"
                  min="16"
                  max="28"
                  step="0.5"
                  value={customWacc}
                  onChange={(e) => setCustomWacc(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-mono-numbers">
                  <span className="text-slate-400">{lang === 'ar' ? 'معدل النمو النهائي المستدام (Terminal Growth):' : 'Terminal Growth (g):'}</span>
                  <strong className="text-white">{customGrowth.toFixed(1)}%</strong>
                </div>
                <input
                  type="range"
                  min="4"
                  max="10"
                  step="0.5"
                  value={customGrowth}
                  onChange={(e) => setCustomGrowth(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Valuation Methods Weights Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'تفصيل نماذج التقييم والأوزان النسبية:' : 'Valuation Methods Weights:'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data.fairValueValuation.methods.map((m, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span>{m.methodNameAr}</span>
                      <span className="font-bold text-cyan-400">{m.weightPct}%</span>
                    </div>
                    <span className="text-xl font-black text-white font-mono-numbers block mb-1">
                      {m.calculatedValue} جم
                    </span>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {m.descriptionAr}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 5: Corporate News & Disclosures */}
      {activeTab === 'NEWS' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              {lang === 'ar' ? 'الإفصاحات الرسمية وأجندة أحداث الشركة' : 'Official Disclosures & Events'}
            </h3>
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono">
              {data.newsDisclosures.length} إفصاحات رسمية
            </span>
          </div>

          {/* Disclosures Feed */}
          <div className="space-y-3">
            {data.newsDisclosures.map((n) => (
              <div key={n.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400">{n.categoryAr}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 font-mono">{n.publishedAt}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                      {n.source}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {n.impactAr}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{n.titleAr}</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
                  {n.summaryAr}
                </p>
              </div>
            ))}
          </div>

          {/* Upcoming Events Calendar */}
          {data.upcomingEvents.length > 0 && (
            <div className="space-y-2 pt-3">
              <h4 className="text-xs font-bold text-slate-300">{lang === 'ar' ? 'أجندة الأحداث القادمة ومواعيد التوزيعات والجمعيات العمومية:' : 'Upcoming Corporate Events:'}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {data.upcomingEvents.map((ev) => (
                  <div key={ev.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span className="text-amber-400 font-bold">{ev.status === 'CONFIRMED' ? 'موعد مؤكد' : 'تقديري'}</span>
                      <span className="font-mono text-white font-bold">{ev.eventDate}</span>
                    </div>
                    <div className="font-bold text-white text-xs mb-1">{ev.eventNameAr}</div>
                    <div className="text-[11px] text-slate-400">{ev.detailsAr}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

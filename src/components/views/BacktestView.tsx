import React, { useState, useEffect } from 'react';
import { TestTube2, Play, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';
import { EGXStockSummary } from '../../types';

interface BacktestViewProps {
  stocks: EGXStockSummary[];
  lang?: 'ar' | 'en';
}

export const BacktestView: React.FC<BacktestViewProps> = ({ stocks, lang = 'ar' }) => {
  const [strategyId, setStrategyId] = useState('SWING_TREND_PULLBACK');
  const [ticker, setTicker] = useState('COMI');
  const [capital, setCapital] = useState(1000000); // 1 Million EGP
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const runBacktest = () => {
    setRunning(true);
    fetch('/api/backtest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategyId, ticker, initialCapitalEgp: capital })
    })
      .then(res => res.json())
      .then(d => {
        setResult(d);
        setRunning(false);
      })
      .catch(err => {
        console.error(err);
        setRunning(false);
      });
  };

  useEffect(() => {
    runBacktest();
  }, [strategyId, ticker]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TestTube2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
            {lang === 'ar' ? 'محرك الاختبار التاريخي للاستراتيجيات (Strategy Backtester)' : 'Strategy Backtesting Engine'}
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">
          {lang === 'ar' ? 'اختبار استراتيجيات التداول المتأرجح على بيانات البورصة المصرية السابقة' : 'Historical Strategy Simulator'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {lang === 'ar'
            ? 'اختبار حقيقي يراعي عمولات التداول (0.3% للعملية كاملة) والانزلاق السعري وقيود السيولة، دون أي تحيز مستقبلي (No Look-ahead Bias).'
            : 'Simulate swing strategies with commission and slippage.'}
        </p>
      </div>

      {/* Control Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1.5 font-bold">
              {lang === 'ar' ? 'اختر الاستراتيجية:' : 'Select Strategy:'}
            </label>
            <select
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 font-semibold"
            >
              <option value="SWING_TREND_PULLBACK">التداول المتأرجح مع الاتجاه (EMA20/50 + RSI Pullback)</option>
              <option value="BREAKOUT_MOMENTUM">اختراق القمم وطفرة السيولة (Breakout Momentum)</option>
              <option value="VALUE_MOMENTUM">القيمة العادلة المزدوجة (Value + Technical Reversal)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5 font-bold">
              {lang === 'ar' ? 'السهم محل الاختبار:' : 'Stock to Test:'}
            </label>
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 font-semibold"
            >
              {stocks.map(s => (
                <option key={s.ticker} value={s.ticker}>
                  {s.ticker} - {s.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5 font-bold">
              {lang === 'ar' ? 'رأس المال المبدئي (جنيه):' : 'Initial Capital (EGP):'}
            </label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value) || 100000)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono-numbers outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
          <span className="text-xs text-slate-400">
            {result?.strategyDescriptionAr}
          </span>
          <button
            onClick={runBacktest}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {running ? 'جاري الحساب...' : 'إعادة تشغيل الاختبار'}
          </button>
        </div>
      </div>

      {/* Result Metrics */}
      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono-numbers">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
              <span className="text-[11px] text-slate-400 block font-sans mb-1">صافي العائد التراكمي</span>
              <span className="text-2xl font-black text-emerald-400">+{result.totalReturnPct}%</span>
              <span className="text-[10px] text-slate-500 block font-sans">ألفا: +{result.alphaGeneratedPct}% فوق EGX30</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
              <span className="text-[11px] text-slate-400 block font-sans mb-1">صافي الأرباح المحققة</span>
              <span className="text-2xl font-black text-white">+{result.totalNetProfitEgp.toLocaleString()} جم</span>
              <span className="text-[10px] text-slate-500 block font-sans">الرصيد: {result.finalEquityEgp.toLocaleString()} جم</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
              <span className="text-[11px] text-slate-400 block font-sans mb-1">نسبة الصفقات الرابحة</span>
              <span className="text-2xl font-black text-emerald-400">{result.winRatePct}%</span>
              <span className="text-[10px] text-slate-500 block font-sans">{result.winningTradesCount} رابحة / {result.losingTradesCount} خاسرة</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
              <span className="text-[11px] text-slate-400 block font-sans mb-1">معامل الربح (Profit Factor)</span>
              <span className="text-2xl font-black text-cyan-400">{result.profitFactor}x</span>
              <span className="text-[10px] text-slate-500 block font-sans">Sharpe Ratio: {result.sharpeRatio}</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
              <span className="text-[11px] text-slate-400 block font-sans mb-1">أقصى تراجع (Max DD)</span>
              <span className="text-2xl font-black text-rose-400">-{result.maxDrawdownPct}%</span>
              <span className="text-[10px] text-slate-500 block font-sans">هبوط محسوب ومؤمن</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
              <span className="text-[11px] text-slate-400 block font-sans mb-1">إجمالي العمولات المدفوعة</span>
              <span className="text-xl font-black text-amber-400">{result.commissionPaidTotalEgp.toLocaleString()} جم</span>
              <span className="text-[10px] text-slate-500 block font-sans">0.3% للعملية شاملة</span>
            </div>
          </div>

          {/* Trade Executions Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-5 space-y-3">
            <h3 className="text-base font-bold text-white">
              {lang === 'ar' ? 'سجل العمليات المنفذة في الاختبار التاريخي:' : 'Simulated Trade Log:'}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right font-mono-numbers">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold font-sans">
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'رقم الصفقة' : 'ID'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'تاريخ الدخول' : 'Entry Date'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'سعر الدخول' : 'Entry Price'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'تاريخ الخروج' : 'Exit Date'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'سعر الخروج' : 'Exit Price'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'صافي العائد %' : 'Net %'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'صافي الربح' : 'Net P&L'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'أيام الاحتفاظ' : 'Days'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'سبب الخروج' : 'Exit Trigger'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.recentTrades.map((t: any) => (
                    <tr key={t.tradeId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-white">{t.tradeId}</td>
                      <td className="py-3 px-3 text-slate-400">{t.entryDate}</td>
                      <td className="py-3 px-3 text-white">{t.entryPrice} جم</td>
                      <td className="py-3 px-3 text-slate-400">{t.exitDate}</td>
                      <td className="py-3 px-3 font-bold text-white">{t.exitPrice} جم</td>
                      <td className={`py-3 px-3 font-bold ${t.netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.netReturnPct >= 0 ? `+${t.netReturnPct}%` : `${t.netReturnPct}%`}
                      </td>
                      <td className={`py-3 px-3 font-bold ${t.netProfitEgp >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.netProfitEgp >= 0 ? '+' : ''}{t.netProfitEgp.toLocaleString()} جم
                      </td>
                      <td className="py-3 px-3 text-slate-300">{t.holdingDays} يوم</td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.exitReason.includes('TARGET')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {t.exitReasonAr}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

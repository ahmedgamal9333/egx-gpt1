import React from 'react';
import { EGXStockSummary, SmartAlert } from '../../types';
import {
  TrendingUp,
  Target,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Award,
  Bell,
  BarChart2
} from 'lucide-react';

interface DashboardViewProps {
  stocks: EGXStockSummary[];
  marketOverview: any;
  alerts: SmartAlert[];
  onSelectStock: (ticker: string) => void;
  lang?: 'ar' | 'en';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stocks,
  marketOverview,
  alerts,
  onSelectStock,
  lang = 'ar'
}) => {
  // Top buy opportunities sorted by quick score
  const topOpportunities = stocks
    .filter(s => s.recommendationBadge === 'STRONG_BUY' || s.recommendationBadge === 'BUY')
    .sort((a, b) => b.quickScore - a.quickScore)
    .slice(0, 4);

  // High volume breakout candidates
  const breakoutCandidates = stocks
    .filter(s => s.valueTraded >= 50000000)
    .sort((a, b) => b.valueTraded - a.valueTraded)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome & Market Pulse Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'بيانات EGID المتأخرة' : 'EGID Delayed Market Data'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {marketOverview?.lastMarketSessionDate || new Date().toISOString().split('T')[0]}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              {lang === 'ar' ? 'منصة المحلل المالي الذكي (EGX AI Analyst)' : 'EGX AI Financial Decision Terminal'}
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
              {lang === 'ar'
                ? `دليل الأوراق المالية المتاح من EGID: ${stocks.length} ورقة. الأسعار متأخرة، ولا تُصدر المنصة توصيات فنية حتى تتوفر بيانات تاريخية مرخصة وموثوقة.`
                : `EGID delayed quotes for ${stocks.length} securities. Historical analysis is withheld until licensed historical data is connected.`}
            </p>
          </div>

          {/* Market Breadth & Turnover Quick Stats */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
            <div>
              <span className="text-[11px] text-slate-400 block">{lang === 'ar' ? 'إجمالي قيمة التداول' : 'Total Turnover'}</span>
              <span className="text-lg font-black text-white font-mono-numbers">
                {marketOverview?.totalTurnoverEgp == null ? 'غير متاح' : `${(marketOverview.totalTurnoverEgp / 1000000000).toFixed(2)} مليار جم`}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div>
              <span className="text-[11px] text-slate-400 block">{lang === 'ar' ? 'الأسهم الصاعدة / الهابطة' : 'Gainers / Losers'}</span>
              <div className="flex items-center gap-1.5 font-mono-numbers text-sm font-bold">
                <span className="text-emerald-400">{marketOverview?.advancingStocks ?? '—'} ↑</span>
                <span className="text-slate-600">/</span>
                <span className="text-rose-400">{marketOverview?.decliningStocks ?? '—'} ↓</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div>
              <span className="text-[11px] text-slate-400 block">{lang === 'ar' ? 'معامل اتساع السوق' : 'Market Breadth'}</span>
              <span className="text-sm font-bold text-cyan-400 font-mono-numbers">
                {marketOverview?.marketBreadthRatio == null ? 'غير متاح' : `${marketOverview.marketBreadthRatio}x`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Swing Trading Opportunities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              {lang === 'ar' ? 'أبرز فرص التداول المتأرجح المؤكدة حالياً' : 'Top Confirmed Swing Opportunities'}
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {lang === 'ar' ? 'مرتبة وفق التقييم المرجح ونسبة العائد للمخاطرة' : 'Sorted by overall quality & R:R'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topOpportunities.map((stock) => (
            <div
              key={stock.ticker}
              onClick={() => onSelectStock(stock.ticker)}
              className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-xl hover:shadow-emerald-950/20 group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-black text-lg text-white group-hover:text-emerald-400 transition-colors">
                    {stock.ticker}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {stock.recommendationBadgeAr}
                  </span>
                </div>

                <div className="font-semibold text-xs text-slate-200 line-clamp-1 mb-1">
                  {stock.nameAr}
                </div>
                <div className="text-[11px] text-slate-400 mb-3">{stock.sectorAr}</div>

                <div className="flex items-baseline justify-between mb-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 font-mono-numbers">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'السعر الحالي' : 'Current Price'}</span>
                    <span className="text-base font-bold text-white">{stock.currentPrice} جم</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'التغير اليومي' : 'Change'}</span>
                    <span
                      className={`text-xs font-bold flex items-center gap-0.5 ${
                        stock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {stock.changePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stock.changePct}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-2.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>{lang === 'ar' ? 'القيمة العادلة المرجحة:' : 'Fair Value:'}</span>
                  <span className="text-emerald-400 font-bold font-mono-numbers">{stock.fairValue} جم</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>{lang === 'ar' ? 'هامش الأمان الاستثماري:' : 'Margin of Safety:'}</span>
                  <span className="text-cyan-400 font-bold font-mono-numbers">+{stock.fairValueUpsidePct}%</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>{lang === 'ar' ? 'مؤشر القوة النسبية RSI:' : 'RSI (14):'}</span>
                  <span className="text-white font-mono-numbers">{stock.rsi14}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: High Volume Movers & Latest AI Smart Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High Volume / Liquidity Leaders */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                {lang === 'ar' ? 'أنشط الأسهم في قيم التداول وتدفقات السيولة المؤسسية' : 'Top Liquidity & Volume Leaders'}
              </h3>
            </div>
            <span className="text-xs text-slate-400">{lang === 'ar' ? 'سيولة عالية وسهولة تخارج' : 'High Liquidity'}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'السهم' : 'Stock'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'القطاع' : 'Sector'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'السعر اللحظي' : 'Price'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'التغير' : 'Change'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'قيمة التداول' : 'Turnover'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'القرار' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
                {breakoutCandidates.map((s) => (
                  <tr
                    key={s.ticker}
                    onClick={() => onSelectStock(s.ticker)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{s.ticker}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{s.nameAr}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-sans">{s.sectorAr}</td>
                    <td className="py-3 px-3 font-bold text-white">{s.currentPrice} جم</td>
                    <td className={`py-3 px-3 font-bold ${s.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.changePct >= 0 ? `+${s.changePct}%` : `${s.changePct}%`}
                    </td>
                    <td className="py-3 px-3 text-cyan-300">
                      {(s.valueTraded / 1000000).toFixed(1)} مليون جم
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                        {s.recommendationBadgeAr}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Real-Time Smart Alerts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {lang === 'ar' ? 'التنبيهات الذكية اللحظية' : 'Smart Alerts'}
                </h3>
              </div>
              <span className="text-[11px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                {alerts.length} تنبيهات
              </span>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  onClick={() => onSelectStock(a.ticker)}
                  className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-emerald-400 font-mono">{a.ticker}</span>
                      <span className="text-slate-400 text-[11px] font-normal">{a.typeAr}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{a.timestamp}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                    {a.messageAr}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{lang === 'ar' ? 'التنبيهات مبنية على أرقام البورصة المؤكدة' : 'Verified alert signals'}</span>
            <span className="text-emerald-400 font-bold">{lang === 'ar' ? 'متصل' : 'Connected'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

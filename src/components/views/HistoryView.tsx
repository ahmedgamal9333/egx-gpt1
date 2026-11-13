import React, { useState, useEffect } from 'react';
import { History, Award, CheckCircle2, XCircle, ArrowUpRight, TrendingUp } from 'lucide-react';

interface HistoryViewProps {
  onSelectStock: (ticker: string) => void;
  lang?: 'ar' | 'en';
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectStock, lang = 'ar' }) => {
  const [data, setData] = useState<{ history: any[]; metrics: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recommendations/history')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin ml-2"></div>
        جاري تحميل سجل التوصيات وتدقيق الأداء...
      </div>
    );
  }

  const { history, metrics } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <History className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
            {lang === 'ar' ? 'سجل التوصيات الدائم وتدقيق الأداء الفعلي (Audit Trail)' : 'Recommendation Audit Trail'}
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">
          {lang === 'ar' ? 'التتبع التاريخي لنتائج توصيات المحلل الذكي ومعدلات النجاح' : 'Historical Performance Audit'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {lang === 'ar'
            ? 'سجل دائم غير قابل للتعديل يوثق كل توصية سابقة وسعر الصدور والنتيجة الفعلية المحققة ومعدل ضرب المستهدفات.'
            : 'Immutable track record of past swing recommendations with verifiable win rate and profit factor.'}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono-numbers">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <span className="text-[11px] text-slate-400 block font-sans mb-1">{lang === 'ar' ? 'نسبة النجاح (Win Rate)' : 'Win Rate'}</span>
          <span className="text-2xl font-black text-emerald-400">{metrics.winRatePct}%</span>
          <span className="text-[10px] text-slate-500 block font-sans">{metrics.winningTrades} من أصل {metrics.totalRecommendations} صفقات</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <span className="text-[11px] text-slate-400 block font-sans mb-1">{lang === 'ar' ? 'معامل الربحية (Profit Factor)' : 'Profit Factor'}</span>
          <span className="text-2xl font-black text-cyan-400">{metrics.profitFactor}x</span>
          <span className="text-[10px] text-slate-500 block font-sans">الأرباح / الخسائر</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <span className="text-[11px] text-slate-400 block font-sans mb-1">{lang === 'ar' ? 'متوسط العائد لكل توصية' : 'Avg Return'}</span>
          <span className="text-2xl font-black text-white">+{metrics.averageReturnPct}%</span>
          <span className="text-[10px] text-slate-500 block font-sans">تداول متأرجح</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <span className="text-[11px] text-slate-400 block font-sans mb-1">{lang === 'ar' ? 'معدل تحقيق المستهدف 1' : 'Target 1 Hit'}</span>
          <span className="text-2xl font-black text-emerald-400">{metrics.target1HitRatePct}%</span>
          <span className="text-[10px] text-slate-500 block font-sans">جني أرباح أولية</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <span className="text-[11px] text-slate-400 block font-sans mb-1">{lang === 'ar' ? 'معدل تحقيق المستهدف 2' : 'Target 2 Hit'}</span>
          <span className="text-2xl font-black text-emerald-400">{metrics.target2HitRatePct}%</span>
          <span className="text-[10px] text-slate-500 block font-sans">المستهدف الرئيسي</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <span className="text-[11px] text-slate-400 block font-sans mb-1">{lang === 'ar' ? 'أقصى تراجع (Drawdown)' : 'Max Drawdown'}</span>
          <span className="text-2xl font-black text-rose-400">-{metrics.maxDrawdownPct}%</span>
          <span className="text-[10px] text-slate-500 block font-sans">انضباط إدارة المخاطر</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold font-mono-numbers">
                <th className="py-3 px-4 font-sans text-right">{lang === 'ar' ? 'السهم والشركة' : 'Stock'}</th>
                <th className="py-3 px-3">{lang === 'ar' ? 'تاريخ الصدور' : 'Date'}</th>
                <th className="py-3 px-3">{lang === 'ar' ? 'سعر التوصية' : 'Entry Price'}</th>
                <th className="py-3 px-3">{lang === 'ar' ? 'وقف الخسارة' : 'Stop Loss'}</th>
                <th className="py-3 px-3">{lang === 'ar' ? 'المستهدف 1 & 2' : 'Targets'}</th>
                <th className="py-3 px-3 font-sans">{lang === 'ar' ? 'التصنيف' : 'Category'}</th>
                <th className="py-3 px-3">{lang === 'ar' ? 'العائد الفعلي' : 'Actual Return'}</th>
                <th className="py-3 px-3">{lang === 'ar' ? 'مدة الاحتفاظ' : 'Holding'}</th>
                <th className="py-3 px-4 font-sans">{lang === 'ar' ? 'حالة التوصية والنتيجة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
              {history.map((rec: any) => (
                <tr
                  key={rec.id}
                  onClick={() => onSelectStock(rec.ticker)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4">
                    <span className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors block">
                      {rec.ticker}
                    </span>
                    <span className="text-[11px] text-slate-400 font-sans">{rec.companyNameAr}</span>
                  </td>

                  <td className="py-3 px-3 text-slate-400">
                    {rec.recommendationDate}
                  </td>

                  <td className="py-3 px-3 font-bold text-white">
                    {rec.priceAtRecommendation} جم
                  </td>

                  <td className="py-3 px-3 text-rose-400">
                    {rec.stopLoss} جم
                  </td>

                  <td className="py-3 px-3 text-slate-300">
                    <span>{rec.target1} / {rec.target2} جم</span>
                  </td>

                  <td className="py-3 px-3 font-sans">
                    <span className="px-2 py-0.5 rounded font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                      {rec.recommendationTypeAr}
                    </span>
                  </td>

                  <td className={`py-3 px-3 font-bold text-sm ${rec.actualReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {rec.actualReturnPct >= 0 ? `+${rec.actualReturnPct}%` : `${rec.actualReturnPct}%`}
                  </td>

                  <td className="py-3 px-3 text-slate-400">
                    {rec.holdingDays} يوم
                  </td>

                  <td className="py-3 px-4 font-sans">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                      rec.status.includes('TARGET')
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : rec.status === 'ACTIVE'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {rec.statusAr}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

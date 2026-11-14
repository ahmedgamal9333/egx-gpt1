import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { EGXStockSummary } from '../../types';

interface PortfolioViewProps {
  portfolio: any;
  stocks: EGXStockSummary[];
  onAddTransaction: (ticker: string, shares: number, buyPrice: number) => void;
  onRemoveTransaction: (ticker: string) => void;
  onSelectStock: (ticker: string) => void;
  lang?: 'ar' | 'en';
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  portfolio,
  stocks,
  onAddTransaction,
  onRemoveTransaction,
  onSelectStock,
  lang = 'ar'
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [ticker, setTicker] = useState('COMI');
  const [shares, setShares] = useState(1000);
  const [buyPrice, setBuyPrice] = useState(85.0);

  if (!portfolio) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
              {lang === 'ar' ? 'المحفظة الاستثمارية والمحلل الذكي للمراكز' : 'Portfolio Management'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">
            {lang === 'ar' ? 'إدارة مراكز المحفظة وتوصيات الذكاء الاصطناعي لكل سهم' : 'Holdings & AI Action Advisor'}
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          {lang === 'ar' ? 'إضافة صفقة / شراء سهم' : 'Add Position'}
        </button>
      </div>

      {/* Portfolio Financial Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono-numbers">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-xs text-slate-400 block mb-1 font-sans">{lang === 'ar' ? 'القيمة السوقية الحالية' : 'Current Market Value'}</span>
          <span className="text-2xl font-black text-white">{portfolio.valuationComplete ? `${portfolio.totalMarketValue.toLocaleString()} جم` : 'تقييم جزئي — بعض الأسعار غير متاحة'}</span>
          <span className="text-[10px] text-slate-500 block mt-1 font-sans">
            {lang === 'ar' ? `التكلفة: ${portfolio.totalCost.toLocaleString()} جم` : `Cost: ${portfolio.totalCost}`}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-xs text-slate-400 block mb-1 font-sans">{lang === 'ar' ? 'الأرباح غير المحققة (P&L)' : 'Unrealized P&L'}</span>
          <div className={`text-2xl font-black flex items-center gap-1 ${portfolio.totalUnrealizedPl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {portfolio.valuationComplete ? `${portfolio.totalUnrealizedPl >= 0 ? '+' : ''}${portfolio.totalUnrealizedPl.toLocaleString()} جم` : 'غير مكتمل — تحقق من أسعار كل المراكز'}
          </div>
          <span className={`text-xs font-bold ${portfolio.totalUnrealizedPlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {portfolio.valuationComplete ? `(${portfolio.totalUnrealizedPlPct >= 0 ? '+' : ''}${portfolio.totalUnrealizedPlPct}%)` : ''}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-xs text-slate-400 block mb-1 font-sans">{lang === 'ar' ? 'التوزيعات المسجلة' : 'Recorded Dividends'}</span>
          <span className="text-2xl font-black text-amber-400">{portfolio.dividendsEarned.toLocaleString()} جم</span>
          <span className="text-[10px] text-slate-500 block mt-1 font-sans">{lang === 'ar' ? 'لا توجد توزيعات مسجلة' : 'No dividends recorded'}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <span className="text-xs text-slate-400 block mb-1 font-sans">{lang === 'ar' ? 'السيولة النقدية المتاحة (Cash)' : 'Available Cash'}</span>
          <span className="text-2xl font-black text-cyan-400">{portfolio.cashBalance.toLocaleString()} جم</span>
          <span className="text-[10px] text-slate-500 block mt-1 font-sans">{lang === 'ar' ? 'جاهزة لاقتناص الفرص' : 'Ready for deployment'}</span>
        </div>
      </div>

      {/* Holdings Table with AI Holding Actions (Part 14.1) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              {lang === 'ar' ? 'مراكز الأسهم وقرارات المحلل الذكي (AI Portfolio Advisor)' : 'Holdings & AI Actions'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {lang === 'ar' ? 'توصيات مخصصة حسب متوسط الشراء وهامش الأمان الفعلي' : 'Personalized based on cost basis'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold font-mono-numbers">
                <th className="py-2.5 px-3 text-right font-sans">{lang === 'ar' ? 'السهم' : 'Stock'}</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'الكمية' : 'Shares'}</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'متوسط الشراء' : 'Avg Cost'}</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'السعر السوقي' : 'Market Price'}</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'القيمة الحالية' : 'Position Value'}</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'الربح / الخسارة' : 'P&L'}</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'الوزن بالمحفظة' : 'Weight %'}</th>
                <th className="py-2.5 px-3 font-sans">{lang === 'ar' ? 'توصية الذكاء الاصطناعي' : 'AI Action'}</th>
                <th className="py-2.5 px-3 font-sans">{lang === 'ar' ? 'إجراء' : 'Manage'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
              {portfolio.holdings.map((h: any) => (
                <tr key={h.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 cursor-pointer" onClick={() => onSelectStock(h.ticker)}>
                    <span className="font-bold text-white text-sm block">{h.ticker}</span>
                    <span className="text-[11px] text-slate-400 font-sans">
                      {stocks.find(s => s.ticker === h.ticker)?.nameAr || h.ticker}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-bold text-white">
                    {h.sharesCount.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-slate-300">
                    {h.avgBuyPrice} جم
                  </td>

                  <td className="py-3 px-3 font-bold text-white">
                    {h.quoteAvailable ? `${h.currentPrice} جم` : 'غير متاح'}
                  </td>

                  <td className="py-3 px-3 text-slate-200">
                    {h.quoteAvailable ? `${h.currentValue.toLocaleString()} جم` : 'غير متاح'}
                  </td>

                  <td className={`py-3 px-3 font-bold ${h.unrealizedPl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {h.quoteAvailable ? `${h.unrealizedPl >= 0 ? '+' : ''}${h.unrealizedPl.toLocaleString()} جم (${h.unrealizedPlPct}%)` : 'غير متاح'}
                  </td>

                  <td className="py-3 px-3 text-cyan-400 font-bold">
                    {h.quoteAvailable ? `${h.allocationPct}%` : 'غير متاح'}
                  </td>

                  <td className="py-3 px-3 font-sans">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      h.aiAction === 'HOLD'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : h.aiAction === 'ADD'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : h.aiAction === 'REDUCE'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {h.aiActionAr}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1 leading-tight line-clamp-1">
                      {h.aiActionReasonAr}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-sans">
                    <button
                      onClick={() => onRemoveTransaction(h.ticker)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                      title={lang === 'ar' ? 'حذف المركز' : 'Remove position'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Position Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {lang === 'ar' ? 'إضافة مركز استثماري جديد' : 'Add Stock Position'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">{lang === 'ar' ? 'اختر السهم من البورصة المصرية:' : 'Stock Ticker:'}</label>
                <select
                  value={ticker}
                  onChange={(e) => {
                    setTicker(e.target.value);
                    const st = stocks.find(s => s.ticker === e.target.value);
                    if (st) setBuyPrice(st.currentPrice);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500"
                >
                  {stocks.map(s => (
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker} - {s.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{lang === 'ar' ? 'عدد الأسهم (الكمية):' : 'Number of Shares:'}</label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(Number(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono-numbers outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{lang === 'ar' ? 'سعر الشراء الفعلي (جنيه):' : 'Buy Price (EGP):'}</label>
                <input
                  type="number"
                  step="0.1"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(Number(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono-numbers outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  onAddTransaction(ticker, shares, buyPrice);
                  setShowAddModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {lang === 'ar' ? 'حفظ وتحديث المحفظة' : 'Save Position'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

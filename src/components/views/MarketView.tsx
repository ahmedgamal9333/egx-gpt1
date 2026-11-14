import React, { useState } from 'react';
import { TrendingUp, Landmark, DollarSign, Activity, Percent, Building2, LineChart } from 'lucide-react';
import { TradingViewWidget } from '../TradingViewWidget';

interface MarketViewProps {
  overview: any;
  lang?: 'ar' | 'en';
}

export const MarketView: React.FC<MarketViewProps> = ({ overview, lang = 'ar' }) => {
  const [marketSymbol, setMarketSymbol] = useState<'EGX:EGX30' | 'EGX:EGX70EWI' | 'EGX:EGX100EWI' | 'FX_IDC:USDEGP'>('EGX:EGX30');
  if (!overview) return null;
  const fmt = (value: number | null | undefined, digits = 2) => value == null || !Number.isFinite(value) ? 'غير متاح' : value.toLocaleString('en-US', { maximumFractionDigits: digits });
  const breadthTotal = (overview.advancingStocks || 0) + (overview.decliningStocks || 0) + (overview.unchangedStocks || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
            {lang === 'ar' ? 'البورصة المصرية - مؤشرات السوق والاقتصاد الكلي' : 'EGX & Macro Environment'}
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">
          {lang === 'ar' ? 'تحليل أداء السوق المصري والسياسة النقدية' : 'Egyptian Market Overview & CBE Macro'}
        </h1>
      </div>

      {/* 3 Main EGX Indices Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-numbers">
        {/* EGX30 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold font-sans text-white text-base">مؤشر EGX30</span>
            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
              {overview.egx30.changePct == null ? 'غير متاح' : `${overview.egx30.changePct > 0 ? '+' : ''}${overview.egx30.changePct}%`}
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {fmt(overview.egx30.value)}
          </div>
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 font-sans">
            <TrendingUp className="w-3.5 h-3.5" />
            {fmt(overview.egx30.change)} نقطة (التغيير المتاح)
          </div>
        </div>

        {/* EGX70 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold font-sans text-white text-base">مؤشر EGX70 EWI</span>
            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
              {overview.egx70.changePct == null ? 'غير متاح' : `${overview.egx70.changePct > 0 ? '+' : ''}${overview.egx70.changePct}%`}
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {fmt(overview.egx70.value)}
          </div>
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 font-sans">
            <TrendingUp className="w-3.5 h-3.5" />
            {fmt(overview.egx70.change)} نقطة (التغيير المتاح)
          </div>
        </div>

        {/* EGX100 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold font-sans text-white text-base">مؤشر EGX100 الأوسع نطاقاً</span>
            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
              {overview.egx100.changePct == null ? 'غير متاح' : `${overview.egx100.changePct > 0 ? '+' : ''}${overview.egx100.changePct}%`}
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {fmt(overview.egx100.value)}
          </div>
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 font-sans">
            <TrendingUp className="w-3.5 h-3.5" />
            {fmt(overview.egx100.change)} نقطة
          </div>
        </div>
      </div>

      {/* Live TradingView Market Index Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              {lang === 'ar' ? 'الرسم البياني المباشر لمؤشرات السوق (TradingView)' : 'Live Market Index Chart (TradingView)'}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(
              [
                { sym: 'EGX:EGX30', label: 'EGX30' },
                { sym: 'EGX:EGX70EWI', label: 'EGX70' },
                { sym: 'EGX:EGX100EWI', label: 'EGX100' },
                { sym: 'FX_IDC:USDEGP', label: 'USD/EGP' }
              ] as const
            ).map((item) => (
              <button
                key={item.sym}
                type="button"
                onClick={() => setMarketSymbol(item.sym)}
                className={`px-3 py-1 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 ${
                  marketSymbol === item.sym
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <TradingViewWidget
          symbol={marketSymbol}
          interval="D"
          lang={lang}
          height={480}
          studies={['STD;EMA', 'STD;RSI']}
          allowSymbolChange={true}
          hideSideToolbar={false}
        />
      </div>

      {/* Central Bank of Egypt (CBE) Macroeconomic Dashboard */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {lang === 'ar' ? 'المؤشرات الاقتصادية للبنك المركزي المصري (CBE Macro Dashboard)' : 'CBE Macroeconomic Dashboard'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {lang === 'ar' ? `آخر مراجعة: ${(overview.cbeData.lastCbeMeetingDate || 'غير متاح')}` : (overview.cbeData.lastCbeMeetingDate || 'N/A')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono-numbers text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">سعر الإقراض لليلة واحدة</span>
            <span className="text-xl font-black text-white">{fmt(overview.cbeData.overnightLendingRate)}{overview.cbeData.overnightLendingRate == null ? '' : '%'}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">سعر الإيداع لليلة واحدة</span>
            <span className="text-xl font-black text-white">{fmt(overview.cbeData.overnightDepositRate)}{overview.cbeData.overnightDepositRate == null ? '' : '%'}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">التضخم العام السنوي</span>
            <span className="text-xl font-black text-amber-400">{fmt(overview.cbeData.headlineInflationRate)}{overview.cbeData.headlineInflationRate == null ? '' : '%'}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">التضخم الأساسي (Core)</span>
            <span className="text-xl font-black text-cyan-400">{fmt(overview.cbeData.coreInflationRate)}{overview.cbeData.coreInflationRate == null ? '' : '%'}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">سعر صرف USD/EGP</span>
            <span className="text-xl font-black text-emerald-400">{fmt(overview.cbeData.fxUsdEgpRate)}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-1">الاحتياطي النقدي الأجنبي</span>
            <span className="text-xl font-black text-white">{overview.cbeData.foreignReservesBillionUsd == null ? 'غير متاح' : `${overview.cbeData.foreignReservesBillionUsd}B`}</span>
          </div>
        </div>
      </div>

      {/* Market Breadth & Liquidity Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              {lang === 'ar' ? 'عمق واتساع تداولات السوق (Market Breadth)' : 'Market Breadth'}
            </h3>
          </div>

          <div className="space-y-3 font-mono-numbers">
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span className="text-emerald-400 font-bold">{fmt(overview.advancingStocks)} سهم صاعد</span>
                <span className="text-rose-400 font-bold">{fmt(overview.decliningStocks)} سهم هابط</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${(breadthTotal ? (overview.advancingStocks / breadthTotal) * 100 : 0)}%` }}
                ></div>
                <div
                  className="bg-slate-700 h-full"
                  style={{ width: `${(breadthTotal ? (overview.unchangedStocks / breadthTotal) * 100 : 0)}%` }}
                ></div>
                <div
                  className="bg-rose-500 h-full"
                  style={{ width: `${(breadthTotal ? (overview.decliningStocks / breadthTotal) * 100 : 0)}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
              <div className="bg-slate-950 p-2 rounded-lg border border-emerald-900/30">
                <span className="text-slate-400 block text-[10px]">الأسهم الرابحة</span>
                <strong className="text-emerald-400 text-sm">{fmt(overview.advancingStocks)}</strong>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">دون تغيير</span>
                <strong className="text-slate-300 text-sm">{fmt(overview.unchangedStocks)}</strong>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-rose-900/30">
                <span className="text-slate-400 block text-[10px]">الأسهم الخاسرة</span>
                <strong className="text-rose-400 text-sm">{fmt(overview.decliningStocks)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              {lang === 'ar' ? 'إجمالي السيولة وأحجام التداول' : 'Market Liquidity'}
            </h3>
          </div>

          <div className="space-y-3 font-mono-numbers">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-xs">قيمة التداول الإجمالية:</span>
              <strong className="text-lg text-white font-black">
                {overview.totalTurnoverEgp == null ? 'غير متاح' : `${(overview.totalTurnoverEgp / 1000000000).toFixed(2)} مليار جنيه`}
              </strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-xs">إجمالي كمية الأسهم المتداولة:</span>
              <strong className="text-lg text-cyan-400 font-black">
                {overview.totalVolume == null ? 'غير متاح' : `${(overview.totalVolume / 1000000).toFixed(1)} مليون سهم`}
              </strong>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-xs">عدد العمليات والصفقات المنفذة:</span>
              <strong className="text-lg text-emerald-400 font-black">
                {overview.totalTrades == null ? 'غير متاح' : `${overview.totalTrades.toLocaleString()} صفقة`}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

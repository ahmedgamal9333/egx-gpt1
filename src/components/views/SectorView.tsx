import React from 'react';
import { PieChart, TrendingUp, Building2, Factory, Landmark, Cpu, Truck, Pill } from 'lucide-react';
import { EGXStockSummary } from '../../types';

interface SectorViewProps {
  stocks: EGXStockSummary[];
  onSelectStock: (ticker: string) => void;
  lang?: 'ar' | 'en';
}

export const SectorView: React.FC<SectorViewProps> = ({ stocks, onSelectStock, lang = 'ar' }) => {
  // Sector aggregates
  const sectorMap: { [key: string]: { nameAr: string; stocks: EGXStockSummary[]; totalVal: number; avgChange: number } } = {};

  stocks.forEach(s => {
    if (!sectorMap[s.sectorAr]) {
      sectorMap[s.sectorAr] = { nameAr: s.sectorAr, stocks: [], totalVal: 0, avgChange: 0 };
    }
    sectorMap[s.sectorAr].stocks.push(s);
    sectorMap[s.sectorAr].totalVal += s.valueTraded;
  });

  const sectors = Object.values(sectorMap).map(sec => {
    const totalChange = sec.stocks.reduce((acc, s) => acc + s.changePct, 0);
    sec.avgChange = Number((totalChange / sec.stocks.length).toFixed(2));
    return sec;
  }).sort((a, b) => b.totalVal - a.totalVal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PieChart className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
            {lang === 'ar' ? 'تحليل أداء وتدفقات القطاعات الاقتصادية' : 'Sector Intelligence'}
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">
          {lang === 'ar' ? 'أداء قطاعات البورصة المصرية وتمركز السيولة الاستثمارية' : 'EGX Sector Performance & Flows'}
        </h1>
      </div>

      {/* Sectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.map((sec, idx) => (
          <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">{sec.nameAr}</h3>
                <span className="text-xs text-slate-400">{sec.stocks.length} أسهم مدرجة</span>
              </div>
              <div className="text-right font-mono-numbers">
                <span className={`text-base font-black ${sec.avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {sec.avgChange >= 0 ? `+${sec.avgChange}%` : `${sec.avgChange}%`}
                </span>
                <span className="text-[10px] text-slate-500 block">متوسط الأداء</span>
              </div>
            </div>

            {/* Turnover volume */}
            <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono-numbers">
              <span className="text-slate-400 font-sans">إجمالي السيولة المنفذة:</span>
              <span className="font-bold text-cyan-400">
                {(sec.totalVal / 1000000).toFixed(1)} مليون جم
              </span>
            </div>

            {/* Top constituent stocks */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">أبرز أسهم القطاع:</span>
              <div className="space-y-1.5">
                {sec.stocks.slice(0, 3).map((stk) => (
                  <div
                    key={stk.ticker}
                    onClick={() => onSelectStock(stk.ticker)}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 cursor-pointer transition-colors text-xs"
                  >
                    <div>
                      <span className="font-bold text-white font-mono">{stk.ticker}</span>
                      <span className="text-[11px] text-slate-400 block line-clamp-1">{stk.nameAr}</span>
                    </div>
                    <div className="text-right font-mono-numbers">
                      <span className="font-bold text-white block">{stk.currentPrice} جم</span>
                      <span className={`text-[11px] ${stk.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stk.changePct >= 0 ? `+${stk.changePct}%` : `${stk.changePct}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

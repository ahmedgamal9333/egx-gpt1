import React, { useState, useEffect } from 'react';
import { Newspaper, Calendar, Search, ExternalLink, Sparkles } from 'lucide-react';
import { NewsItem, UpcomingEvent } from '../../types';

interface NewsViewProps {
  onSelectStock: (ticker: string) => void;
  lang?: 'ar' | 'en';
}

export const NewsView: React.FC<NewsViewProps> = ({ onSelectStock, lang = 'ar' }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(d => {
        setNews(d.news || []);
        setEvents(d.events || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredNews = filterCategory === 'ALL'
    ? news
    : news.filter(n => n.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Newspaper className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
            {lang === 'ar' ? 'الإفصاحات والأخبار الرسمية (Official Disclosures)' : 'News & Disclosures'}
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">
          {lang === 'ar' ? 'متابعة إفصاحات البورصة المصرية ونتائج الأعمال وقرارات مجالس الإدارات' : 'Corporate Disclosures & AI Sentiment'}
        </h1>
      </div>

      {/* Categories Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setFilterCategory('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterCategory === 'ALL'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          {lang === 'ar' ? 'كافة الأخبار والإفصاحات' : 'All Disclosures'}
        </button>
        <button
          onClick={() => setFilterCategory('EARNINGS')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterCategory === 'EARNINGS'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          نتائج الأعمال والأرباح
        </button>
        <button
          onClick={() => setFilterCategory('DISCLOSURE')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterCategory === 'DISCLOSURE'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          إفصاحات جوهرية
        </button>
        <button
          onClick={() => setFilterCategory('CONTRACT')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterCategory === 'CONTRACT'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          عقود واستثمارات
        </button>
        <button
          onClick={() => setFilterCategory('DIVIDEND')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterCategory === 'DIVIDEND'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          توزيعات نقدية
        </button>
      </div>

      {/* Disclosures Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filteredNews.map((n) => (
            <div
              key={n.id}
              onClick={() => onSelectStock(n.ticker)}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl cursor-pointer transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {n.ticker}
                  </span>
                  <span className="font-bold text-emerald-400">{n.categoryAr}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-mono">{n.publishedAt}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{n.source}</span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  n.impact === 'VERY_POSITIVE' || n.impact === 'POSITIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {n.impactAr}
                </span>
              </div>

              <h3 className="text-base font-bold text-white hover:text-emerald-400 transition-colors">
                {n.titleAr}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                {n.summaryAr}
              </p>
            </div>
          ))}
        </div>

        {/* Upcoming Corporate Calendar Sidebar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {lang === 'ar' ? 'أجندة الجمعيات والنتائج القادمة' : 'Upcoming Events Calendar'}
            </h3>
          </div>

          <div className="space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectStock(ev.ticker)}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-mono-numbers">
                  <span className="font-bold text-white font-mono">{ev.ticker}</span>
                  <span className="text-emerald-400 font-bold">{ev.eventDate}</span>
                </div>
                <div className="font-bold text-slate-200 text-xs">{ev.eventNameAr}</div>
                <p className="text-[11px] text-slate-400 leading-tight">{ev.detailsAr}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

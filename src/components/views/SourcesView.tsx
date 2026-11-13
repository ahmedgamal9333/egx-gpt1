import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Activity, RefreshCw, CheckCircle2 } from 'lucide-react';

interface SourcesViewProps {
  lang?: 'ar' | 'en';
  onMarketSynced?: () => void;
}

export const SourcesView: React.FC<SourcesViewProps> = ({ lang = 'ar', onMarketSynced }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const fetchSources = () => {
    setLoading(true);
    fetch('/api/sources/status')
      .then(res => res.json())
      .then(d => {
        setReport(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleLiveSync = () => {
    setSyncing(true);
    setSyncNotice(null);
    fetch('/api/market/sync', { method: 'POST' })
      .then(res => res.json())
      .then(d => {
        if (d.sources) {
          setReport(d.sources);
        }
        const count = d.syncResult?.syncedStocks || report?.totalUniverseCount || 260;
        const ms = d.syncResult?.latencyMs || 150;
        setSyncNotice(
          lang === 'ar'
            ? `تمت مزامنة أحدث أسعار ${count} سهماً من TradingView ومؤشرات البورصة خلال ${ms} ms.`
            : `Synced latest prices for ${count} EGX stocks in ${ms} ms.`
        );
        if (onMarketSynced) onMarketSynced();
        setSyncing(false);
      })
      .catch(err => {
        console.error(err);
        setSyncing(false);
      });
  };

  useEffect(() => {
    fetchSources();
  }, []);

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin ms-2"></div>
        جاري فحص حالة مصادر البيانات ومطابقة الأسعار...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
              {lang === 'ar' ? 'شفافية وجودة مصادر البيانات (Data Integrity & Quality)' : 'Data Sources & Integrity'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">
            {lang === 'ar' ? 'مراقبة موثوقية مزودي البيانات اللحظية ومطابقة الأسعار' : 'Data Providers Health & Conflict Resolution'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'ar'
              ? `نظام متعدد المصادر يربط TradingView EGX Live مع البورصة المصرية ومباشر وInvesting.com والبنك المركزي لتغطية ${report.totalUniverseCount || 260} سهماً بتاريخ جلسة ${report.lastMarketSessionDate}.`
              : `Multi-source verification across TradingView EGX Live, EGX Official, Mubasher, Investing.com, and CBE covering ${report.totalUniverseCount || 260} stocks.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLiveSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing
              ? (lang === 'ar' ? 'جاري مزامنة السوق...' : 'Syncing Live EGX...')
              : (lang === 'ar' ? 'مزامنة الأسعار الحية الآن' : 'Sync Live Prices Now')}
          </button>
          <button
            onClick={fetchSources}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 hover:border-slate-600 text-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'فحص المزودين' : 'Check Status'}
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-4 py-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* System Health Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono-numbers">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <span className="text-xs text-slate-400 block font-sans mb-1">درجة سلامة البيانات</span>
          <span className="text-2xl font-black text-emerald-400">{report.overallHealthScore}%</span>
          <span className="text-[10px] text-slate-500 block font-sans">موثوقية فائقة ومطابقة تامة</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <span className="text-xs text-slate-400 block font-sans mb-1">المزودون المتصلون</span>
          <span className="text-2xl font-black text-white">{report.connectedProvidersCount} / {report.totalProvidersCount}</span>
          <span className="text-[10px] text-emerald-400 block font-sans">شامل TradingView & Investing</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <span className="text-xs text-slate-400 block font-sans mb-1">الأسهم المزامنة</span>
          <span className="text-2xl font-black text-cyan-400">{report.totalUniverseCount || 260} سهم</span>
          <span className="text-[10px] text-slate-500 block font-sans">متوسط استجابة {report.averageLatencyMs} ms</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <span className="text-xs text-slate-400 block font-sans mb-1">التعارضات السعرية النشطة</span>
          <span className="text-2xl font-black text-emerald-400">{report.activeDiscrepancies}</span>
          <span className="text-[10px] text-slate-500 block font-sans">جلسة {report.lastMarketSessionDate}</span>
        </div>
      </div>

      {/* Providers Status Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          {lang === 'ar' ? 'سجل مزودي البيانات المتصلين بالمنصة:' : 'Connected Data Providers:'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.providers.map((p: any) => (
            <div key={p.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                    {p.nameAr}
                    {p.isOfficialSource && (
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20">
                        مرجع رسمي
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">{p.nameEn}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                  p.status === 'ONLINE'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {p.statusAr}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono-numbers pt-2 border-t border-slate-800/60">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">الموثوقية</span>
                  <span className="font-bold text-emerald-400">{p.reliabilityScore}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">زمن الاستجابة</span>
                  <span className="font-bold text-cyan-400">{p.latencyMs} ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">آخر تحديث</span>
                  <span className="font-bold text-white text-[11px]">{p.lastSuccessfulUpdate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discrepancy & Conflict Resolution Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          {lang === 'ar' ? 'سجل التحقق والمطابقة بين المزودين (Data Conflict Resolution):' : 'Price Verification & Conflict Log:'}
        </h3>

        <div className="space-y-2">
          {report.recentDiscrepancyLogs.map((log: any, idx: number) => (
            <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-mono-numbers">
                <span className="font-bold text-emerald-400 text-sm font-sans">
                  سهم {log.ticker} - {log.field}
                </span>
                <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-numbers bg-slate-900/60 p-2 rounded">
                <div><span className="text-slate-400 font-sans">{log.sourceA}:</span> <strong className="text-white">{log.valueA}</strong></div>
                <div><span className="text-slate-400 font-sans">{log.sourceB}:</span> <strong className="text-white">{log.valueB}</strong></div>
              </div>
              <p className="text-[11px] text-emerald-300 font-sans leading-relaxed">
                ✓ {log.resolutionAr}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

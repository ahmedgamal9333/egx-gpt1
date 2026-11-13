import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

export interface TradingViewWidgetProps {
  symbol: string;
  interval?: '1' | '5' | '15' | '60' | '240' | 'D' | 'W' | 'M';
  lang?: 'ar' | 'en';
  height?: number;
  studies?: string[];
  allowSymbolChange?: boolean;
  hideSideToolbar?: boolean;
  onFallbackRequested?: () => void;
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol,
  interval = 'D',
  lang = 'ar',
  height = 580,
  studies = ['STD;EMA', 'STD;RSI'],
  allowSymbolChange = true,
  hideSideToolbar = false,
  onFallbackRequested
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadNonce, setReloadNonce] = useState(0);

  const studiesKey = studies.join('|');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setStatus('loading');
    container.innerHTML = '';

    const widgetWrapper = document.createElement('div');
    widgetWrapper.className = 'tradingview-widget-container__widget';
    widgetWrapper.style.width = '100%';
    widgetWrapper.style.height = '100%';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;

    const config = {
      autosize: true,
      symbol,
      interval,
      timezone: 'Africa/Cairo',
      theme: 'dark',
      style: '1',
      locale: lang === 'ar' ? 'ar_AE' : 'en',
      backgroundColor: '#090d16',
      gridColor: 'rgba(30, 41, 59, 0.45)',
      withdateranges: true,
      hide_side_toolbar: hideSideToolbar,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      allow_symbol_change: allowSymbolChange,
      save_image: true,
      calendar: false,
      details: false,
      studies,
      support_host: 'https://www.tradingview.com'
    };

    script.innerHTML = JSON.stringify(config);

    let settled = false;
    const observer = new MutationObserver(() => {
      if (container.querySelector('iframe')) {
        settled = true;
        setStatus('ready');
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    script.onload = () => {
      setTimeout(() => {
        if (container.querySelector('iframe')) {
          settled = true;
          setStatus('ready');
        }
      }, 400);
    };

    script.onerror = () => {
      if (!settled) {
        settled = true;
        setStatus('error');
      }
      observer.disconnect();
    };

    const timeoutId = window.setTimeout(() => {
      if (!settled && !container.querySelector('iframe')) {
        setStatus('error');
        observer.disconnect();
      }
    }, 9000);

    container.appendChild(widgetWrapper);
    container.appendChild(script);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, interval, lang, studiesKey, allowSymbolChange, hideSideToolbar, reloadNonce]);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-[#090d16]"
      style={{ height: `${height}px` }}
      dir="ltr"
    >
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full h-full"
      />

      {status === 'loading' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#090d16]/90 backdrop-blur-sm z-10 pointer-events-none"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-300">
            {lang === 'ar'
              ? `جاري تحميل شارت TradingView المباشر (${symbol})...`
              : `Loading TradingView Live Chart (${symbol})...`}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-[#090d16] z-20"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h4 className="text-sm font-bold text-white">
              {lang === 'ar'
                ? 'تعذر الاتصال بخوادم TradingView الخارجية من المتصفح'
                : 'Unable to reach external TradingView widget'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'ar'
                ? 'قد يكون هناك حظر للشبكة أو مانع إعلانات يمنع تحميل إطار TradingView. يمكنك إعادة المحاولة أو التبديل فوراً إلى محرك TradingView المدمج مع أهداف الذكاء الاصطناعي.'
                : 'Network restrictions or an ad blocker may be blocking s3.tradingview.com. Retry or switch to the built-in TradingView Lightweight Engine.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setReloadNonce((n) => n + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
            {onFallbackRequested && (
              <button
                type="button"
                onClick={onFallbackRequested}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                {lang === 'ar' ? 'تشغيل محرك TradingView المدمج' : 'Switch to Built-in Engine'}
              </button>
            )}
            <a
              href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'فتح في TradingView' : 'Open on TradingView'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

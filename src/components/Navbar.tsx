import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Bell, Globe, Sparkles, Menu, X, MessageSquareText } from 'lucide-react';
import { EGXStockSummary } from '../types';
import { rankSearchResults } from '../utils/searchUtils';

interface NavbarProps {
  stocks: EGXStockSummary[];
  marketOverview?: any;
  selectedTicker: string;
  onSelectStock: (ticker: string) => void;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onOpenAiChat?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  stocks,
  marketOverview,
  selectedTicker,
  onSelectStock,
  lang,
  onToggleLang,
  unreadAlertsCount,
  onOpenAlerts,
  onOpenAiChat,
  onToggleMobileMenu,
  isMobileMenuOpen = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const allMatches = useMemo(() => {
    return searchQuery.trim() ? rankSearchResults(stocks, searchQuery) : [];
  }, [stocks, searchQuery]);

  const visibleMatches = useMemo(() => allMatches.slice(0, 25), [allMatches]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  const handleSelectResult = (ticker: string) => {
    onSelectStock(ticker);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (e.key === 'ArrowDown') {
      if (!isSearchOpen && visibleMatches.length > 0) setIsSearchOpen(true);
      if (visibleMatches.length > 0) {
        e.preventDefault();
        setHighlightedIndex(i => Math.min(visibleMatches.length - 1, i + 1));
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      if (visibleMatches.length > 0) {
        e.preventDefault();
        setHighlightedIndex(i => Math.max(0, i - 1));
      }
      return;
    }
    if (e.key === 'Enter' && visibleMatches.length > 0) {
      e.preventDefault();
      const target = visibleMatches[highlightedIndex] || visibleMatches[0];
      if (target) handleSelectResult(target.ticker);
    }
  };

  const egx30Val = marketOverview?.egx30?.value ?? 52023.4;
  const egx30Chg = marketOverview?.egx30?.changePct ?? -0.91;
  const fxRate = marketOverview?.cbeData?.fxUsdEgpRate ?? 53.39;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl px-3 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-3 lg:gap-4">
        {/* Brand & Mobile Menu */}
        <div className="flex items-center gap-2.5">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title={lang === 'ar' ? 'القائمة الرئيسية' : 'Menu'}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-emerald-400" /> : <Menu className="w-4 h-4" />}
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-lg shrink-0">
              E
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
                  EGX AI Analyst
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> PRO
                </span>
              </div>
              <div className="hidden sm:block text-[11px] text-slate-400 font-medium">
                {lang === 'ar'
                  ? `المحلل الذكي للبورصة المصرية (${stocks.length || 260} سهم)`
                  : `EGX AI Platform (${stocks.length || 260} stocks)`}
              </div>
            </div>
          </div>

          {/* Live EGX30 & USD/EGP status ticker (desktop) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800 text-xs text-slate-300 ms-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              {lang === 'ar' ? 'مؤشر EGX30:' : 'EGX30:'}{' '}
              <strong className={`font-mono-numbers ${egx30Chg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {egx30Val.toLocaleString()} ({egx30Chg >= 0 ? `+${egx30Chg}%` : `${egx30Chg}%`})
              </strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              {lang === 'ar' ? 'الدولار/جنيه:' : 'USD/EGP:'}{' '}
              <strong className="text-white font-mono-numbers">{fxRate}</strong>
            </span>
          </div>
        </div>

        {/* Global Search Bar with RTL/LTR Logical Positioning & Keyboard Navigation */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-1 sm:mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder={
                lang === 'ar'
                  ? `ابحث في ${stocks.length || 260} سهم بالاسم أو الكود (COMI, CIB, فوري...)`
                  : `Search ${stocks.length || 260} EGX stocks by name or ticker...`
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setIsSearchOpen(true);
                }
              }}
              onKeyDown={handleInputKeyDown}
              className="w-full bg-slate-900/90 text-xs sm:text-sm text-slate-100 placeholder-slate-500 ps-9 pe-9 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown Menu */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full mt-1.5 start-0 end-0 w-full bg-slate-900/95 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto z-50 backdrop-blur-xl">
              {visibleMatches.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                    <span>{lang === 'ar' ? 'نتائج البحث السريع' : 'Quick Search Results'}</span>
                    <span>
                      {allMatches.length > visibleMatches.length
                        ? (lang === 'ar' ? `أول ${visibleMatches.length} من ${allMatches.length} سهم` : `Top ${visibleMatches.length} of ${allMatches.length}`)
                        : `${allMatches.length} ${lang === 'ar' ? 'سهم' : 'stocks'}`}
                    </span>
                  </div>
                  {visibleMatches.map((s, idx) => (
                    <button
                      key={s.ticker}
                      type="button"
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelectResult(s.ticker)}
                      className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-start hover:bg-slate-800/90 transition-colors border-b border-slate-800/60 last:border-b-0 ${
                        idx === highlightedIndex
                          ? 'bg-emerald-950/50 border-s-2 border-s-emerald-500'
                          : selectedTicker === s.ticker
                          ? 'bg-slate-800/70'
                          : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm font-mono">{s.ticker}</span>
                          <span className="text-xs text-slate-200 font-semibold truncate">{s.nameAr}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">{s.index}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {s.nameEn} • {s.sectorAr}
                        </div>
                      </div>
                      <div className="text-end font-mono-numbers shrink-0">
                        <span className="font-bold text-white text-sm block">
                          {s.currentPrice} {s.currency === 'USD' ? '$' : 'جم'}
                        </span>
                        <span className={`text-xs ${s.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {s.changePct >= 0 ? `+${s.changePct}%` : `${s.changePct}%`}
                        </span>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                  <div className="font-bold text-slate-200">
                    {lang === 'ar' ? `لا توجد نتائج مطابقة لـ "${searchQuery}"` : `No matching stocks for "${searchQuery}"`}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'ar'
                      ? 'جرب البحث برمز السهم (مثل COMI, ETEL, TMGH) أو الاسم بالعربية أو الإنجليزية أو رقم ISIN'
                      : 'Try searching by ticker, company name, or ISIN code'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenAiChat && (
            <button
              onClick={onOpenAiChat}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 hover:text-white text-xs font-bold transition-all whitespace-nowrap shrink-0"
              title={lang === 'ar' ? 'المحلل الحواري الذكي' : 'AI Analyst Chat'}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'اسأل المحلل الذكي' : 'Ask AI'}</span>
            </button>
          )}

          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
            title={lang === 'ar' ? 'التنبيهات الذكية' : 'Smart Alerts'}
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -end-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

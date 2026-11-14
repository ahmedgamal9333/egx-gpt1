import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  stocks = [],
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
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allMatches = useMemo(
    () => searchQuery.trim() ? rankSearchResults(stocks || [], searchQuery) : [],
    [stocks, searchQuery]
  );
  const visibleMatches = useMemo(() => allMatches.slice(0, 30), [allMatches]);

  useEffect(() => setHighlightedIndex(0), [searchQuery]);

  const selectResult = (ticker: string) => {
    onSelectStock(ticker);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsSearchOpen(false);
      inputRef.current?.blur();
    } else if (event.key === 'ArrowDown' && visibleMatches.length) {
      event.preventDefault();
      setIsSearchOpen(true);
      setHighlightedIndex(index => Math.min(visibleMatches.length - 1, index + 1));
    } else if (event.key === 'ArrowUp' && visibleMatches.length) {
      event.preventDefault();
      setHighlightedIndex(index => Math.max(0, index - 1));
    } else if (event.key === 'Enter' && visibleMatches.length) {
      event.preventDefault();
      selectResult((visibleMatches[highlightedIndex] || visibleMatches[0]).ticker);
    }
  };

  const stockCount = stocks?.length || 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl px-3 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-3 lg:gap-4">
        <div className="flex items-center gap-2.5 shrink-0">
          {onToggleMobileMenu && (
            <button onClick={onToggleMobileMenu} className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300" title={lang === 'ar' ? 'القائمة الرئيسية' : 'Menu'}>
              {isMobileMenuOpen ? <X className="w-4 h-4 text-emerald-400" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-black text-lg">E</div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-white whitespace-nowrap">EGX AI Analyst</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> AI</span>
              </div>
              <div className="hidden sm:block text-[11px] text-slate-400 font-medium">
                {lang === 'ar' ? `دليل الأسهم المتاحة: ${stockCount}` : `Available securities: ${stockCount}`}
              </div>
            </div>
          </div>
        </div>

        <div ref={searchContainerRef} className="relative flex-1 max-w-xl mx-1 sm:mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              placeholder={lang === 'ar' ? `ابحث بين ${stockCount} سهمًا بالاسم أو الرمز أو ISIN...` : `Search ${stockCount} stocks by name, ticker or ISIN...`}
              value={searchQuery}
              onChange={event => { setSearchQuery(event.target.value); setIsSearchOpen(true); }}
              onFocus={() => { if (searchQuery.trim()) setIsSearchOpen(true); }}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-900/90 text-xs sm:text-sm text-slate-100 placeholder-slate-500 ps-9 pe-9 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              aria-label={lang === 'ar' ? 'البحث عن سهم' : 'Search stocks'}
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); setIsSearchOpen(false); inputRef.current?.focus(); }} aria-label="Clear search" className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full mt-1.5 start-0 end-0 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto z-50">
              {visibleMatches.length > 0 ? (
                <>
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 bg-slate-950 border-b border-slate-800 flex justify-between">
                    <span>{lang === 'ar' ? 'نتائج البحث' : 'Search results'}</span>
                    <span>{allMatches.length} {lang === 'ar' ? 'نتيجة' : 'matches'}</span>
                  </div>
                  {visibleMatches.map((stock, index) => (
                    <button key={stock.ticker} type="button" onMouseEnter={() => setHighlightedIndex(index)} onClick={() => selectResult(stock.ticker)}
                      className={`w-full px-3.5 py-3 flex items-center justify-between gap-3 text-start border-b border-slate-800/70 last:border-0 hover:bg-slate-800 ${index === highlightedIndex || selectedTicker === stock.ticker ? 'bg-slate-800/80' : ''}`}>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm font-mono">{stock.ticker}</span>
                          <span className="text-xs text-slate-200 font-semibold truncate">{stock.nameAr || stock.nameEn}</span>
                          {stock.index && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{stock.index}</span>}
                        </span>
                        <span className="block text-[11px] text-slate-400 truncate mt-0.5">{stock.nameEn} {stock.sectorAr ? `• ${stock.sectorAr}` : ''}</span>
                      </span>
                      <span className="text-end shrink-0">
                        <span className="block text-xs font-semibold text-slate-300">
                          {typeof stock.currentPrice === 'number' && stock.currentPrice > 0 ? `${stock.currentPrice} ${stock.currency || 'EGP'}` : (lang === 'ar' ? 'السعر غير متاح' : 'Quote unavailable')}
                        </span>
                        {typeof stock.changePct === 'number' && <span className={`text-[11px] ${stock.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{stock.changePct >= 0 ? '+' : ''}{stock.changePct}%</span>}
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-5 text-center text-xs text-slate-400">
                  <div className="font-bold text-slate-200">{lang === 'ar' ? `لا توجد نتيجة مطابقة لـ "${searchQuery}"` : `No matches for "${searchQuery}"`}</div>
                  <div className="mt-1">{lang === 'ar' ? 'جرّب الرمز أو الاسم العربي أو الإنجليزي أو رقم ISIN.' : 'Try ticker, Arabic or English name, or ISIN.'}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenAiChat && <button onClick={onOpenAiChat} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold" title={lang === 'ar' ? 'اسأل المحلل الذكي' : 'Ask AI'}><MessageSquareText className="w-3.5 h-3.5" /><span className="hidden sm:inline">{lang === 'ar' ? 'اسأل المحلل' : 'Ask AI'}</span></button>}
          <button onClick={onOpenAlerts} className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300" title={lang === 'ar' ? 'التنبيهات' : 'Alerts'}>
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && <span className="absolute -top-1 -end-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadAlertsCount}</span>}
          </button>
          <button onClick={onToggleLang} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold"><Globe className="w-3.5 h-3.5 text-emerald-400" /><span>{lang === 'ar' ? 'English' : 'عربي'}</span></button>
        </div>
      </div>
    </header>
  );
};

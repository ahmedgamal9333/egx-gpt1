import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { MarketView } from './components/views/MarketView';
import { ScreenerView } from './components/views/ScreenerView';
import { StockAnalysisView } from './components/views/StockAnalysisView';
import { PortfolioView } from './components/views/PortfolioView';
import { HistoryView } from './components/views/HistoryView';
import { BacktestView } from './components/views/BacktestView';
import { SourcesView } from './components/views/SourcesView';
import { SectorView } from './components/views/SectorView';
import { NewsView } from './components/views/NewsView';
import { SettingsView } from './components/views/SettingsView';
import { AiChatView } from './components/views/AiChatView';

import { EGXStockSummary, DetailedStockPayload, SmartAlert, ChatMessage } from './types';
import { Bell, X } from 'lucide-react';

export function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');
  const [selectedTicker, setSelectedTicker] = useState<string>('COMI');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Data states
  const [stocks, setStocks] = useState<EGXStockSummary[]>([]);
  const [marketOverview, setMarketOverview] = useState<any>(null);
  const [detailedStock, setDetailedStock] = useState<DetailedStockPayload | null>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Sync dir attribute with language
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const fetchMarketBundle = () => {
    return Promise.all([
      fetch('/api/stocks').then(res => res.json()),
      fetch('/api/market/overview').then(res => res.json()),
      fetch('/api/portfolio').then(res => res.json()),
      fetch('/api/alerts').then(res => res.json())
    ])
      .then(([stocksData, marketData, portData, alertsData]) => {
        setStocks(stocksData);
        setMarketOverview(marketData);
        setPortfolio(portData);
        setAlerts(alertsData);
        setInitialLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch initial data:", err);
        setInitialLoading(false);
      });
  };

  // Initial data loading
  useEffect(() => {
    fetchMarketBundle();
  }, []);

  const loadStockDetails = (ticker: string) => {
    setLoadingStock(true);
    setStockError(null);
    fetch(`/api/stocks/${ticker}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        setDetailedStock(data);
        setLoadingStock(false);
      })
      .catch(err => {
        console.error("Failed to load stock details:", err);
        setStockError(err.message || "Failed to load stock");
        setLoadingStock(false);
      });
  };

  // Fetch detailed stock bundle when selectedTicker changes
  useEffect(() => {
    if (!selectedTicker) return;
    loadStockDetails(selectedTicker);
  }, [selectedTicker]);

  const handleSelectStock = (ticker: string) => {
    setSelectedTicker(ticker);
    setActiveTab('ANALYSIS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddTransaction = (t: string, shares: number, buyPrice: number) => {
    fetch('/api/portfolio/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: t, shares, buyPrice })
    })
      .then(res => res.json())
      .then(d => setPortfolio(d))
      .catch(console.error);
  };

  const handleRemoveTransaction = (t: string) => {
    fetch('/api/portfolio/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: t })
    })
      .then(res => res.json())
      .then(d => setPortfolio(d))
      .catch(console.error);
  };

  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  const handleSendChatMessage = async (text: string, focusTicker?: string) => {
    const timeStr = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: timeStr
    };

    const historyPayload = chatMessages
      .filter(m => !m.isError)
      .slice(-10)
      .map(m => ({ role: m.role, text: m.text }));

    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          activeTicker: focusTicker || selectedTicker,
          activeTab,
          lang
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }

      const modelMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: data.reply || '',
        timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        usedTools: data.usedTools,
        webSources: data.webSources,
        mentionedTickers: data.mentionedTickers
      };

      setChatMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: err?.message || (lang === 'ar' ? 'تعذر الاتصال بالمحلل الذكي حالياً.' : 'Failed to reach AI Analyst.'),
        timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isError: true
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        stocks={stocks}
        marketOverview={marketOverview}
        selectedTicker={selectedTicker}
        onSelectStock={handleSelectStock}
        lang={lang}
        onToggleLang={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
        unreadAlertsCount={unreadAlertsCount}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        isDark={true}
        onToggleTheme={() => {}}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(open => !open)}
        isMobileMenuOpen={isMobileSidebarOpen}
      />

      {/* Main Terminal Body */}
      <div className="flex-1 flex w-full">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          marketOverview={marketOverview}
          lang={lang}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full min-w-0">
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-semibold">
                {lang === 'ar' ? 'جاري الاتصال بمحرك البورصة المصرية وجلب البيانات...' : 'Connecting to EGX Market Engine...'}
              </span>
            </div>
          ) : (
            <>
              {activeTab === 'DASHBOARD' && (
                <DashboardView
                  stocks={stocks}
                  marketOverview={marketOverview}
                  alerts={alerts}
                  onSelectStock={handleSelectStock}
                  lang={lang}
                />
              )}

              {activeTab === 'AI_CHAT' && (
                <AiChatView
                  messages={chatMessages}
                  isLoading={chatLoading}
                  onSendMessage={handleSendChatMessage}
                  onClearChat={() => setChatMessages([])}
                  stocks={stocks}
                  marketOverview={marketOverview}
                  selectedTicker={selectedTicker}
                  onSelectStock={handleSelectStock}
                  lang={lang}
                  variant="page"
                />
              )}

              {activeTab === 'MARKET' && (
                <MarketView
                  overview={marketOverview}
                  lang={lang}
                />
              )}

              {activeTab === 'SCREENER' && (
                <ScreenerView
                  stocks={stocks}
                  onSelectStock={handleSelectStock}
                  lang={lang}
                />
              )}

              {activeTab === 'ANALYSIS' && (
                <>
                  {loadingStock ? (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-slate-400">
                      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold">
                        {lang === 'ar' ? `جاري تشغيل محرك التحليل والذكاء الاصطناعي لسهم ${selectedTicker}...` : `Analyzing ${selectedTicker}...`}
                      </span>
                    </div>
                  ) : stockError || !detailedStock ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto my-12">
                      <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20 text-xl font-bold">
                        !
                      </div>
                      <h3 className="text-base font-bold text-white">
                        {lang === 'ar' ? `تعذر تحميل بيانات سهم ${selectedTicker}` : `Failed to load ${selectedTicker}`}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {lang === 'ar' ? 'حدث تأخير في الاستجابة أو انقطاع اتصال مؤقت. يرجى إعادة المحاولة.' : 'Temporary response delay. Please retry.'}
                      </p>
                      <button
                        onClick={() => loadStockDetails(selectedTicker)}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
                      >
                        {lang === 'ar' ? 'إعادة المحاولة الآن' : 'Retry Now'}
                      </button>
                    </div>
                  ) : (
                    <StockAnalysisView
                      data={detailedStock}
                      onRefreshData={() => loadStockDetails(selectedTicker)}
                      lang={lang}
                    />
                  )}
                </>
              )}

              {activeTab === 'PORTFOLIO' && (
                <PortfolioView
                  portfolio={portfolio}
                  stocks={stocks}
                  onAddTransaction={handleAddTransaction}
                  onRemoveTransaction={handleRemoveTransaction}
                  onSelectStock={handleSelectStock}
                  lang={lang}
                />
              )}

              {activeTab === 'HISTORY' && (
                <HistoryView
                  onSelectStock={handleSelectStock}
                  lang={lang}
                />
              )}

              {activeTab === 'BACKTEST' && (
                <BacktestView
                  stocks={stocks}
                  lang={lang}
                />
              )}

              {activeTab === 'SOURCES' && (
                <SourcesView
                  lang={lang}
                  onMarketSynced={() => {
                    fetchMarketBundle();
                    if (selectedTicker) loadStockDetails(selectedTicker);
                  }}
                />
              )}

              {activeTab === 'SECTORS' && (
                <SectorView
                  stocks={stocks}
                  onSelectStock={handleSelectStock}
                  lang={lang}
                />
              )}

              {activeTab === 'NEWS' && (
                <NewsView
                  onSelectStock={handleSelectStock}
                  lang={lang}
                />
              )}

              {activeTab === 'WATCHLIST' && (
                <ScreenerView
                  stocks={stocks.filter(s => ['COMI', 'TMGH', 'SWDY', 'MFPC', 'ETEL', 'FWRY', 'GBCO'].includes(s.ticker))}
                  onSelectStock={handleSelectStock}
                  lang={lang}
                />
              )}

              {activeTab === 'SETTINGS' && (
                <SettingsView
                  lang={lang}
                  onToggleLang={() => setLang(l => (l === 'ar' ? 'en' : 'ar'))}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Smart Alerts Slide-Over Drawer */}
      {isAlertsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl animate-slide-left">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    {lang === 'ar' ? 'مركز التنبيهات الذكية اللحظية' : 'Smart Alerts Center'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAlertsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-1">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      handleSelectStock(a.ticker);
                      setIsAlertsOpen(false);
                    }}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono-numbers">
                      <span className="font-bold text-emerald-400">{a.ticker} - {a.typeAr}</span>
                      <span className="text-[10px] text-slate-500">{a.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {a.messageAr}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsAlertsOpen(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* AI Analyst Chat Quick Slide-Over Drawer */}
      {isAiChatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-950 border-s border-slate-800 h-full shadow-2xl flex flex-col">
            <AiChatView
              messages={chatMessages}
              isLoading={chatLoading}
              onSendMessage={handleSendChatMessage}
              onClearChat={() => setChatMessages([])}
              stocks={stocks}
              marketOverview={marketOverview}
              selectedTicker={selectedTicker}
              onSelectStock={handleSelectStock}
              lang={lang}
              variant="drawer"
              onCloseDrawer={() => setIsAiChatOpen(false)}
              onExpandToFull={() => {
                setIsAiChatOpen(false);
                setActiveTab('AI_CHAT');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


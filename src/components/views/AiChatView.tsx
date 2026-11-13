import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Trash2,
  TrendingUp,
  ExternalLink,
  Search,
  BarChart3,
  Briefcase,
  Globe,
  Layers,
  Maximize2,
  X,
  RotateCcw,
  MessageSquareText
} from 'lucide-react';
import { ChatMessage, EGXStockSummary } from '../../types';
import { ChatMarkdownRenderer } from '../ChatMarkdownRenderer';

interface AiChatViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, focusTicker?: string) => void;
  onClearChat: () => void;
  stocks: EGXStockSummary[];
  marketOverview: any;
  selectedTicker: string;
  onSelectStock: (ticker: string) => void;
  lang?: 'ar' | 'en';
  variant?: 'page' | 'drawer';
  onExpandToFull?: () => void;
  onCloseDrawer?: () => void;
}

export const AiChatView: React.FC<AiChatViewProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
  stocks,
  marketOverview,
  selectedTicker,
  onSelectStock,
  lang = 'ar',
  variant = 'page',
  onExpandToFull,
  onCloseDrawer
}) => {
  const [input, setInput] = useState('');
  const [focusTicker, setFocusTicker] = useState<string>(selectedTicker || 'COMI');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedTicker) {
      setFocusTicker(selectedTicker);
    }
  }, [selectedTicker]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const focusedStock = useMemo(
    () => stocks.find(s => s.ticker === focusTicker) || stocks[0],
    [stocks, focusTicker]
  );

  const quickPrompts = useMemo(() => {
    const t = focusedStock?.ticker || 'COMI';
    if (lang === 'en') {
      return [
        {
          id: 'stock-deep',
          icon: BarChart3,
          title: `Deep Analysis: ${t}`,
          prompt: `Give me a complete technical, fundamental, and fair value analysis for ${t} with a logical swing trading plan (entry zone, stop loss, targets, R:R).`
        },
        {
          id: 'market-screener',
          icon: Search,
          title: 'Top EGX Opportunities',
          prompt: 'Screen the EGX market right now and rank the top 5 stocks by overall score, fair value upside, and healthy RSI.'
        },
        {
          id: 'portfolio-audit',
          icon: Briefcase,
          title: 'Audit My Portfolio',
          prompt: 'Analyze my current portfolio holdings, sector concentration, unrealized P&L, and suggest logical rebalancing actions.'
        },
        {
          id: 'compare',
          icon: Layers,
          title: 'Compare Blue Chips',
          prompt: 'Compare COMI, TMGH, and SWDY in a clear table across P/E, ROE, fair value upside, trend, and trading plan.'
        },
        {
          id: 'web-macro',
          icon: Globe,
          title: 'Live Macro & Web Search',
          prompt: 'Search the latest news on Egypt interest rates, inflation, and CBE decisions and explain their logical impact on EGX banking and real estate stocks.'
        },
        {
          id: 'sectors-stats',
          icon: TrendingUp,
          title: 'Sector & History Stats',
          prompt: 'Summarize today’s EGX sector performance statistics along with the platform historical recommendation audit metrics.'
        }
      ];
    }

    return [
      {
        id: 'stock-deep',
        icon: BarChart3,
        title: `تحليل متكامل لسهم ${t}`,
        prompt: `اعمل تحليل فني ومالي شامل لسهم ${t} مع تقييم القيمة العادلة وخطة تداول متأرجح منطقية (نطاق الدخول، وقف الخسارة، الأهداف، ومعامل العائد للمخاطرة).`
      },
      {
        id: 'market-screener',
        icon: Search,
        title: 'أفضل فرص السوق الآن',
        prompt: 'امسح السوق المصري حالياً ورتب لي أقوى 5 أسهم للشراء بناءً على التقييم الكلي، هامش الأمان مقابل القيمة العادلة، ومؤشر RSI.'
      },
      {
        id: 'portfolio-audit',
        icon: Briefcase,
        title: 'مراجعة وتدقيق المحفظة',
        prompt: 'راجع محفظتي الاستثمارية الحالية بالكامل وحلل الأرباح والخسائر والوزن النسبي لكل سهم، وما هي التوصية المنطقية لكل مركز؟'
      },
      {
        id: 'compare',
        icon: Layers,
        title: 'مقارنة الأسهم القيادية',
        prompt: 'اعرض مقارنة رقمية ومنطقية في جدول بين COMI و TMGH و SWDY من حيث مضاعف الربحية والعائد على الملكية والقيمة العادلة والاتجاه الفني.'
      },
      {
        id: 'web-macro',
        icon: Globe,
        title: 'بحث حي: الفائدة والاقتصاد',
        prompt: 'ابحث في آخر الأخبار الاقتصادية وقرارات البنك المركزي المصري وأسعار الفائدة والتضخم، وحلل تأثيرها المنطقي على أسهم البنوك والعقارات في البورصة المصرية.'
      },
      {
        id: 'sectors-stats',
        icon: TrendingUp,
        title: 'إحصائيات القطاعات والتوصيات',
        prompt: 'لخص إحصائيات قطاعات البورصة المصرية اليوم وأفضل الأسهم في كل قطاع، مع عرض إحصائيات دقة سجل توصيات المنصة التاريخي.'
      }
    ];
  }, [focusedStock, lang]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed, focusTicker);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNavigateTicker = (ticker: string) => {
    onSelectStock(ticker);
    if (variant === 'drawer' && onCloseDrawer) {
      onCloseDrawer();
    }
  };

  const handleRetryLast = () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser && !isLoading) {
      onSendMessage(lastUser.text, focusTicker);
    }
  };

  const isDrawer = variant === 'drawer';

  return (
    <div
      className={
        isDrawer
          ? 'flex flex-col h-full bg-slate-950 text-slate-100'
          : 'grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch min-h-[calc(100vh-118px)]'
      }
    >
      {/* Side Context & Prompt Library (Full Page View Desktop) */}
      {!isDrawer && (
        <aside className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1.5">
                <MessageSquareText className="w-4 h-4" />
                <span>{lang === 'ar' ? 'المحلل الحواري المربوط بالبيانات والبحث' : 'Data-Grounded AI Analyst'}</span>
              </div>
              <h1 className="text-xl font-black text-white">
                {lang === 'ar' ? 'محادثة الذكاء الاصطناعي للبورصة المصرية' : 'EGX AI Research Assistant'}
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {lang === 'ar'
                  ? 'يتصل مباشرة ببيانات 260+ سهم، المحرك الفني، القيمة العادلة، المحفظة، سجل التوصيات، وبحث جوجل الحي لصياغة إجابات منطقية مدعومة بالأرقام.'
                  : 'Connected directly to live EGX equities, technical & valuation engines, portfolio holdings, audit history, and live web search.'}
              </p>
            </div>

            {/* Active Stock Context Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                {lang === 'ar' ? 'السهم المرجعي في السياق' : 'Active Context Stock'}
              </label>
              <select
                value={focusTicker}
                onChange={(e) => setFocusTicker(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-emerald-500"
              >
                {stocks.map(s => (
                  <option key={s.ticker} value={s.ticker}>
                    {s.ticker} - {s.nameAr} ({s.currentPrice} {s.currency === 'USD' ? '$' : 'جم'})
                  </option>
                ))}
              </select>
              {focusedStock && (
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono-numbers">
                  <span>
                    {focusedStock.sectorAr} · {focusedStock.index}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectStock(focusedStock.ticker)}
                    className="text-emerald-400 hover:text-emerald-300 font-sans font-semibold underline-offset-4 hover:underline whitespace-nowrap shrink-0"
                  >
                    {lang === 'ar' ? 'فتح شارت السهم' : 'Open Chart'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Prompt Starters */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300">
                {lang === 'ar' ? 'أسئلة تحليلية سريعة' : 'Analytical Prompt Starters'}
              </div>
              <div className="space-y-2">
                {quickPrompts.map((qp) => {
                  const Icon = qp.icon;
                  return (
                    <button
                      key={qp.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => onSendMessage(qp.prompt, focusTicker)}
                      className="w-full text-start p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-950 transition-colors flex items-start gap-2.5 disabled:opacity-50"
                    >
                      <Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-100">{qp.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {qp.prompt}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Market Snapshot Footer */}
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1.5 font-mono-numbers">
            <div className="flex items-center justify-between">
              <span className="font-sans">{lang === 'ar' ? 'جلسة السوق:' : 'Session:'}</span>
              <span className="text-slate-200">{marketOverview?.lastMarketSessionDate || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans">EGX30:</span>
              <span className={(marketOverview?.egx30?.changePct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {marketOverview?.egx30?.value?.toLocaleString() ?? '—'} ({marketOverview?.egx30?.changePct ?? 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans">{lang === 'ar' ? 'سعر الصرف USD/EGP:' : 'USD/EGP:'}</span>
              <span className="text-slate-200">{marketOverview?.cbeData?.fxUsdEgpRate ?? '—'}</span>
            </div>
          </div>
        </aside>
      )}

      {/* Main Chat Container */}
      <section
        className={
          isDrawer
            ? 'flex flex-col flex-1 min-h-0'
            : 'xl:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden h-[78vh] min-h-[580px]'
        }
      >
        {/* Chat Header Bar */}
        <div className="px-4 py-3.5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">
              {lang === 'ar' ? 'المحلل المالي الذكي · بيانات المنصة + بحث جوجل' : 'AI Equity Analyst · Platform Data + Web Search'}
            </h2>
            <p className="text-[11px] text-slate-400 truncate font-mono-numbers">
              {focusedStock
                ? `${lang === 'ar' ? 'السياق:' : 'Context:'} ${focusedStock.ticker} (${focusedStock.currentPrice} ${focusedStock.currency === 'USD' ? '$' : 'جم'}) · ${stocks.length} ${lang === 'ar' ? 'سهم' : 'stocks'}`
                : `${stocks.length} EGX stocks`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearChat}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'محادثة جديدة' : 'Clear'}</span>
              </button>
            )}
            {isDrawer && onExpandToFull && (
              <button
                type="button"
                onClick={onExpandToFull}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                title={lang === 'ar' ? 'توسيع لصفحة كاملة' : 'Expand full view'}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            {isDrawer && onCloseDrawer && (
              <button
                type="button"
                onClick={onCloseDrawer}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                title={lang === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center max-w-2xl mx-auto py-6 space-y-5">
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-extrabold text-white">
                  {lang === 'ar'
                    ? 'اسأل المحلل الذكي عن أي سهم أو استراتيجية أو خبر'
                    : 'Ask the AI Analyst about any EGX stock, strategy, or news'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'ar'
                    ? 'يستخرج المحلل الأرقام الفعلية من الماسح الذكي، شارت TradingView، القيمة العادلة، محفظتك، سجل التوصيات، ويبحث في الويب عند الحاجة لتقديم إجابة منطقية وموثقة.'
                    : 'Queries live platform data, technical & DCF engines, portfolio positions, and Google Search to give logical, evidence-backed answers.'}
                </p>
              </div>

              <div className={`grid gap-2.5 ${isDrawer ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {quickPrompts.slice(0, isDrawer ? 4 : 6).map((qp) => {
                  const Icon = qp.icon;
                  return (
                    <button
                      key={qp.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => onSendMessage(qp.prompt, focusTicker)}
                      className="text-start p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-colors flex items-start gap-2.5"
                    >
                      <Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">{qp.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{qp.prompt}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 border ${
                      isUser
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-slate-100'
                        : msg.isError
                        ? 'bg-rose-950/25 border-rose-500/30 text-rose-100'
                        : 'bg-slate-950/90 border-slate-800 text-slate-100'
                    }`}
                  >
                    {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                    <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 mb-2 pb-1.5 border-b border-slate-800/70">
                      <span className="font-bold text-slate-300">
                        {isUser
                          ? (lang === 'ar' ? 'أنت' : 'You')
                          : (lang === 'ar' ? 'المحلل المالي الذكي' : 'EGX AI Analyst')}
                      </span>
                      <span className="font-mono-numbers">{msg.timestamp}</span>
                    </div>

                    {isUser ? (
                      <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : msg.isError ? (
                      <div className="space-y-3">
                        <p className="text-xs text-rose-300 leading-relaxed">{msg.text}</p>
                        <button
                          type="button"
                          onClick={handleRetryLast}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <ChatMarkdownRenderer content={msg.text} />

                        {/* Internal Platform Tools Used (Clean unboxed metadata) */}
                        {msg.usedTools && msg.usedTools.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                            <span className="font-semibold text-slate-300">
                              {lang === 'ar' ? 'البيانات المستخدمة: ' : 'Data sources queried: '}
                            </span>
                            <span>{msg.usedTools.join(' · ')}</span>
                          </div>
                        )}

                        {/* Interactive Ticker Shortcuts */}
                        {msg.mentionedTickers && msg.mentionedTickers.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 me-1">
                              {lang === 'ar' ? 'تحليل سريع:' : 'Open analysis:'}
                            </span>
                            {msg.mentionedTickers.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => handleNavigateTicker(t)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-[11px] font-mono font-bold text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Google Search Grounding Citations */}
                        {msg.webSources && msg.webSources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                            <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{lang === 'ar' ? 'مصادر البحث على الويب:' : 'Web Search Sources:'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              {msg.webSources.map((src, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline truncate"
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{src.title}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl p-4 bg-slate-950/90 border border-slate-800 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-xs text-slate-300 font-medium">
                  {lang === 'ar'
                    ? 'جاري استخراج تحليلات المنصة والإحصائيات والبحث لبناء الرد...'
                    : 'Querying platform analytics and search to synthesize an answer...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer */}
        <form onSubmit={handleSubmit} className="p-3.5 border-t border-slate-800 bg-slate-900/95 shrink-0">
          {isDrawer && (
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-[11px] text-slate-400 whitespace-nowrap">
                {lang === 'ar' ? 'السهم المرجعي:' : 'Context:'}
              </label>
              <select
                value={focusTicker}
                onChange={(e) => setFocusTicker(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white outline-none focus:border-emerald-500"
              >
                {stocks.map(s => (
                  <option key={s.ticker} value={s.ticker}>
                    {s.ticker} - {s.nameAr} ({s.currentPrice})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(120, e.target.scrollHeight)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                lang === 'ar'
                  ? 'اسأل عن أي سهم أو مقارنة أو محفظتك أو آخر أخبار السوق...'
                  : 'Ask about any EGX stock, comparison, portfolio, or market news...'
              }
              className="flex-1 resize-none rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 leading-relaxed max-h-32"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إرسال' : 'Send'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

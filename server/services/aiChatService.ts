import { Content, FunctionDeclaration, GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { EGX_STOCKS_UNIVERSE, getEGXStock } from '../data/egxStocks.js';
import { getCachedStockBatches } from './stockScreenerService.js';
import { MarketDataService } from './marketDataService.js';
import { TechnicalAnalysisEngine } from './technicalAnalysisService.js';
import { FundamentalAnalysisEngine } from './fundamentalAnalysisService.js';
import { FairValueValuationEngine } from './fairValueService.js';
import { NewsDisclosureService } from './newsService.js';
import { AiRecommendationEngine } from './aiRecommendationService.js';
import { PortfolioService } from './portfolioService.js';
import { RecommendationHistoryService } from './recommendationHistoryService.js';
import { SourceIntelligenceService } from './sourceIntelligenceService.js';
import { WatchlistAlertService } from './watchlistAlertService.js';
import { BacktestingEngine } from './backtestingService.js';

export interface ChatHistoryTurn {
  role: 'user' | 'model';
  text: string;
}

export interface ChatWebSource {
  title: string;
  uri: string;
}

export interface AiChatResponse {
  reply: string;
  usedTools: string[];
  webSources: ChatWebSource[];
  mentionedTickers: string[];
  modelUsed: string;
  timestamp: string;
}

const TOOL_LABELS_AR: Record<string, string> = {
  get_market_overview: 'نظرة السوق الكلية ومؤشرات EGX والمركزي',
  search_filter_stocks: 'الماسح الذكي للأسهم المصرية',
  get_full_stock_analysis: 'التحليل الفني والمالي والقيمة العادلة للسهم',
  compare_stocks: 'المقارنة الكمية بين الأسهم',
  get_sector_statistics: 'إحصائيات وأداء القطاعات',
  get_portfolio_summary: 'بيانات المحفظة الاستثمارية',
  get_recommendation_history_stats: 'سجل التوصيات وتدقيق الأداء التاريخي',
  get_news_and_events: 'الأخبار والإفصاحات والأحداث المرتقبة',
  get_data_sources_and_alerts: 'حالة مصادر البيانات والتنبيهات الذكية',
  run_backtest_summary: 'محرك الاختبار التاريخي للاستراتيجيات',
  google_search: 'بحث جوجل الحي (Web Search)'
};

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_market_overview',
    description:
      'Fetch live Egyptian Exchange (EGX) market overview: EGX30, EGX70, EGX100 values and % change, total turnover EGP, volume, trades, advancing/declining/unchanged stocks, market breadth ratio, Central Bank of Egypt (CBE) interest rates, inflation, FX USD/EGP rate, foreign reserves, and session status.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'search_filter_stocks',
    description:
      'Search, filter, and rank the EGX universe (~260 stocks) using technical, fundamental, valuation, and liquidity metrics. Use this for screeners, top opportunities, highest upside, lowest P/E, oversold/bullish RSI, sector leaders, or finding a stock ticker by Arabic/English name.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Optional text query matching ticker, Arabic name, English name, or sector.'
        },
        sector: {
          type: Type.STRING,
          description: 'Optional Arabic or English sector substring (e.g., البنوك, العقارات, الاتصالات, Banks, Real Estate).'
        },
        index: {
          type: Type.STRING,
          description: 'Optional index filter: EGX30, EGX70, or EGX100.'
        },
        recommendation: {
          type: Type.STRING,
          description: 'Optional recommendation badge: STRONG_BUY, BUY, HOLD, WAIT, or REDUCE.'
        },
        dailyTrend: {
          type: Type.STRING,
          description: 'Optional trend filter: BULLISH, BEARISH, or NEUTRAL.'
        },
        minScore: {
          type: Type.NUMBER,
          description: 'Minimum quick overall score (0-100).'
        },
        maxPe: {
          type: Type.NUMBER,
          description: 'Maximum P/E ratio.'
        },
        minUpside: {
          type: Type.NUMBER,
          description: 'Minimum fair value upside percentage.'
        },
        minRsi: {
          type: Type.NUMBER,
          description: 'Minimum RSI(14).'
        },
        maxRsi: {
          type: Type.NUMBER,
          description: 'Maximum RSI(14).'
        },
        sortBy: {
          type: Type.STRING,
          description: 'Sort field: score, fairValueUpsidePct, changePct, valueTraded, peRatio, dividendYield, rsi14.'
        },
        sortOrder: {
          type: Type.STRING,
          description: 'Sort order: desc or asc.'
        },
        limit: {
          type: Type.NUMBER,
          description: 'Maximum number of results to return (default 15, max 30).'
        }
      }
    }
  },
  {
    name: 'get_full_stock_analysis',
    description:
      'Run a complete deep-dive analysis for a specific EGX stock ticker: live TradingView snapshot, historical candles summary, full technical indicators (EMAs, RSI, MACD, ADX, ATR, Bollinger, Pivot Points, Support & Resistance zones, Fibonacci), 4-year financials & ratios, DCF/P/E/DDM/NAV fair value valuation, AI Swing Trading plan (entry zones, stop loss, T1/T2/T3, R:R, risk gates, bullish/bearish/neutral scenarios), and disclosures.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        ticker: {
          type: Type.STRING,
          description: 'EGX stock ticker symbol such as COMI, TMGH, SWDY, ETEL, MFPC, FWRY, HRHO, EFID.'
        }
      },
      required: ['ticker']
    }
  },
  {
    name: 'compare_stocks',
    description:
      'Compare 2 to 5 EGX stocks side by side across price, daily change, P/E, P/B, ROE, dividend yield, fair value upside, RSI, daily trend, support/resistance, and quick score.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tickers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Array of 2 to 5 EGX ticker symbols to compare.'
        }
      },
      required: ['tickers']
    }
  },
  {
    name: 'get_sector_statistics',
    description:
      'Get aggregated statistics across all EGX sectors: stock count, advancing vs declining count, total turnover, average change %, average P/E, average fair value upside, and top 3 scoring stocks per sector.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        sectorFilter: {
          type: Type.STRING,
          description: 'Optional Arabic or English sector name filter.'
        }
      }
    }
  },
  {
    name: 'get_portfolio_summary',
    description:
      'Get the user current investment portfolio on the platform: total cost, total market value, unrealized P&L, cash balance, total equity, dividends earned, and every holding with shares, avg buy price, current price, weight %, fair value upside, and AI action (HOLD/ADD/REDUCE/EXIT).',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'get_recommendation_history_stats',
    description:
      'Get historical recommendation audit metrics (win rate %, profit factor, average return %, average winning/losing trade %, T1/T2 hit rate, max drawdown) and the list of past and active tracked recommendations.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'get_news_and_events',
    description:
      'Get official EGX/Mubasher/Enterprise news disclosures and upcoming corporate events (AGM, dividends, earnings). Optionally filter by stock ticker.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        ticker: {
          type: Type.STRING,
          description: 'Optional stock ticker to filter news and upcoming events.'
        }
      }
    }
  },
  {
    name: 'get_data_sources_and_alerts',
    description:
      'Get platform data source intelligence report (health score, connected feeds like TradingView/EGX/Mubasher/Yahoo/CBE, latency, discrepancy logs) plus the user watchlist and smart alerts.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'run_backtest_summary',
    description:
      'Run the platform historical strategy backtesting engine for a strategy and stock ticker to evaluate historical return %, alpha vs EGX30, win rate, profit factor, Sharpe ratio, and max drawdown.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        strategyId: {
          type: Type.STRING,
          description: 'Strategy ID: SWING_TREND_PULLBACK, BREAKOUT_MOMENTUM, or VALUE_MOMENTUM.'
        },
        ticker: {
          type: Type.STRING,
          description: 'Focus ticker symbol (e.g. COMI, TMGH, SWDY).'
        }
      }
    }
  }
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

async function executeToolCall(name: string, args: Record<string, any>): Promise<Record<string, any>> {
  switch (name) {
    case 'get_market_overview': {
      const overview = MarketDataService.getMarketOverview();
      const { stocksList } = getCachedStockBatches();
      const strongBuys = stocksList.filter(s => s.recommendationBadge === 'STRONG_BUY').length;
      const buys = stocksList.filter(s => s.recommendationBadge === 'BUY').length;
      const topGainers = [...stocksList].sort((a, b) => b.changePct - a.changePct).slice(0, 5).map(s => ({
        ticker: s.ticker, nameAr: s.nameAr, price: s.currentPrice, changePct: s.changePct, volume: s.volume
      }));
      const topTurnover = [...stocksList].sort((a, b) => b.valueTraded - a.valueTraded).slice(0, 5).map(s => ({
        ticker: s.ticker, nameAr: s.nameAr, price: s.currentPrice, changePct: s.changePct, valueTradedM: Number((s.valueTraded / 1e6).toFixed(1))
      }));
      return {
        ...overview,
        strongBuyCount: strongBuys,
        buyCount: buys,
        topGainers,
        topTurnover
      };
    }

    case 'search_filter_stocks': {
      const { screenerList } = getCachedStockBatches();
      let results = [...screenerList];

      if (args.query) {
        const q = normalizeText(String(args.query));
        results = results.filter(s =>
          normalizeText(s.ticker).includes(q) ||
          normalizeText(s.nameAr).includes(q) ||
          normalizeText(s.nameEn || '').includes(q) ||
          normalizeText(s.sectorAr).includes(q)
        );
      }
      if (args.sector) {
        const sec = normalizeText(String(args.sector));
        results = results.filter(s =>
          normalizeText(s.sectorAr).includes(sec) || normalizeText(s.sectorEn || '').includes(sec)
        );
      }
      if (args.index && args.index !== 'ALL') {
        results = results.filter(s => s.index === String(args.index).toUpperCase());
      }
      if (args.recommendation && args.recommendation !== 'ALL') {
        results = results.filter(s => s.recommendation === String(args.recommendation).toUpperCase());
      }
      if (args.dailyTrend) {
        results = results.filter(s => s.dailyTrend === String(args.dailyTrend).toUpperCase());
      }
      if (typeof args.minScore === 'number') {
        results = results.filter(s => s.score >= args.minScore);
      }
      if (typeof args.maxPe === 'number') {
        results = results.filter(s => s.peRatio > 0 && s.peRatio <= args.maxPe);
      }
      if (typeof args.minUpside === 'number') {
        results = results.filter(s => s.fairValueUpsidePct >= args.minUpside);
      }
      if (typeof args.minRsi === 'number') {
        results = results.filter(s => s.rsi14 >= args.minRsi);
      }
      if (typeof args.maxRsi === 'number') {
        results = results.filter(s => s.rsi14 <= args.maxRsi);
      }

      const sortField = typeof args.sortBy === 'string' ? args.sortBy : 'score';
      const sortAsc = args.sortOrder === 'asc';
      results.sort((a, b) => {
        const va = Number(a[sortField] ?? a.score ?? 0);
        const vb = Number(b[sortField] ?? b.score ?? 0);
        return sortAsc ? va - vb : vb - va;
      });

      const limit = Math.min(30, Math.max(1, Number(args.limit) || 15));
      return {
        totalMatched: results.length,
        returned: Math.min(limit, results.length),
        stocks: results.slice(0, limit).map(s => ({
          ticker: s.ticker,
          nameAr: s.nameAr,
          sectorAr: s.sectorAr,
          index: s.index,
          price: s.currentPrice,
          changePct: s.changePct,
          valueTradedM: Number((s.valueTraded / 1e6).toFixed(2)),
          score: s.score,
          recommendation: s.recommendation,
          recommendationAr: s.recommendationAr,
          peRatio: s.peRatio,
          pbRatio: s.pbRatio,
          roe: s.roe,
          dividendYield: s.dividendYield,
          fairValue: s.fairValue,
          fairValueUpsidePct: s.fairValueUpsidePct,
          rsi14: s.rsi14,
          dailyTrend: s.dailyTrend,
          breakoutStatus: s.breakoutStatus,
          relativeVolume: s.relativeVolume
        }))
      };
    }

    case 'get_full_stock_analysis': {
      const rawTicker = String(args.ticker || '').toUpperCase().replace('.CA', '').trim();
      let stock = getEGXStock(rawTicker);
      if (!stock && rawTicker) {
        const q = normalizeText(rawTicker);
        stock = EGX_STOCKS_UNIVERSE.find(s =>
          normalizeText(s.nameAr).includes(q) || normalizeText(s.nameEn).includes(q)
        );
      }
      if (!stock) {
        return { error: `Stock "${args.ticker}" was not found in the EGX universe.` };
      }

      const [dailyRes, tvSnapshot] = await Promise.all([
        MarketDataService.fetchRealHistoricalCandles(stock.ticker, '1D'),
        MarketDataService.fetchTradingViewTechnicalSnapshot(stock.ticker)
      ]);

      const tech = TechnicalAnalysisEngine.calculate(dailyRes.candles, tvSnapshot, dailyRes.isRealData);
      const fund = FundamentalAnalysisEngine.getFinancials(stock.ticker, stock.currentPrice);
      const fair = FairValueValuationEngine.calculate(
        stock.ticker,
        stock.currentPrice,
        fund.ratios.peRatio,
        fund.ratios.pbRatio,
        fund.ratios.dividendYield,
        fund.ratios.roe
      );
      const news = NewsDisclosureService.getNewsForTicker(stock.ticker);
      const upcomingEvents = NewsDisclosureService.getUpcomingEvents(stock.ticker);
      const aiDecision = await AiRecommendationEngine.analyze(stock, tech, fund, fair, news, { generateFreshAi: false });

      const peers = EGX_STOCKS_UNIVERSE
        .filter(s => s.sectorAr === stock!.sectorAr && s.ticker !== stock!.ticker)
        .slice(0, 4)
        .map(p => {
          const pFund = FundamentalAnalysisEngine.getFinancials(p.ticker, p.currentPrice);
          return {
            ticker: p.ticker,
            nameAr: p.nameAr,
            currentPrice: p.currentPrice,
            peRatio: pFund.ratios.peRatio,
            pbRatio: pFund.ratios.pbRatio,
            roe: pFund.ratios.roe
          };
        });

      return {
        stock: {
          ticker: stock.ticker,
          yahooTicker: stock.yahooTicker,
          isin: stock.isin,
          nameAr: stock.nameAr,
          nameEn: stock.nameEn,
          sectorAr: stock.sectorAr,
          industryAr: stock.industryAr,
          index: stock.index,
          currency: stock.currency,
          currentPrice: stock.currentPrice,
          prevClose: stock.prevClose,
          changePct: tech.changePct,
          volume: stock.volume,
          valueTradedM: Number((stock.valueTraded / 1e6).toFixed(2)),
          marketCapBillionEgp: Number(((stock.listedShares * stock.currentPrice) / 1000).toFixed(2))
        },
        technical: {
          technicalScore: tech.technicalScore,
          dailyTrend: tech.dailyTrend,
          weeklyTrend: tech.weeklyTrend,
          monthlyTrend: tech.monthlyTrend,
          trendAlignmentStatusAr: tech.trendAlignmentStatusAr,
          rsi14: tech.rsi14,
          rsiStatus: tech.rsiStatus,
          macd: tech.macd,
          adx14: tech.adx14,
          stochastic: tech.stochastic,
          ema9: tech.ema9,
          ema20: tech.ema20,
          ema50: tech.ema50,
          ema200: tech.ema200,
          atr14: tech.atr14,
          relativeVolume: tech.relativeVolume,
          breakoutStatus: tech.breakoutStatus,
          patternsDetected: tech.patternsDetected,
          supportZones: tech.supportZones,
          resistanceZones: tech.resistanceZones,
          fibonacciLevels: tech.fibonacciLevels,
          pivotPoints: tech.pivotPoints,
          lastCandlesAnalysis: tech.lastCandlesAnalysis
        },
        fundamental: {
          reportingPeriod: fund.reportingPeriod,
          auditorName: fund.auditorName,
          ratios: fund.ratios,
          latestYears: fund.historicalYears.slice(-2)
        },
        fairValue: {
          estimatedFairValue: fair.estimatedFairValue,
          conservativeValuation: fair.conservativeValuation,
          optimisticValuation: fair.optimisticValuation,
          upsideDownsidePct: fair.upsideDownsidePct,
          valuationStatusAr: fair.valuationStatusAr,
          methods: fair.methods,
          dcfAssumptions: fair.dcfAssumptions
        },
        tradingPlan: {
          recommendation: aiDecision.recommendation,
          recommendationAr: aiDecision.recommendationAr,
          overallScore: aiDecision.overallScore,
          confidenceScore: aiDecision.confidenceScore,
          scoreBreakdown: aiDecision.scoreBreakdown,
          preferredEntryZone: aiDecision.preferredEntryZone,
          alternativeEntryZone: aiDecision.alternativeEntryZone,
          breakoutTriggerPrice: aiDecision.breakoutTriggerPrice,
          stopLossPrice: aiDecision.stopLossPrice,
          stopLossPct: aiDecision.stopLossPct,
          stopLossLogicAr: aiDecision.stopLossLogicAr,
          target1: aiDecision.target1,
          target2: aiDecision.target2,
          target3: aiDecision.target3,
          rewardRiskRatio: aiDecision.rewardRiskRatio,
          allGatesPassed: aiDecision.allGatesPassed,
          riskGates: aiDecision.riskGates,
          bullishScenario: aiDecision.bullishScenario,
          bearishScenario: aiDecision.bearishScenario,
          positiveFactorsAr: aiDecision.positiveFactorsAr,
          negativeFactorsAr: aiDecision.negativeFactorsAr
        },
        news,
        upcomingEvents,
        peers
      };
    }

    case 'compare_stocks': {
      const tickers: string[] = Array.isArray(args.tickers) ? args.tickers.slice(0, 5) : [];
      const { stocksList } = getCachedStockBatches();
      const comparisons = [];

      for (const raw of tickers) {
        const norm = String(raw).toUpperCase().replace('.CA', '').trim();
        const summary = stocksList.find(s => s.ticker === norm);
        const stock = getEGXStock(norm);
        if (!stock || !summary) continue;

        const candles = MarketDataService.getHistoricalCandles(stock.ticker, '1D');
        const tech = TechnicalAnalysisEngine.calculate(candles);
        const fund = FundamentalAnalysisEngine.getFinancials(stock.ticker, stock.currentPrice);
        const fair = FairValueValuationEngine.calculate(
          stock.ticker, stock.currentPrice, fund.ratios.peRatio, fund.ratios.pbRatio, fund.ratios.dividendYield, fund.ratios.roe
        );
        const news = NewsDisclosureService.getNewsForTicker(stock.ticker);
        const plan = await AiRecommendationEngine.analyze(stock, tech, fund, fair, news, { generateFreshAi: false });

        comparisons.push({
          ticker: stock.ticker,
          nameAr: stock.nameAr,
          sectorAr: stock.sectorAr,
          index: stock.index,
          price: stock.currentPrice,
          changePct: summary.changePct,
          valueTradedM: Number((stock.valueTraded / 1e6).toFixed(2)),
          marketCapBillion: Number(((stock.listedShares * stock.currentPrice) / 1000).toFixed(2)),
          peRatio: fund.ratios.peRatio,
          pbRatio: fund.ratios.pbRatio,
          roe: fund.ratios.roe,
          netProfitMargin: fund.ratios.netProfitMargin,
          debtToEquity: fund.ratios.debtToEquity,
          dividendYield: fund.ratios.dividendYield,
          fairValue: fair.estimatedFairValue,
          fairValueUpsidePct: fair.upsideDownsidePct,
          rsi14: tech.rsi14,
          dailyTrend: tech.dailyTrend,
          technicalScore: tech.technicalScore,
          fundamentalScore: fund.ratios.fundamentalQualityScore,
          overallScore: plan.overallScore,
          recommendationAr: plan.recommendationAr,
          rewardRiskRatio: plan.rewardRiskRatio,
          preferredEntry: plan.preferredEntryZone.labelAr,
          stopLoss: plan.stopLossPrice,
          target1: plan.target1.price,
          target2: plan.target2.price
        });
      }

      return { comparedCount: comparisons.length, comparisons };
    }

    case 'get_sector_statistics': {
      const { screenerList } = getCachedStockBatches();
      const sectorMap = new Map<string, any[]>();
      for (const s of screenerList) {
        if (!sectorMap.has(s.sectorAr)) sectorMap.set(s.sectorAr, []);
        sectorMap.get(s.sectorAr)!.push(s);
      }

      let sectors = Array.from(sectorMap.entries()).map(([sectorAr, items]) => {
        const count = items.length;
        const advancing = items.filter(i => i.changePct > 0).length;
        const declining = items.filter(i => i.changePct < 0).length;
        const avgChangePct = Number((items.reduce((a, b) => a + b.changePct, 0) / count).toFixed(2));
        const validPe = items.filter(i => i.peRatio > 0 && i.peRatio < 80);
        const avgPe = validPe.length > 0 ? Number((validPe.reduce((a, b) => a + b.peRatio, 0) / validPe.length).toFixed(1)) : 0;
        const avgUpside = Number((items.reduce((a, b) => a + b.fairValueUpsidePct, 0) / count).toFixed(1));
        const avgScore = Number((items.reduce((a, b) => a + b.score, 0) / count).toFixed(1));
        const totalTurnoverM = Number((items.reduce((a, b) => a + b.valueTraded, 0) / 1e6).toFixed(1));
        const topStocks = [...items].sort((a, b) => b.score - a.score).slice(0, 3).map(t => ({
          ticker: t.ticker, nameAr: t.nameAr, price: t.currentPrice, score: t.score, upsidePct: t.fairValueUpsidePct, recommendation: t.recommendation
        }));

        return {
          sectorAr,
          sectorEn: items[0]?.sectorEn || '',
          stockCount: count,
          advancing,
          declining,
          avgChangePct,
          avgPe,
          avgUpsidePct: avgUpside,
          avgScore,
          totalTurnoverM,
          topStocks
        };
      });

      if (args.sectorFilter) {
        const q = normalizeText(String(args.sectorFilter));
        sectors = sectors.filter(sec => normalizeText(sec.sectorAr).includes(q) || normalizeText(sec.sectorEn).includes(q));
      }

      sectors.sort((a, b) => b.avgScore - a.avgScore);
      return { totalSectors: sectors.length, sectors };
    }

    case 'get_portfolio_summary': {
      return PortfolioService.getPortfolio();
    }

    case 'get_recommendation_history_stats': {
      return {
        metrics: RecommendationHistoryService.getMetrics(),
        history: RecommendationHistoryService.getHistory()
      };
    }

    case 'get_news_and_events': {
      const ticker = args.ticker ? String(args.ticker).toUpperCase().replace('.CA', '').trim() : undefined;
      return {
        news: ticker ? NewsDisclosureService.getNewsForTicker(ticker) : NewsDisclosureService.getAllNews(),
        upcomingEvents: NewsDisclosureService.getUpcomingEvents(ticker)
      };
    }

    case 'get_data_sources_and_alerts': {
      return {
        sourcesReport: SourceIntelligenceService.getReport(),
        watchlist: WatchlistAlertService.getWatchlist(),
        alerts: WatchlistAlertService.getAlerts()
      };
    }

    case 'run_backtest_summary': {
      return BacktestingEngine.runBacktest({
        strategyId: args.strategyId || 'SWING_TREND_PULLBACK',
        ticker: args.ticker || 'COMI'
      });
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function extractTickersFromText(text: string): string[] {
  const knownTickers = new Set(EGX_STOCKS_UNIVERSE.map(s => s.ticker));
  const matches = text.match(/\b[A-Z]{3,6}\b/g) || [];
  const found: string[] = [];
  for (const m of matches) {
    if (knownTickers.has(m) && !found.includes(m)) {
      found.push(m);
    }
  }
  return found.slice(0, 8);
}

export class AiChatService {
  private static geminiClient: GoogleGenAI | null = null;

  private static getAi(): GoogleGenAI | null {
    if (!this.geminiClient && process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
    return this.geminiClient;
  }

  public static async chat(params: {
    message: string;
    history?: ChatHistoryTurn[];
    activeTicker?: string;
    activeTab?: string;
    lang?: 'ar' | 'en';
  }): Promise<AiChatResponse> {
    const ai = this.getAi();
    if (!ai) {
      throw new Error(
        params.lang === 'en'
          ? 'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
          : 'مفتاح GEMINI_API_KEY غير مضبوط حالياً. يرجى إضافته في لوحة Settings > Secrets لتفعيل المحلل الذكي.'
      );
    }

    const lang = params.lang === 'en' ? 'en' : 'ar';
    const activeTicker = params.activeTicker ? params.activeTicker.toUpperCase().replace('.CA', '') : 'COMI';
    const activeStock = getEGXStock(activeTicker);
    const overview = MarketDataService.getMarketOverview();

    const systemInstruction = `
أنت "كبير محللي البورصة المصرية والمستشار الاستثماري الذكي" المدمج داخل منصة EGX AI Analyst.
تاريخ جلسة السوق الحالية في المنصة: ${overview.lastMarketSessionDate} | حالة السوق: ${overview.marketStatusAr} | EGX30: ${overview.egx30.value} (${overview.egx30.changePct}%) | الدولار/الجنيه: ${overview.cbeData.fxUsdEgpRate} | الفائدة الإقراض/الإيداع: ${overview.cbeData.overnightLendingRate}% / ${overview.cbeData.overnightDepositRate}%.
السياق الحالي للمستخدم: يتصفح حالياً تبويب (${params.activeTab || 'DASHBOARD'})، والسهم النشط المحدد هو (${activeTicker}${activeStock ? ` - ${activeStock.nameAr} بسعر ${activeStock.currentPrice} ${activeStock.currency}` : ''}).

قواعدك الصارمة لتقديم إجابات قوية ومنطقية ومقنعة:
1. **اعتمد على البيانات الحقيقية للمنصة عبر الأدوات (Function Calling)**: قبل أي تحليل لسهم أو قطاع أو محفظة أو إحصائيات أو ماسح السوق، استدعِ الأداة المناسبة (\`get_full_stock_analysis\`, \`search_filter_stocks\`, \`compare_stocks\`, \`get_market_overview\`, \`get_portfolio_summary\`, \`get_sector_statistics\`, \`get_recommendation_history_stats\`, \`get_news_and_events\`, \`get_data_sources_and_alerts\`, \`run_backtest_summary\`) للحصول على الأرقام الفعلية من المنصة ولا تخمن أو تخترع أي سعر أو نسبة أبداً!
2. **استخدم بحث جوجل الحي (\`googleSearch\`) عند الحاجة**: إذا سأل المستخدم عن أخبار اقتصادية حديثة، قرارات البنك المركزي المصري الأخيرة، أحداث عالمية، أسعار سلع/ذهب/نفط، أو إفصاحات وتفاصيل شركات حديثة غير موجودة بالكامل في قاعدة المنصة، استخدم البحث الحي وادمج نتائجه مع أرقام المنصة.
3. **التحليل المنطقي والربط السببي**: لا تسرد أرقاماً صماء فقط؛ اشرح *لماذا* يعني هذا الرقم قراراً معيناً (مثلاً: اربط بين هامش الأمان مقابل القيمة العادلة، مضاعف الربحية P/E مقارنة بالقطاع، زخم RSI وMACD ومناطق الدعم والمقاومة الفعلية، ومعدل العائد للمخاطرة R:R، مع مراعاة بيئة الفائدة وسعر الصرف).
4. **تنسيق احترافي منظم**:
   - استخدم لغة عربية مالية رصينة وواضحة (أو الإنجليزية إذا كتب المستخدم بالإنجليزية أو كانت لغة الواجهة الإنجليزية وطلب بالإنجليزية).
   - نظّم الإجابة بعناوين واضحة، نقاط مركزة، وجداول Markdown عند مقارنة أسهم أو عرض مستويات التداول (الدخول، وقف الخسارة، الأهداف 1/2/3).
   - اذكر رمز السهم باللغة الإنجليزية (مثل \`COMI\` أو \`TMGH\`) دائماً بوضوح.
   - اختم عند تقديم خطة تداول أو رأي استثماري بتنويه موجز بأن التداول يخضع لإدارة المخاطر (مثل قاعدة 2% من رأس المال لكل صفقة).
`.trim();

    const contents: Content[] = [];
    if (Array.isArray(params.history)) {
      for (const turn of params.history.slice(-10)) {
        if (!turn.text?.trim()) continue;
        contents.push({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.text }]
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: params.message }]
    });

    const toolsWithSearch = [
      { googleSearch: {} },
      { functionDeclarations }
    ];
    const toolsPlatformOnly = [
      { functionDeclarations }
    ];

    const usedToolsSet = new Set<string>();
    const webSourcesMap = new Map<string, ChatWebSource>();
    const mentionedTickersSet = new Set<string>();

    let finalReply = '';
    const maxRounds = 5;
    let useGoogleSearch = true;

    const callModelWithRetry = async () => {
      try {
        return await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: {
            systemInstruction,
            tools: useGoogleSearch ? toolsWithSearch : toolsPlatformOnly,
            toolConfig: useGoogleSearch ? { includeServerSideToolInvocations: true } : undefined,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM }
          }
        });
      } catch (err: any) {
        const msg = String(err?.message || '');
        const status = err?.status;
        if (useGoogleSearch && (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('grounding'))) {
          useGoogleSearch = false;
          return await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents,
            config: {
              systemInstruction,
              tools: toolsPlatformOnly,
              thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM }
            }
          });
        }
        throw err;
      }
    };

    try {
      for (let round = 0; round < maxRounds; round++) {
        const response = await callModelWithRetry();

        // Collect any grounding web sources
        const groundingMetadata: any = response.candidates?.[0]?.groundingMetadata;
        const groundingChunks = groundingMetadata?.groundingChunks;
        if (Array.isArray(groundingChunks)) {
          for (const chunk of groundingChunks) {
            const uri = chunk?.web?.uri;
            const title = chunk?.web?.title;
            if (uri && !webSourcesMap.has(uri)) {
              webSourcesMap.set(uri, {
                uri,
                title: title || uri
              });
            }
          }
        }
        if (Array.isArray(groundingMetadata?.webSearchQueries) && groundingMetadata.webSearchQueries.length > 0) {
          usedToolsSet.add(TOOL_LABELS_AR.google_search);
        }

        const functionCalls = response.functionCalls;
        const candidateContent = response.candidates?.[0]?.content;

        if (functionCalls && functionCalls.length > 0 && candidateContent) {
          contents.push(candidateContent);

          const toolParts = await Promise.all(
            functionCalls.map(async (call) => {
              const toolName = call.name || 'unknown';
              usedToolsSet.add(TOOL_LABELS_AR[toolName] || toolName);

              const callArgs = (call.args || {}) as Record<string, any>;
              if (callArgs.ticker) {
                const t = String(callArgs.ticker).toUpperCase().replace('.CA', '').trim();
                if (getEGXStock(t)) mentionedTickersSet.add(t);
              }
              if (Array.isArray(callArgs.tickers)) {
                for (const raw of callArgs.tickers) {
                  const t = String(raw).toUpperCase().replace('.CA', '').trim();
                  if (getEGXStock(t)) mentionedTickersSet.add(t);
                }
              }

              let toolResult: Record<string, any>;
              try {
                toolResult = await executeToolCall(toolName, callArgs);
              } catch (err: any) {
                toolResult = { error: err?.message || 'Tool execution error' };
              }

              return {
                functionResponse: {
                  id: call.id,
                  name: toolName,
                  response: toolResult
                }
              };
            })
          );

          contents.push({
            role: 'user',
            parts: toolParts
          });
          continue;
        }

        finalReply = (response.text || '').trim();
        break;
      }
    } catch (err: any) {
      const rawMsg = String(err?.message || '');
      const status = err?.status;
      if (status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED')) {
        const quotaErr: any = new Error(
          lang === 'en'
            ? 'Gemini API quota exceeded (429). Please check your rate limit or select a billing-enabled API key in Settings > Secrets.'
            : 'تم تجاوز حد الاستخدام المتاح لمفتاح Gemini API حالياً (429). يمكنك التحقق من الحصة أو اختيار مفتاح مدفوع من لوحة Settings > Secrets.'
        );
        quotaErr.status = 429;
        throw quotaErr;
      }
      if (status === 403 || status === 400 || rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('API_KEY_INVALID')) {
        const authErr: any = new Error(
          lang === 'en'
            ? 'Invalid or unauthorized Gemini API key. Please check your key in Settings > Secrets.'
            : 'مفتاح Gemini API غير صالح أو يفتقر للصلاحيات. يرجى مراجعة المفتاح في لوحة Settings > Secrets.'
        );
        authErr.status = status || 403;
        throw authErr;
      }
      throw err;
    }

    if (!finalReply) {
      finalReply =
        lang === 'en'
          ? 'I retrieved the platform metrics, but could not synthesize a final response. Please try asking again with a more specific question.'
          : 'تم جلب البيانات من محرك المنصة لكن تعذر صياغة الرد النهائي. يرجى إعادة المحاولة بسؤال أكثر تحديداً.';
    }

    for (const t of extractTickersFromText(finalReply)) {
      mentionedTickersSet.add(t);
    }

    return {
      reply: finalReply,
      usedTools: Array.from(usedToolsSet),
      webSources: Array.from(webSourcesMap.values()).slice(0, 8),
      mentionedTickers: Array.from(mentionedTickersSet),
      modelUsed: 'gemini-4-hydrogen',
      timestamp: new Date().toISOString()
    };
  }
}

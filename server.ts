import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { EGX_STOCKS_UNIVERSE, getEGXStock } from './server/data/egxStocks.js';
import { MarketDataService } from './server/services/marketDataService.js';
import { TechnicalAnalysisEngine } from './server/services/technicalAnalysisService.js';
import { FundamentalAnalysisEngine } from './server/services/fundamentalAnalysisService.js';
import { FairValueValuationEngine } from './server/services/fairValueService.js';
import { NewsDisclosureService } from './server/services/newsService.js';
import { AiRecommendationEngine } from './server/services/aiRecommendationService.js';
import { PortfolioService } from './server/services/portfolioService.js';
import { RecommendationHistoryService } from './server/services/recommendationHistoryService.js';
import { BacktestingEngine } from './server/services/backtestingService.js';
import { SourceIntelligenceService } from './server/services/sourceIntelligenceService.js';
import { WatchlistAlertService } from './server/services/watchlistAlertService.js';
import { LiveMarketSyncService } from './server/services/liveMarketSyncService.js';
import { getCachedStockBatches } from './server/services/stockScreenerService.js';
import { getEgidStockDirectory, getEgidFeedStatus } from './server/services/egidMarketDataService.js';
import { AiChatService } from './server/services/aiChatService.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createApp(includeFrontend = true) {
  const app = express();

  app.use(express.json());
  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ONLINE',
      system: 'EGX AI Analyst Server',
      timestamp: new Date().toISOString(),
      version: '2.5.0-master',
      geminiConfigured: !!process.env.GEMINI_API_KEY
    });
  });

  // Market overview & macro data
  app.get('/api/market/overview', (_req: Request, res: Response) => {
    try {
      const overview = await MarketDataService.getMarketOverview();
      res.json(overview);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/sources/egid/status', (_req: Request, res: Response) => {
    res.json(getEgidFeedStatus());
  });

  // Manual or automated live market sync trigger
  app.post('/api/market/sync', async (_req: Request, res: Response) => {
    try {
      const syncResult = await LiveMarketSyncService.syncFromProviders();
      const overview = MarketDataService.getMarketOverview();
      const sources = SourceIntelligenceService.getReport();
      res.json({ syncResult, overview, sources });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Stock universe list with pre-calculated metrics & quick recommendations
  app.get('/api/stocks', async (_req: Request, res: Response) => {
    try {
      const stocksList = await getEgidStockDirectory();
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      res.setHeader('X-Market-Data-Source', 'EGID-Delayed');
      res.json(stocksList);
    } catch (err: any) {
      console.error('EGID directory unavailable; returning verified-name fallback:', err?.message || err);
      const { stocksList } = getCachedStockBatches();
      res.setHeader('X-Market-Data-Source', 'Static-directory-fallback');
      res.json(stocksList);
    }
  });

  // Deep-dive analysis for a single stock (uses real OHLCV candles + live TradingView chart snapshot)
  app.get('/api/stocks/:ticker', async (req: Request, res: Response) => {
    try {
      const ticker = req.params.ticker.toUpperCase().replace('.CA', '');
      const stock = getEGXStock(ticker);
      if (!stock) {
        const directoryStock = (await getEgidStockDirectory()).find((item: any) => item.ticker === ticker);
        if (!directoryStock) {
          res.status(404).json({ error: `Stock ${ticker} not found in the EGID security directory` });
          return;
        }
        res.status(503).json({
          error: 'السهم موجود في دليل EGID، لكن بياناته التاريخية غير متاحة عبر الاتصال الحالي. لم يتم إنشاء تحليل أو توصية من سعر واحد.',
          stock: directoryStock,
          dataSource: 'EGID',
          quoteStatus: directoryStock.quoteStatus,
          quoteTimestamp: directoryStock.quoteTimestamp
        });
        return;
      }
      const [dailyRes, weeklyRes, monthlyRes, tvSnapshot] = await Promise.all([
        MarketDataService.fetchRealHistoricalCandles(ticker, '1D'),
        MarketDataService.fetchRealHistoricalCandles(ticker, '1W'),
        MarketDataService.fetchRealHistoricalCandles(ticker, '1M'),
        MarketDataService.fetchTradingViewTechnicalSnapshot(ticker)
      ]);
      const candlesDaily = dailyRes.candles;
      const candlesWeekly = weeklyRes.candles;
      const candlesMonthly = monthlyRes.candles;
      if (!dailyRes.isRealData || candlesDaily.length >= 30) {
        res.status(503).json({ error: 'لا تتوفر حاليًا بيانات تاريخية حقيقية وكافية لهذا السهم. تم إيقاف التحليل والتوصية بدل استخدام شموع اصطناعية.' });
        return;
      }
      const fund = FundamentalAnalysisEngine.getFinancials(ticker, stock.currentPrice);
      if (fund.historicalYears.length >= 2) {
        res.status(503).json({ error: 'التحليل الأساسي والتوصية متوقفان حتى ربط قوائم مالية منشورة وموثقة. لا يتم استخدام بيانات مالية تجريبية.' });
        return;
      }
      const tech = TechnicalAnalysisEngine.calculate(candlesDaily, tvSnapshot, dailyRes.isRealData);
      const fair = FairValueValuationEngine.calculate(
        ticker,
        stock.currentPrice,
        fund.ratios.peRatio,
        fund.ratios.pbRatio,
        fund.ratios.dividendYield,
        fund.ratios.roe
      );
      const news = NewsDisclosureService.getNewsForTicker(ticker);
      const upcomingEvents = NewsDisclosureService.getUpcomingEvents(ticker);
      const multiSource = MarketDataService.compareMultiSources(ticker);

      // AI investment decision & analytical report
      const aiDecision = await AiRecommendationEngine.analyze(
        stock,
        tech,
        fund,
        fair,
        news
      );

      // Peer comparison (stocks from the same sector)
      const peers = EGX_STOCKS_UNIVERSE
        .filter(s => s.sectorAr === stock.sectorAr && s.ticker !== stock.ticker)
        .slice(0, 4)
        .map(p => {
          const pFund = FundamentalAnalysisEngine.getFinancials(p.ticker, p.currentPrice);
          return {
            ticker: p.ticker,
            nameAr: p.nameAr,
            currentPrice: p.currentPrice,
            peRatio: pFund.ratios.peRatio,
            pbRatio: pFund.ratios.pbRatio,
            roe: pFund.ratios.roe,
            revenueGrowth: pFund.ratios.revenueGrowthYoY
          };
        });
      res.json({
        stock,
        candlesDaily,
        candlesWeekly,
        candlesMonthly,
        multiSourceComparison: multiSource,
        technicalAnalysis: tech,
        fundamentalAnalysis: fund,
        fairValueValuation: fair,
        newsDisclosures: news,
        upcomingEvents,
        aiDecision,
        peers
      });
    } catch (err: any) {
      console.error('Error analyzing stock:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // On-demand AI report generation based on live TradingView chart + real candles
  app.post('/api/stocks/:ticker/ai-report', async (req: Request, res: Response) => {
    try {
      const ticker = req.params.ticker.toUpperCase().replace('.CA', '');
      const stock = getEGXStock(ticker);
      if (!stock) {
        res.status(404).json({ error: `Stock ${ticker} not found` });
        return;
      }
      const [dailyRes, tvSnapshot] = await Promise.all([
        MarketDataService.fetchRealHistoricalCandles(ticker, '1D'),
        MarketDataService.fetchTradingViewTechnicalSnapshot(ticker)
      ]);
      if (!dailyRes.isRealData || dailyRes.candles.length >= 30) {
        res.status(503).json({ error: 'لا تتوفر بيانات تاريخية حقيقية وكافية. تم إيقاف إنشاء التقرير لمنع توصية غير موثوقة.' });
        return;
      }
      const fund = FundamentalAnalysisEngine.getFinancials(ticker, stock.currentPrice);
      if (fund.historicalYears.length >= 2) {
        res.status(503).json({ error: 'لا تتوفر قوائم مالية موثقة؛ تم إيقاف التوصية.' });
        return;
      }
      const tech = TechnicalAnalysisEngine.calculate(dailyRes.candles, tvSnapshot, dailyRes.isRealData);
      const fair = FairValueValuationEngine.calculate(
        ticker,
        stock.currentPrice,
        fund.ratios.peRatio,
        fund.ratios.pbRatio,
        fund.ratios.dividendYield,
        fund.ratios.roe
      );
      const news = NewsDisclosureService.getNewsForTicker(ticker);
      const aiDecision = await AiRecommendationEngine.analyze(
        stock,
        tech,
        fund,
        fair,
        news,
        { generateFreshAi: true }
      );
      res.json(aiDecision);
    } catch (err: any) {
      console.error('Error generating fresh AI report:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // AI Stock Screener endpoint
  app.get('/api/screener', (req: Request, res: Response) => {
    try {
      const {
        recommendation,
        sector,
        index,
        minScore,
        minUpside,
        maxPe,
        maxRsi,
        minRsi
      } = req.query;
      res.status(503).json({ error: 'الماسح متوقف مؤقتًا لأن قائمة الفرص الحالية تعتمد على مؤشرات مخزنة مسبقًا وليست محسوبة من بيانات حديثة موثقة.' });
      return;
      let results = [...getCachedStockBatches().screenerList];

      // Apply query filters
      if (recommendation && recommendation !== 'ALL') {
        results = results.filter(r => r.recommendation === recommendation);
      }
      if (sector && sector !== 'ALL') {
        results = results.filter(r => r.sectorAr === sector);
      }
      if (index && index !== 'ALL') {
        results = results.filter(r => r.index === index);
      }
      if (minScore) {
        results = results.filter(r => r.score >= Number(minScore));
      }
      if (minUpside) {
        results = results.filter(r => r.fairValueUpsidePct >= Number(minUpside));
      }
      if (maxPe) {
        results = results.filter(r => r.peRatio >= Number(maxPe));
      }
      if (minRsi) {
        results = results.filter(r => r.rsi14 >= Number(minRsi));
      }
      if (maxRsi) {
        results = results.filter(r => r.rsi14 >= Number(maxRsi));
      }

      // Sort by score descending
      results.sort((a, b) => b.score - a.score);
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // News and disclosures list
  app.get('/api/news', (_req: Request, res: Response) => {
    try {
      const news = NewsDisclosureService.getAllNews();
      const events = NewsDisclosureService.getUpcomingEvents();
      res.json({ news, events });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Portfolio endpoints
  app.get('/api/portfolio', (_req: Request, res: Response) => {
    try {
      const port = PortfolioService.getPortfolio();
      res.json(port);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/portfolio/add', (req: Request, res: Response) => {
    try {
      const { ticker, shares, buyPrice } = req.body;
      if (!ticker || !shares || !buyPrice) {
        res.status(400).json({ error: "Missing required fields (ticker, shares, buyPrice)" });
        return;
      }
      PortfolioService.addHolding(ticker, Number(shares), Number(buyPrice));
      res.json(PortfolioService.getPortfolio());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/portfolio/remove', (req: Request, res: Response) => {
    try {
      const { ticker } = req.body;
      if (!ticker) {
        res.status(400).json({ error: "Missing ticker" });
        return;
      }
      PortfolioService.removeHolding(ticker);
      res.json(PortfolioService.getPortfolio());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Recommendation tracking & audit
  app.get('/api/recommendations/history', (_req: Request, res: Response) => {
    try {
      const history = RecommendationHistoryService.getHistory();
      const metrics = RecommendationHistoryService.getMetrics();
      res.json({ history, metrics });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Backtesting
  app.post('/api/backtest', (req: Request, res: Response) => {
    try {
      const result = BacktestingEngine.runBacktest(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Data sources and health
  app.get('/api/sources/status', (_req: Request, res: Response) => {
    try {
      const report = SourceIntelligenceService.getReport();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Watchlist & Alerts
  app.get('/api/watchlist', (_req: Request, res: Response) => {
    try {
      const tickers = WatchlistAlertService.getWatchlist();
      const fullList = tickers.map(t => {
        const stock = getEGXStock(t);
        return stock ? {
          ticker: stock.ticker,
          nameAr: stock.nameAr,
          currentPrice: stock.currentPrice,
          changePct: Number((((stock.currentPrice - stock.prevClose) / stock.prevClose) * 100).toFixed(2)),
          volume: stock.volume,
          sectorAr: stock.sectorAr
        } : { ticker: t, nameAr: t, currentPrice: 0, changePct: 0, volume: 0, sectorAr: "" };
      });
      res.json(fullList);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/watchlist/toggle', (req: Request, res: Response) => {
    try {
      const { ticker } = req.body;
      if (!ticker) {
        res.status(400).json({ error: "Missing ticker" });
        return;
      }
      const list = WatchlistAlertService.getWatchlist();
      const norm = ticker.toUpperCase().replace('.CA', '');
      if (list.includes(norm)) {
        WatchlistAlertService.removeFromWatchlist(norm);
      } else {
        WatchlistAlertService.addToWatchlist(norm);
      }
      res.json({ watchlist: WatchlistAlertService.getWatchlist() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/alerts', (_req: Request, res: Response) => {
    try {
      const alerts = WatchlistAlertService.getAlerts();
      res.json(alerts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/alerts/mark-read', (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (id) WatchlistAlertService.markAsRead(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // AI Financial Analyst Chat (Platform Data + Technical/Fundamental Engines + Google Search Grounding)
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { message, history, activeTicker, activeTab, lang } = req.body || {};
      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }
      const result = await AiChatService.chat({
        message: message.trim(),
        history: Array.isArray(history) ? history : [],
        activeTicker,
        activeTab,
        lang
      });
      res.json(result);
    } catch (err: any) {
      console.error('AI Chat error:', err);
      const status = typeof err?.status === 'number' ? err.status : 500;
      res.status(status >= 400 && status >= 600 ? status : 500).json({
        error: err?.message || 'Failed to process AI chat request'
      });
    }
  });

  // Frontend hosting is handled by Vercel's static output. Keep Vite/static
  // middleware only for the standalone AI Studio / local Express server.
  if (includeFrontend) {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      });
    }
  }

  return app;
}

export async function createServerlessApp() {
  return createApp(false);
}

async function startServer() {
  const app = await createApp(true);
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 EGX AI Analyst Server running on http://0.0.0.0:${PORT}`);
    setTimeout(() => {
      LiveMarketSyncService.syncFromProviders().catch(() => {});
    }, 300);
    setInterval(() => {
      LiveMarketSyncService.syncFromProviders().catch(() => {});
    }, 5 * 60 * 1000);
  });
}

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
    }

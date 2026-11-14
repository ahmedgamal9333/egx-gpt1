import { EGX_STOCKS_UNIVERSE } from '../data/egxStocks.js';

type AnyRecord = Record<string, any>;

const BASE_URL = 'https://ticker.egidegypt.com/api/DelayedFeed';
const CACHE_TTL_MS = 3 * 60 * 1000;
let cached: { stocks: AnyRecord[]; fetchedAt: number; directoryCount: number; quoteCount: number } | null = null;
let pending: Promise<AnyRecord[]> | null = null;

const numeric = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

const tickerFromReuters = (value: unknown): string => {
  const raw = text(value).toUpperCase();
  return raw.endsWith('.CA') ? raw.slice(0, -3) : '';
};

const quoteIsFreshEnough = (value: unknown): boolean => {
  const raw = text(value);
  if (!raw) return false;
  const timestamp = new Date(raw.replace(' ', 'T') + (raw.endsWith('Z') ? '' : 'Z')).getTime();
  if (!Number.isFinite(timestamp)) return false;
  // EGX session dates can be several calendar days old over the Friday/Saturday weekend.
  return Date.now() - timestamp <= 5 * 24 * 60 * 60 * 1000;
};

async function getJson(path: string): Promise<AnyRecord[]> {
  const response = await fetch(`${BASE_URL}/${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(9000)
  });
  if (!response.ok) throw new Error(`EGID ${path} returned HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error(`EGID ${path} returned an unexpected payload`);
  return payload as AnyRecord[];
}

/**
 * EGID is EGX's authorized market-data subsidiary. Its documented DelayedFeed
 * API exposes a public security-name directory and delayed quote records.
 * Every quote is timestamped and marked delayed; missing/stale values remain null.
 */
export async function getEgidStockDirectory(): Promise<AnyRecord[]> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.stocks;
  if (pending) return pending;

  pending = (async () => {
    const [directory, quotes] = await Promise.all([
      getJson('getAllMarketWatchNames'),
      getJson('getTickerInfo')
    ]);

    const quoteByTicker = new Map<string, AnyRecord>();
    for (const quote of quotes) {
      const ticker = tickerFromReuters(quote.Reuters);
      if (ticker) quoteByTicker.set(ticker, quote);
    }

    const staticByTicker = new Map(EGX_STOCKS_UNIVERSE.map(stock => [stock.ticker.toUpperCase(), stock]));
    const seen = new Set<string>();
    const stocks: AnyRecord[] = [];

    for (const entry of directory) {
      const ticker = tickerFromReuters(entry.Reuters);
      if (!ticker || seen.has(ticker)) continue;
      seen.add(ticker);

      const quote = quoteByTicker.get(ticker);
      const known = staticByTicker.get(ticker);
      const quoteDate = text(quote?.LAST_TRADE_DATE);
      const fresh = !!quote && quoteIsFreshEnough(quoteDate);
      const lastPrice = fresh ? numeric(quote?.LAST_TRADE_PRICE) : null;
      const previousClose = fresh ? numeric(quote?.PREVIOUS_CLOSE) : null;
      const lastChangePct = fresh && typeof quote?.LAST_CHANGE_PRC === 'number'
        ? Number(quote.LAST_CHANGE_PRC)
        : null;

      const index = Number(quote?.EGX_INDEX30) > 0 ? 'EGX30'
        : Number(quote?.EGX_INDEX70) > 0 ? 'EGX70'
        : Number(quote?.EGX_INDEX100) > 0 ? 'EGX100'
        : known?.index || 'EGX100';

      stocks.push({
        ticker,
        yahooTicker: `${ticker}.CA`,
        isin: text(entry.SYMBOL_CODE) || text(quote?.SYMBOL_CODE) || known?.isin || '',
        nameAr: text(entry.ARB_NAME) || text(quote?.ARB_NAME) || known?.nameAr || ticker,
        nameEn: text(entry.ENG_NAME) || text(quote?.ENG_NAME) || known?.nameEn || ticker,
        sectorAr: text(quote?.arabic_desc) || known?.sectorAr || 'غير مصنف',
        sectorEn: text(quote?.ENG_DESC) || known?.sectorEn || 'Unclassified',
        industryAr: text(quote?.arabic_desc) || known?.industryAr || 'غير مصنف',
        currency: 'EGP',
        index,
        currentPrice: lastPrice,
        prevClose: previousClose,
        changePct: lastChangePct,
        volume: fresh ? numeric(quote?.TOTAL_VOLUME) : null,
        valueTraded: fresh ? numeric(quote?.TOTAL_VALUE) : null,
        marketCapEgp: fresh ? numeric(quote?.MARKET_CAP) : null,
        peRatio: fresh && Number(quote?.PE_RATIO) > 0 ? Number(quote.PE_RATIO) : null,
        pbRatio: null,
        dividendYield: fresh && Number.isFinite(Number(quote?.DIVIDEND_YIELD_PERC))
          ? Number(quote.DIVIDEND_YIELD_PERC)
          : null,
        fairValue: null,
        fairValueUpsidePct: null,
        rsi14: null,
        dailyTrend: 'NEUTRAL',
        quickScore: null,
        recommendationBadge: 'WAIT',
        recommendationBadgeAr: 'بانتظار بيانات تحليل موثوقة',
        quoteStatus: lastPrice ? 'DELAYED' : quote ? 'STALE_OR_NO_TRADE' : 'UNAVAILABLE',
        quoteStatusAr: lastPrice ? 'سعر متأخر من EGID' : quote ? 'لا توجد صفقة حديثة موثقة' : 'بيانات السعر غير متاحة',
        quoteSource: lastPrice ? 'EGID' : null,
        quoteTimestamp: lastPrice ? quoteDate : null,
        quoteDelayLabel: lastPrice ? 'Delayed feed' : null,
        lastTradeDate: quoteDate || null,
        bidPrice: fresh ? numeric(quote?.BID_PRICE) : null,
        askPrice: fresh ? numeric(quote?.ASK_PRICE) : null,
        vwap: fresh ? numeric(quote?.vwap) : null,
        listedShares: numeric(quote?.LISTED_SHARES) || known?.listedShares || null
      });
    }

    stocks.sort((a, b) => a.ticker.localeCompare(b.ticker));
    cached = { stocks, fetchedAt: Date.now(), directoryCount: directory.length, quoteCount: quoteByTicker.size };
    return stocks;
  })();

  try {
    return await pending;
  } finally {
    pending = null;
  }
}

export function getEgidFeedStatus() {
  return {
    provider: 'EGID',
    endpoint: BASE_URL,
    status: cached ? 'CONNECTED' : 'NOT_CHECKED',
    directoryCount: cached?.directoryCount ?? 0,
    quoteCount: cached?.quoteCount ?? 0,
    cachedAt: cached ? new Date(cached.fetchedAt).toISOString() : null,
    cacheAgeMs: cached ? Date.now() - cached.fetchedAt : null,
    cacheTtlMs: CACHE_TTL_MS,
    dataType: 'DELAYED',
    licenseReview: 'Confirm redistribution terms with EGID before enabling public redistribution.'
  };
}

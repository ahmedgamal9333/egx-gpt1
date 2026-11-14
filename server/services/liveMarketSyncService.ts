import { EGX_STOCKS_UNIVERSE, getEGXStock } from '../data/egxStocks.js';
import { getEgidStockDirectory } from './egidMarketDataService.js';

export interface LiveIndicesState {
  egx30: { value: number; change: number; changePct: number };
  egx70: { value: number; change: number; changePct: number };
  egx100: { value: number; change: number; changePct: number };
  fxUsdEgp: number;
  lastSyncedAt: string;
  tradingViewLatencyMs: number;
  tradingViewOnline: boolean;
  syncedStocksCount: number;
  lastSyncError: string | null;
}

const EMPTY_INDEX = { value: 0, change: 0, changePct: 0 };
const LIVE_STATE: LiveIndicesState = {
  egx30: { ...EMPTY_INDEX },
  egx70: { ...EMPTY_INDEX },
  egx100: { ...EMPTY_INDEX },
  fxUsdEgp: 0,
  lastSyncedAt: '',
  tradingViewLatencyMs: 0,
  tradingViewOnline: false,
  syncedStocksCount: 0,
  lastSyncError: null
};

let syncVersion = 0;
let isSyncing = false;

export class LiveMarketSyncService {
  public static getSyncVersion(): number {
    return syncVersion;
  }

  public static getLiveState(): LiveIndicesState {
    return { ...LIVE_STATE };
  }

  public static getLatestEgxSessionDate(): string {
    const cairoNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    const day = cairoNow.getDay();
    if (day === 5) cairoNow.setDate(cairoNow.getDate() - 1);
    else if (day === 6) cairoNow.setDate(cairoNow.getDate() - 2);
    return [
      cairoNow.getFullYear(),
      String(cairoNow.getMonth() + 1).padStart(2, '0'),
      String(cairoNow.getDate()).padStart(2, '0')
    ].join('-');
  }

  public static isEgxMarketOpenNow(): boolean {
    const cairoNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    const day = cairoNow.getDay();
    if (day === 5 || day === 6) return false;
    const minutes = cairoNow.getHours() * 60 + cairoNow.getMinutes();
    return minutes >= 600 && minutes <= 870;
  }

  public static async syncFromProviders(): Promise<{
    success: boolean;
    syncedStocks: number;
    latencyMs: number;
    timestamp: string;
    error?: string;
  }> {
    if (isSyncing) {
      return {
        success: LIVE_STATE.tradingViewOnline,
        syncedStocks: LIVE_STATE.syncedStocksCount,
        latencyMs: LIVE_STATE.tradingViewLatencyMs,
        timestamp: LIVE_STATE.lastSyncedAt
      };
    }

    isSyncing = true;
    const startedAt = Date.now();
    try {
      const stocks = await getEgidStockDirectory();
      let quoteCount = 0;
      for (const quote of stocks) {
        const stock = getEGXStock(quote.ticker);
        if (!stock || typeof quote.currentPrice !== 'number' || quote.currentPrice <= 0) continue;
        stock.currentPrice = quote.currentPrice;
        if (typeof quote.prevClose === 'number' && quote.prevClose > 0) stock.prevClose = quote.prevClose;
        if (typeof quote.volume === 'number') stock.volume = quote.volume;
        if (typeof quote.valueTraded === 'number') stock.valueTraded = quote.valueTraded;
        stock.lastSyncedAt = quote.quoteTimestamp || new Date().toISOString();
        quoteCount++;
      }

      const timestamp = new Date().toISOString();
      const latencyMs = Date.now() - startedAt;
      LIVE_STATE.lastSyncedAt = timestamp;
      LIVE_STATE.tradingViewLatencyMs = latencyMs;
      LIVE_STATE.tradingViewOnline = quoteCount > 0;
      LIVE_STATE.syncedStocksCount = quoteCount;
      LIVE_STATE.lastSyncError = null;
      syncVersion++;

      return { success: quoteCount > 0, syncedStocks: quoteCount, latencyMs, timestamp };
    } catch (error: any) {
      LIVE_STATE.lastSyncError = error?.message || 'EGID delayed feed unavailable';
      return {
        success: false,
        syncedStocks: LIVE_STATE.syncedStocksCount,
        latencyMs: Date.now() - startedAt,
        timestamp: LIVE_STATE.lastSyncedAt,
        error: LIVE_STATE.lastSyncError
      };
    } finally {
      isSyncing = false;
    }
  }
}

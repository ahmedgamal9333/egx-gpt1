import { EGX_STOCKS_UNIVERSE, getEGXStock } from '../data/egxStocks';

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

const LIVE_STATE: LiveIndicesState = {
  egx30: { value: 52023.4, change: -477.1, changePct: -0.91 },
  egx70: { value: 18527.4, change: 80.2, changePct: 0.43 },
  egx100: { value: 24494.0, change: 34.1, changePct: 0.14 },
  fxUsdEgp: 53.39,
  lastSyncedAt: new Date().toISOString(),
  tradingViewLatencyMs: 165,
  tradingViewOnline: true,
  syncedStocksCount: EGX_STOCKS_UNIVERSE.length,
  lastSyncError: null
};

let syncVersion = 1;
let isSyncing = false;

export class LiveMarketSyncService {
  public static getSyncVersion(): number {
    return syncVersion;
  }

  public static getLiveState(): LiveIndicesState {
    return { ...LIVE_STATE };
  }

  /**
   * Computes most recent EGX trading date (Sunday-Thursday <= today).
   */
  public static getLatestEgxSessionDate(): string {
    const d = new Date();
    // Shift to Cairo time (UTC+2)
    const cairoMs = d.getTime() + 2 * 60 * 60 * 1000;
    const cairo = new Date(cairoMs);
    const day = cairo.getUTCDay(); // 0=Sun..4=Thu, 5=Fri, 6=Sat
    if (day === 5) {
      cairo.setUTCDate(cairo.getUTCDate() - 1); // Friday -> Thursday
    } else if (day === 6) {
      cairo.setUTCDate(cairo.getUTCDate() - 2); // Saturday -> Thursday
    }
    return cairo.toISOString().split('T')[0];
  }

  public static isEgxMarketOpenNow(): boolean {
    const now = new Date();
    const cairo = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const day = cairo.getUTCDay();
    if (day === 5 || day === 6) return false; // Fri/Sat weekend
    const minutes = cairo.getUTCHours() * 60 + cairo.getUTCMinutes();
    // EGX trading hours: 10:00 AM - 2:30 PM Cairo Time
    return minutes >= 600 && minutes <= 870;
  }

  /**
   * Non-blocking sync against TradingView EGX Scanner API & Global Indices API.
   * Safe fallback: preserves seeded 2026 dataset if external network is unavailable.
   */
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
    const start = Date.now();

    try {
      const [stocksRes, indicesRes] = await Promise.all([
        fetch('https://scanner.tradingview.com/egypt/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5500),
          body: JSON.stringify({
            filter: [{ left: 'type', operation: 'in_range', right: ['stock', 'dr'] }],
            options: { lang: 'ar' },
            markets: ['egypt'],
            symbols: { query: { types: [] }, tickers: [] },
            columns: [
              'name',
              'close',
              'change',
              'change_abs',
              'open',
              'high',
              'low',
              'volume',
              'Value.Traded',
              'price_earnings_ttm',
              'price_book_fq',
              'dividends_yield_current',
              'RSI'
            ],
            sort: { sortBy: 'Value.Traded', sortOrder: 'desc' },
            range: [0, 300]
          })
        }),
        fetch('https://scanner.tradingview.com/global/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5500),
          body: JSON.stringify({
            symbols: {
              tickers: ['EGX:EGX30', 'EGX:EGX70EWI', 'EGX:EGX100EWI', 'FX_IDC:USDEGP']
            },
            columns: ['name', 'close', 'change', 'change_abs']
          })
        })
      ]);

      const latencyMs = Math.max(40, Date.now() - start);
      const nowIso = new Date().toISOString();
      let updatedCount = 0;

      if (stocksRes.ok) {
        const stocksJson: any = await stocksRes.json();
        const rows = Array.isArray(stocksJson?.data) ? stocksJson.data : [];

        for (const row of rows) {
          const d = row?.d;
          if (!Array.isArray(d) || !d[0]) continue;
          const rawTicker = String(d[0]).trim();
          const cleanTicker = rawTicker.replace(/-EGP$/i, '');
          const stock = getEGXStock(cleanTicker) || getEGXStock(rawTicker);
          if (!stock) continue;

          const close = typeof d[1] === 'number' && d[1] > 0 ? Number(d[1].toFixed(3)) : null;
          if (!close) continue;

          const changeAbs = typeof d[3] === 'number' ? d[3] : 0;
          const prevClose = Number(Math.max(0.001, close - changeAbs).toFixed(3));
          stock.currentPrice = close;
          stock.prevClose = prevClose;
          stock.basePrice = prevClose;
          if (typeof d[4] === 'number' && d[4] > 0) stock.openPrice = Number(d[4].toFixed(3));
          if (typeof d[5] === 'number' && d[5] > 0) stock.highPrice = Number(d[5].toFixed(3));
          if (typeof d[6] === 'number' && d[6] > 0) stock.lowPrice = Number(d[6].toFixed(3));
          if (typeof d[7] === 'number' && d[7] >= 0) stock.volume = Math.round(d[7]);
          if (typeof d[8] === 'number' && d[8] >= 0) stock.valueTraded = Math.round(d[8]);
          stock.tvPeRatio = typeof d[9] === 'number' && d[9] > 0 ? Number(d[9].toFixed(2)) : stock.tvPeRatio;
          stock.tvPbRatio = typeof d[10] === 'number' && d[10] > 0 ? Number(d[10].toFixed(2)) : stock.tvPbRatio;
          stock.tvDividendYield = typeof d[11] === 'number' && d[11] >= 0 ? Number(d[11].toFixed(2)) : stock.tvDividendYield;
          stock.tvRsi = typeof d[12] === 'number' ? Number(d[12].toFixed(2)) : stock.tvRsi;
          stock.lastSyncedAt = nowIso;
          updatedCount++;
        }
      }

      if (indicesRes.ok) {
        const idxJson: any = await indicesRes.json();
        const rows = Array.isArray(idxJson?.data) ? idxJson.data : [];
        for (const row of rows) {
          const sym = row?.s;
          const d = row?.d;
          if (!Array.isArray(d) || typeof d[1] !== 'number') continue;
          const val = Number(d[1].toFixed(2));
          const chgPct = typeof d[2] === 'number' ? Number(d[2].toFixed(2)) : 0;
          const chgAbs = typeof d[3] === 'number' ? Number(d[3].toFixed(2)) : 0;
          if (sym === 'EGX:EGX30') LIVE_STATE.egx30 = { value: val, change: chgAbs, changePct: chgPct };
          else if (sym === 'EGX:EGX70EWI') LIVE_STATE.egx70 = { value: val, change: chgAbs, changePct: chgPct };
          else if (sym === 'EGX:EGX100EWI') LIVE_STATE.egx100 = { value: val, change: chgAbs, changePct: chgPct };
          else if (sym === 'FX_IDC:USDEGP') LIVE_STATE.fxUsdEgp = val;
        }
      }

      LIVE_STATE.lastSyncedAt = nowIso;
      LIVE_STATE.tradingViewLatencyMs = latencyMs;
      LIVE_STATE.tradingViewOnline = updatedCount > 0;
      if (updatedCount > 0) {
        LIVE_STATE.syncedStocksCount = updatedCount;
      }
      LIVE_STATE.lastSyncError = null;
      syncVersion++;

      return {
        success: true,
        syncedStocks: updatedCount || LIVE_STATE.syncedStocksCount,
        latencyMs,
        timestamp: nowIso
      };
    } catch (err: any) {
      LIVE_STATE.lastSyncError = err?.message || 'Live sync fallback active';
      return {
        success: false,
        syncedStocks: LIVE_STATE.syncedStocksCount,
        latencyMs: LIVE_STATE.tradingViewLatencyMs,
        timestamp: LIVE_STATE.lastSyncedAt,
        error: LIVE_STATE.lastSyncError || undefined
      };
    } finally {
      isSyncing = false;
    }
  }
}

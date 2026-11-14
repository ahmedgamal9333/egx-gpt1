import 'dotenv/config';

export type DataCedarBar = {
  sid: string;
  symbol: string;
  timeframe: string;
  ts_ms: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: string | null;
  adjustment: string;
};

function getKey() {
  const key = process.env.DATACEDAR_KEY;
  if (!key) throw new Error('DATACEDAR_KEY_MISSING');
  return key;
}

export async function getDataCedarDailyBars(ticker: string, from?: string) {
  const clean = ticker.trim().toUpperCase().replace(/\.CA$/, '');
  if (!/^[A-Z0-9.-]{1,20}$/.test(clean)) throw new Error('INVALID_EGX_TICKER');

  const sid = `egx:${clean.toLowerCase()}`;
  const url = new URL(`https://api.datacedar.com/v3/stocks/${encodeURIComponent(sid)}/bars`);
  url.searchParams.set('timeframe', '1d');
  url.searchParams.set('order', 'asc');
  url.searchParams.set('limit', '50000');
  url.searchParams.set('adjustment', 'raw');
  if (from) url.searchParams.set('from', from);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getKey()}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body?.error?.code || `DATACEDAR_HTTP_${response.status}`;
    throw new Error(String(code));
  }

  const rows = Array.isArray(body?.data) ? body.data : [];
  const bars: DataCedarBar[] = rows.map((row: any) => ({
    sid: String(row.sid ?? sid),
    symbol: String(row.symbol ?? clean),
    timeframe: String(row.timeframe ?? '1Day'),
    ts_ms: String(row.ts_ms ?? ''),
    open: typeof row.open === 'number' ? row.open : null,
    high: typeof row.high === 'number' ? row.high : null,
    low: typeof row.low === 'number' ? row.low : null,
    close: typeof row.close === 'number' ? row.close : null,
    volume: row.volume == null ? null : String(row.volume),
    adjustment: String(row.adjustment ?? 'raw'),
  })).filter((bar: DataCedarBar) => bar.close !== null && bar.ts_ms);

  return {
    ticker: clean,
    sid,
    source: 'DataCedar',
    currency: body?.meta?.currency ?? 'EGP',
    exchange: body?.meta?.exchange ?? 'EGX',
    fetchedAt: body?.meta?.timestamp ?? new Date().toISOString(),
    bars,
    pagination: body?.pagination ?? null,
  };
}

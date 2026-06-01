import { Kline } from '@/types/signals';

const INFO_URL = 'https://api.hyperliquid.xyz/info';

// Map our internal interval codes (Bybit-style, used throughout the app) to
// Hyperliquid candle interval strings.
const INTERVAL_MAP: Record<string, string> = {
  D: '1d',
  W: '1w',
  '240': '4h',
  '720': '12h',
  '60': '1h',
};

const INTERVAL_MS: Record<string, number> = {
  '1d': 86_400_000,
  '1w': 604_800_000,
  '4h': 14_400_000,
  '12h': 43_200_000,
  '1h': 3_600_000,
};

interface HLCandle {
  t: number; // open time (ms)
  T: number; // close time (ms)
  s: string; // coin
  i: string; // interval
  o: string;
  c: string;
  h: string;
  l: string;
  v: string; // base volume (e.g. BTC)
  n: number; // trade count
}

/**
 * Fetch BTC perpetual candles from Hyperliquid.
 * `coin` is the Hyperliquid asset name (e.g. "BTC"), `interval` is our internal
 * Bybit-style code ("D", "W", "240", "720", "60"). Returns ascending by time.
 */
export async function getKlines(coin: string, interval: string, limit = 200): Promise<Kline[]> {
  const hlInterval = INTERVAL_MAP[interval] ?? interval;
  const span = INTERVAL_MS[hlInterval] ?? 86_400_000;
  const endTime = Date.now();
  // Pad the window so we comfortably receive at least `limit` candles.
  const startTime = endTime - span * (limit + 2);

  const resp = await fetch(INFO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'candleSnapshot',
      req: { coin, interval: hlInterval, startTime, endTime },
    }),
  });

  if (!resp.ok) {
    throw new Error(`Hyperliquid kline error (${coin} ${hlInterval}): ${resp.status}`);
  }

  const data: HLCandle[] = await resp.json();
  if (!Array.isArray(data)) {
    throw new Error(`Hyperliquid kline error (${coin} ${hlInterval}): unexpected response`);
  }

  const klines: Kline[] = data.map((k) => {
    const close = parseFloat(k.c);
    const volume = parseFloat(k.v);
    return {
      time: Math.floor(k.t / 1000),
      open: parseFloat(k.o),
      high: parseFloat(k.h),
      low: parseFloat(k.l),
      close,
      volume,
      turnover: volume * close, // quote volume approximation (HL gives base volume only)
    };
  });

  klines.sort((a, b) => a.time - b.time);
  return klines.slice(-limit);
}

export interface PerpContext {
  markPx: number;
  midPx: number;
  prevDayPx: number;
  funding: number;
  openInterest: number;
  change24hPercent: number;
}

/**
 * Fetch the current BTC perpetual context (mark/mid price, 24h change, funding, OI)
 * from Hyperliquid's metaAndAssetCtxs endpoint.
 */
export async function getPerpContext(coin: string): Promise<PerpContext> {
  const resp = await fetch(INFO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
  });

  if (!resp.ok) {
    throw new Error(`Hyperliquid ctx error: ${resp.status}`);
  }

  const data = await resp.json();
  const universe = data?.[0]?.universe;
  const ctxs = data?.[1];
  if (!Array.isArray(universe) || !Array.isArray(ctxs)) {
    throw new Error('Hyperliquid ctx error: unexpected response');
  }

  const idx = universe.findIndex((a: { name: string }) => a.name === coin);
  if (idx < 0) {
    throw new Error(`Hyperliquid ctx error: coin ${coin} not found`);
  }

  const ctx = ctxs[idx];
  const markPx = parseFloat(ctx.markPx);
  const prevDayPx = parseFloat(ctx.prevDayPx);

  return {
    markPx,
    midPx: parseFloat(ctx.midPx),
    prevDayPx,
    funding: parseFloat(ctx.funding),
    openInterest: parseFloat(ctx.openInterest),
    change24hPercent: prevDayPx > 0 ? ((markPx - prevDayPx) / prevDayPx) * 100 : 0,
  };
}

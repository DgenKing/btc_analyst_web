import { fetchDuneEtfFlows } from './dune';
import { fetchReserveRisk, fetchPuellMultiple } from './bitcoinData';

/**
 * Defense-in-depth caching for the overlay sources. Three independent layers
 * so even if Vercel's caching layers fail, we never exceed the daily budget.
 *
 *   Layer 1 (in this file): hard per-instance rate limiter — refuses to call
 *                           upstream more than MAX_CALLS_PER_DAY in any 24h
 *                           rolling window, returns last-known-good if hit.
 *   Layer 2 (in this file): module-level cache with 12h TTL — caches results
 *                           within a single function instance.
 *   Layer 3 (route-level):  /api/_overlay route has `export const revalidate
 *                           = 43200`, so Vercel's edge cache shares results
 *                           across all instances and regions.
 *
 * Previous attempts to use `unstable_cache` proved unreliable on Vercel Hobby
 * — each cold function instance had its own cache namespace, leading to many
 * upstream calls per day when instances were spun up by traffic.
 */

const TTL_MS = 12 * 60 * 60 * 1000;       // 12 hours
const ONE_DAY_MS = 24 * 60 * 60 * 1000;   // 24 hours
const MAX_CALLS_PER_DAY = 3;              // hard ceiling per instance (2 expected + 1 buffer)

interface OverlayData {
  etfFlows: Awaited<ReturnType<typeof fetchDuneEtfFlows>>;
  reserveRisk: Awaited<ReturnType<typeof fetchReserveRisk>>;
  puellMultiple: Awaited<ReturnType<typeof fetchPuellMultiple>>;
}

declare global {
  // eslint-disable-next-line no-var
  var __btcAnalyst_overlayCache: { fetchedAt: number; data: OverlayData } | undefined;
  // eslint-disable-next-line no-var
  var __btcAnalyst_overlayCallLog: number[] | undefined;
}

async function fetchOverlayDataRaw(): Promise<OverlayData> {
  const [etfFlows, reserveRisk, puellMultiple] = await Promise.all([
    fetchDuneEtfFlows(),
    fetchReserveRisk(),
    fetchPuellMultiple(),
  ]);
  return { etfFlows, reserveRisk, puellMultiple };
}

export async function getOverlayData(): Promise<OverlayData> {
  const now = Date.now();
  const cache = globalThis.__btcAnalyst_overlayCache;

  // --- Layer 2: TTL cache hit? Return immediately, no upstream call ---
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return cache.data;
  }

  // --- Layer 1: Rate limiter — count upstream calls in the last 24h ---
  globalThis.__btcAnalyst_overlayCallLog ??= [];
  globalThis.__btcAnalyst_overlayCallLog = globalThis.__btcAnalyst_overlayCallLog.filter(
    (t) => now - t < ONE_DAY_MS,
  );

  if (globalThis.__btcAnalyst_overlayCallLog.length >= MAX_CALLS_PER_DAY) {
    // Hard refuse. Return whatever we have cached, no matter how old.
    if (cache) return cache.data;
    return {
      etfFlows: { status: 'unavailable', error: 'rate-limited (24h cap reached)' },
      reserveRisk: { status: 'unavailable', error: 'rate-limited (24h cap reached)' },
      puellMultiple: { status: 'unavailable', error: 'rate-limited (24h cap reached)' },
    };
  }

  // Approved — record the call and fetch
  globalThis.__btcAnalyst_overlayCallLog.push(now);
  const data = await fetchOverlayDataRaw();
  globalThis.__btcAnalyst_overlayCache = { fetchedAt: now, data };
  return data;
}

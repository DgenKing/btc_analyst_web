import { unstable_cache } from 'next/cache';
import { fetchDuneEtfFlows } from './dune';
import { fetchReserveRisk, fetchPuellMultiple } from './bitcoinData';

/**
 * Per-source caches with 12h TTL.
 *
 * IMPORTANT: each source is cached independently so a failure in one (e.g.
 * a rate-limit or transient 5xx) doesn't poison the cached results of the
 * others. Previously they were grouped under a single cache key — one bad
 * fetch silently held all three back for 12 hours.
 *
 * Bumping the version suffix (e.g. v2 -> v3) invalidates the cache.
 *
 * Cost ceiling per source: 2 calls/24h regardless of dashboard traffic.
 *   - Dune: 2 × ~22 credits/call ≈ 44/day = ~1,320/month (cap 2,500)
 *   - bitcoin-data.com: 2 calls per endpoint per day = 4/day (cap 15/day)
 */
const TTL = 43200; // 12h

const cachedDuneEtfFlows = unstable_cache(
  fetchDuneEtfFlows,
  ['overlay-etf-v2'],
  { revalidate: TTL, tags: ['overlay', 'overlay-etf'] },
);

const cachedReserveRisk = unstable_cache(
  fetchReserveRisk,
  ['overlay-reserve-risk-v2'],
  { revalidate: TTL, tags: ['overlay', 'overlay-reserve-risk'] },
);

const cachedPuellMultiple = unstable_cache(
  fetchPuellMultiple,
  ['overlay-puell-v2'],
  { revalidate: TTL, tags: ['overlay', 'overlay-puell'] },
);

export async function getOverlayData() {
  const [etfFlows, reserveRisk, puellMultiple] = await Promise.all([
    cachedDuneEtfFlows(),
    cachedReserveRisk(),
    cachedPuellMultiple(),
  ]);
  return { etfFlows, reserveRisk, puellMultiple };
}

import { unstable_cache } from 'next/cache';
import { fetchDuneEtfFlows } from './dune';
import { fetchReserveRisk, fetchPuellMultiple } from './bitcoinData';

/**
 * Real overlay fetcher — hits external APIs.
 * MUST be wrapped in unstable_cache to prevent burning rate limits.
 *
 * `fetch(..., { next: { revalidate } })` DOES NOT work inside route handlers
 * — that hint is only honored in Server Components / pages. Route handlers
 * re-execute every request unless wrapped in unstable_cache.
 */
async function fetchOverlayDataRaw() {
  const [etfFlows, reserveRisk, puellMultiple] = await Promise.all([
    fetchDuneEtfFlows(),
    fetchReserveRisk(),
    fetchPuellMultiple(),
  ]);

  return {
    etfFlows,
    reserveRisk,
    puellMultiple,
  };
}

/**
 * Cached overlay data — Dune + bitcoin-data.com hit at most ONCE per 12 hours
 * regardless of how many times /api/snapshot is requested.
 *
 * Budget at 12h TTL:
 *   • Dune: 2 calls/day × ~22 credits = 44 credits/day = ~1,320/month (under 2,500 cap)
 *   • bitcoin-data.com: 4 calls/day (2 endpoints × 2 refreshes) — well under 15/day cap
 */
export const getOverlayData = unstable_cache(
  fetchOverlayDataRaw,
  ['overlay-data-v1'],
  {
    revalidate: 43200, // 12 hours
    tags: ['overlay'],
  },
);

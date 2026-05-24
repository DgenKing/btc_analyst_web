import { Kline, SignalState } from '@/types/signals';
import { findPivots } from './supportResistance';

/**
 * Auto-derive the two entry-filter signals from existing market data.
 * Originally specced as manual checkboxes; auto-derived here so the section isn't dead.
 */
export function getEntryFilterSignals(klinesD: Kline[], klines1H: Kline[]): SignalState[] {
  const fetchedAt = Date.now();

  if (klinesD.length < 20 || klines1H.length < 5) {
    return ['tight-risk', 'confirmation'].map(id => ({
      id,
      status: 'none' as const,
      score: 0,
      confluence: { passed: 0, total: 1 },
      fetchedAt,
    }));
  }

  const last = klinesD[klinesD.length - 1];
  const lastClose = last.close;

  // tight-risk: is there a clear invalidation level within 3% of current price?
  // Use pivots — if the nearest pivot (low or high) is within 3%, stop can be placed tight.
  const { highs, lows } = findPivots(klinesD, 5);
  const supports = lows.filter(l => l < lastClose);
  const resistances = highs.filter(h => h > lastClose);
  const nearestSup = supports.length > 0 ? Math.max(...supports) : lastClose * 0.9;
  const nearestRes = resistances.length > 0 ? Math.min(...resistances) : lastClose * 1.1;
  const distSup = (lastClose - nearestSup) / lastClose;
  const distRes = (nearestRes - lastClose) / lastClose;
  const tightRisk = distSup < 0.03 || distRes < 0.03;

  // confirmation: last 3x 1H candles in same direction as the most recent close-vs-open
  const last3H = klines1H.slice(-3);
  const dailyDirection = last.close > last.open ? 'up' : 'down';
  const hourlyAgrees =
    dailyDirection === 'up'
      ? last3H.every(k => k.close >= k.open)
      : last3H.every(k => k.close <= k.open);
  const confirmation = hourlyAgrees;

  return [
    {
      id: 'tight-risk',
      status: tightRisk ? 'green' : 'none',
      score: 0, // execution filter, no directional contribution
      confluence: { passed: tightRisk ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'confirmation',
      status: confirmation ? 'green' : 'none',
      score: 0,
      confluence: { passed: confirmation ? 1 : 0, total: 1 },
      fetchedAt,
    },
  ];
}

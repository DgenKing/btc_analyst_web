import { Kline, SignalState } from '@/types/signals';
import { findPivots } from './supportResistance';

/**
 * Composite setup signals — combine raw market data into actionable long/short patterns.
 * These are higher-confidence signals because they require multiple criteria to align.
 */
export function getSetupSignals(klinesD: Kline[], klines1H: Kline[]): SignalState[] {
  const fetchedAt = Date.now();
  const out: SignalState[] = [];

  if (klinesD.length < 20) {
    return [
      'long-support-holding', 'long-structure-reclaim', 'long-liquidity-sweep', 'long-momentum-conf',
      'short-res-rejection', 'short-failure-reclaim', 'short-breakdown',
    ].map(id => ({
      id,
      status: 'none' as const,
      score: 0,
      confluence: { passed: 0, total: 1 },
      fetchedAt,
    }));
  }

  const last = klinesD[klinesD.length - 1];
  const prev = klinesD[klinesD.length - 2];
  const prior5 = klinesD.slice(-6, -1);

  const { highs, lows } = findPivots(klinesD, 5);
  const lastClose = last.close;

  const supportsBelow = lows.filter(l => l < lastClose);
  const nearestSup = supportsBelow.length > 0 ? Math.max(...supportsBelow) : lastClose * 0.9;
  const resistancesAbove = highs.filter(h => h > lastClose);
  const nearestRes = resistancesAbove.length > 0 ? Math.min(...resistancesAbove) : lastClose * 1.1;

  const distSup = (lastClose - nearestSup) / lastClose;
  const distRes = (nearestRes - lastClose) / lastClose;

  // --- LONG SETUPS ---

  // long-support-holding: at/near a real support level, recent low touched it, closed back above
  const recentLow = Math.min(...prior5.map(k => k.low), last.low);
  const supportHolding = distSup < 0.04
    && recentLow <= nearestSup * 1.015
    && lastClose > nearestSup;

  // long-structure-reclaim: prior 5 closes had at least one below a pivot, current close back above
  const brokenLowPivots = lows.filter(l => prior5.some(k => k.close < l) && lastClose > l);
  const structureReclaim = brokenLowPivots.length > 0 && lastClose > prev.close;

  // long-liquidity-sweep: last 3 daily candles wicked below a pivot low, but closed back above
  // Use 1H for finer detection if available
  const sweepCandidates = klines1H.length > 10 ? klines1H.slice(-12) : klinesD.slice(-3);
  const liquiditySweep = sweepCandidates.some((k, i) => {
    if (i === 0) return false;
    const swingLow = Math.min(...sweepCandidates.slice(0, i).map(c => c.low));
    return k.low < swingLow * 0.998 && k.close > swingLow;
  });

  // long-momentum-conf: positive candle, above avg volume, close in upper third
  const last10Vol = klinesD.slice(-10).reduce((s, k) => s + k.volume, 0) / 10;
  const candleRange = last.high - last.low;
  const upperThird = candleRange > 0 && (last.close - last.low) / candleRange > 0.66;
  const momentumConf = last.close > last.open
    && last.volume > last10Vol * 1.1
    && upperThird;

  out.push(
    {
      id: 'long-support-holding',
      status: supportHolding ? 'green' : 'none',
      value: nearestSup.toFixed(0),
      score: supportHolding ? 10 : 0,
      confluence: { passed: supportHolding ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'long-structure-reclaim',
      status: structureReclaim ? 'green' : 'none',
      score: structureReclaim ? 10 : 0,
      confluence: { passed: structureReclaim ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'long-liquidity-sweep',
      status: liquiditySweep ? 'green' : 'none',
      score: liquiditySweep ? 10 : 0,
      confluence: { passed: liquiditySweep ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'long-momentum-conf',
      status: momentumConf ? 'green' : 'none',
      score: momentumConf ? 5 : 0,
      confluence: { passed: momentumConf ? 1 : 0, total: 1 },
      fetchedAt,
    },
  );

  // --- SHORT SETUPS ---

  // short-res-rejection: at/near resistance, recent high touched it, closed back below
  const recentHigh = Math.max(...prior5.map(k => k.high), last.high);
  const resRejection = distRes < 0.04
    && recentHigh >= nearestRes * 0.985
    && lastClose < nearestRes;

  // short-failure-reclaim: prior 5 closes had at least one above a pivot high, current closed back below
  const failedHighPivots = highs.filter(h => prior5.some(k => k.close > h) && lastClose < h);
  const failureReclaim = failedHighPivots.length > 0 && lastClose < prev.close;

  // short-breakdown: prior 5 closes were above a recent pivot low, current closed below
  const recentLowPivots = lows.slice(-5);
  const breakdown = recentLowPivots.length > 0
    && recentLowPivots.some(l => prior5.every(k => k.close > l) && lastClose < l);

  out.push(
    {
      id: 'short-res-rejection',
      status: resRejection ? 'red' : 'none',
      value: nearestRes.toFixed(0),
      score: resRejection ? -10 : 0,
      confluence: { passed: resRejection ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'short-failure-reclaim',
      status: failureReclaim ? 'red' : 'none',
      score: failureReclaim ? -10 : 0,
      confluence: { passed: failureReclaim ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'short-breakdown',
      status: breakdown ? 'red' : 'none',
      score: breakdown ? -10 : 0,
      confluence: { passed: breakdown ? 1 : 0, total: 1 },
      fetchedAt,
    },
  );

  return out;
}

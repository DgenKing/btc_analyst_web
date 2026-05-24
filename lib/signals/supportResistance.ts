import { Kline, SignalState } from '@/types/signals';

export function findPivots(klines: Kline[], period: number = 5) {
  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = period; i < klines.length - period; i++) {
    const current = klines[i];

    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= period; j++) {
      if (klines[i - j].high >= current.high || klines[i + j].high >= current.high) isHigh = false;
      if (klines[i - j].low <= current.low || klines[i + j].low <= current.low) isLow = false;
    }

    if (isHigh) highs.push(current.high);
    if (isLow) lows.push(current.low);
  }

  return { highs, lows };
}

export function getSRSignals(klines: Kline[]): SignalState[] {
  const { highs, lows } = findPivots(klines);
  const lastClose = klines[klines.length - 1].close;
  const fetchedAt = Date.now();

  const highsAbove = highs.filter(h => h > lastClose);
  const lowsBelow = lows.filter(l => l < lastClose);

  const nearestRes = highsAbove.length > 0 ? Math.min(...highsAbove) : lastClose * 1.5;
  const nearestSup = lowsBelow.length > 0 ? Math.max(...lowsBelow) : lastClose * 0.5;

  const distRes = (nearestRes - lastClose) / lastClose;
  const distSup = (lastClose - nearestSup) / lastClose;

  // Detect breakout retests: price recently broke above a pivot and is now within retest range
  const recentKlines = klines.slice(-20);
  const recentHighs = recentKlines.map(k => k.high);
  const recentLows = recentKlines.map(k => k.low);
  const recent20High = Math.max(...recentHighs);
  const recent20Low = Math.min(...recentLows);

  // Old resistance becomes support: price broke above a prior pivot high in the recent window AND is currently within 2% of it
  const brokenResistances = highs.filter(h => h < recent20High && lastClose > h);
  const oldResRetest = brokenResistances.length > 0
    ? Math.max(...brokenResistances)
    : null;
  const oldResRetestActive = oldResRetest !== null && (lastClose - oldResRetest) / lastClose < 0.03;

  // Old support becomes resistance: price broke below a prior pivot low in the recent window AND is currently within 2% of it
  const brokenSupports = lows.filter(l => l > recent20Low && lastClose < l);
  const oldSupRetest = brokenSupports.length > 0
    ? Math.min(...brokenSupports)
    : null;
  const oldSupRetestActive = oldSupRetest !== null && (oldSupRetest - lastClose) / lastClose < 0.03;

  return [
    {
      id: 'major-support-nearby',
      status: distSup < 0.05 ? 'green' : 'none',
      value: nearestSup.toFixed(0),
      score: distSup < 0.05 ? 8 : 0,
      confluence: { passed: distSup < 0.05 ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'major-resistance-nearby',
      status: distRes < 0.05 ? 'red' : 'none',
      value: nearestRes.toFixed(0),
      score: distRes < 0.05 ? -8 : 0,
      confluence: { passed: distRes < 0.05 ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'horizontal-support',
      status: distSup < 0.03 ? 'green' : 'none',
      value: nearestSup.toFixed(0),
      score: distSup < 0.03 ? 8 : 0,
      confluence: { passed: distSup < 0.03 ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'horizontal-resistance',
      status: distRes < 0.03 ? 'red' : 'none',
      value: nearestRes.toFixed(0),
      score: distRes < 0.03 ? -8 : 0,
      confluence: { passed: distRes < 0.03 ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'old-res-as-sup',
      status: oldResRetestActive ? 'green' : 'none',
      value: oldResRetest !== null ? oldResRetest.toFixed(0) : undefined,
      score: oldResRetestActive ? 8 : 0,
      confluence: { passed: oldResRetestActive ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'old-sup-as-res',
      status: oldSupRetestActive ? 'red' : 'none',
      value: oldSupRetest !== null ? oldSupRetest.toFixed(0) : undefined,
      score: oldSupRetestActive ? -8 : 0,
      confluence: { passed: oldSupRetestActive ? 1 : 0, total: 1 },
      fetchedAt,
    },
  ];
}

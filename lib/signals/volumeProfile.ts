import { Kline, SignalState } from '@/types/signals';

interface VolumeProfile {
  poc: number;          // Point of Control — price with highest traded volume
  hvns: number[];       // High Volume Node price levels
  valueAreaHigh: number;
  valueAreaLow: number;
  binSize: number;
}

/**
 * Compute volume profile from kline data.
 * Bins the price range into N buckets, sums volume × time-spent at each level.
 * Volume per candle is distributed evenly across that candle's high-low range
 * (a common approximation when tick data isn't available).
 */
export function computeVolumeProfile(klines: Kline[], bins: number = 40): VolumeProfile | null {
  if (klines.length < 20) return null;

  const allHigh = Math.max(...klines.map(k => k.high));
  const allLow = Math.min(...klines.map(k => k.low));
  const binSize = (allHigh - allLow) / bins;
  if (binSize <= 0) return null;

  const buckets = new Array<number>(bins).fill(0);

  for (const k of klines) {
    const candleRange = k.high - k.low;
    if (candleRange <= 0) {
      // doji-like — dump full volume into the close bin
      const idx = Math.min(bins - 1, Math.max(0, Math.floor((k.close - allLow) / binSize)));
      buckets[idx] += k.volume;
      continue;
    }
    const startBin = Math.max(0, Math.floor((k.low - allLow) / binSize));
    const endBin = Math.min(bins - 1, Math.floor((k.high - allLow) / binSize));
    const binCount = endBin - startBin + 1;
    const volPerBin = k.volume / binCount;
    for (let b = startBin; b <= endBin; b++) {
      buckets[b] += volPerBin;
    }
  }

  // POC = bin with max volume
  let pocBin = 0;
  let pocVol = 0;
  for (let i = 0; i < bins; i++) {
    if (buckets[i] > pocVol) {
      pocVol = buckets[i];
      pocBin = i;
    }
  }
  const poc = allLow + (pocBin + 0.5) * binSize;

  // HVNs = bins with >= 70% of POC volume (excluding POC itself)
  const hvnThreshold = pocVol * 0.7;
  const hvns: number[] = [];
  for (let i = 0; i < bins; i++) {
    if (i === pocBin) continue;
    if (buckets[i] >= hvnThreshold) {
      hvns.push(allLow + (i + 0.5) * binSize);
    }
  }

  // Value Area = 70% of total volume centered on POC
  const totalVol = buckets.reduce((s, v) => s + v, 0);
  const target = totalVol * 0.7;
  let accum = pocVol;
  let lowIdx = pocBin;
  let highIdx = pocBin;
  while (accum < target && (lowIdx > 0 || highIdx < bins - 1)) {
    const lowVal = lowIdx > 0 ? buckets[lowIdx - 1] : -1;
    const highVal = highIdx < bins - 1 ? buckets[highIdx + 1] : -1;
    if (highVal >= lowVal) {
      highIdx++;
      accum += buckets[highIdx];
    } else {
      lowIdx--;
      accum += buckets[lowIdx];
    }
  }
  const valueAreaLow = allLow + lowIdx * binSize;
  const valueAreaHigh = allLow + (highIdx + 1) * binSize;

  return { poc, hvns, valueAreaHigh, valueAreaLow, binSize };
}

export function getVolumeProfileSignals(klines: Kline[]): SignalState[] {
  const VP_LOOKBACK_DAYS = 30;
  const profile = computeVolumeProfile(klines.slice(-VP_LOOKBACK_DAYS));
  const fetchedAt = Date.now();

  if (!profile) {
    return [
      'hvn-support', 'hvn-resistance', 'poc-support', 'poc-resistance',
      'above-value-area', 'below-value-area',
    ].map(id => ({
      id,
      status: 'none' as const,
      score: 0,
      confluence: { passed: 0, total: 1 },
      fetchedAt,
    }));
  }

  const lastClose = klines[klines.length - 1].close;
  const { poc, hvns, valueAreaHigh, valueAreaLow, binSize } = profile;

  // "Near" tolerance: 1 bin width or 2% of price, whichever is larger
  const tolerance = Math.max(binSize, lastClose * 0.02);

  // POC reactions
  const pocSupport = lastClose > poc && lastClose - poc < tolerance;
  const pocResistance = lastClose < poc && poc - lastClose < tolerance;

  // HVN reactions — closest HVN above/below
  const hvnsBelow = hvns.filter(h => h < lastClose);
  const hvnsAbove = hvns.filter(h => h > lastClose);
  const nearestHvnBelow = hvnsBelow.length > 0 ? Math.max(...hvnsBelow) : null;
  const nearestHvnAbove = hvnsAbove.length > 0 ? Math.min(...hvnsAbove) : null;
  const hvnSupport = nearestHvnBelow !== null && (lastClose - nearestHvnBelow) < tolerance;
  const hvnResistance = nearestHvnAbove !== null && (nearestHvnAbove - lastClose) < tolerance;

  // Value area positioning
  const aboveValueArea = lastClose > valueAreaHigh;
  const belowValueArea = lastClose < valueAreaLow;

  return [
    {
      id: 'hvn-support',
      status: hvnSupport ? 'green' : 'none',
      value: nearestHvnBelow !== null ? nearestHvnBelow.toFixed(0) : undefined,
      score: hvnSupport ? 7 : 0,
      confluence: { passed: hvnSupport ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'hvn-resistance',
      status: hvnResistance ? 'red' : 'none',
      value: nearestHvnAbove !== null ? nearestHvnAbove.toFixed(0) : undefined,
      score: hvnResistance ? -7 : 0,
      confluence: { passed: hvnResistance ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'poc-support',
      status: pocSupport ? 'green' : 'none',
      value: poc.toFixed(0),
      score: pocSupport ? 7 : 0,
      confluence: { passed: pocSupport ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'poc-resistance',
      status: pocResistance ? 'red' : 'none',
      value: poc.toFixed(0),
      score: pocResistance ? -7 : 0,
      confluence: { passed: pocResistance ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'above-value-area',
      status: aboveValueArea ? 'green' : 'none',
      value: valueAreaHigh.toFixed(0),
      score: aboveValueArea ? 7 : 0,
      confluence: { passed: aboveValueArea ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'below-value-area',
      status: belowValueArea ? 'red' : 'none',
      value: valueAreaLow.toFixed(0),
      score: belowValueArea ? -7 : 0,
      confluence: { passed: belowValueArea ? 1 : 0, total: 1 },
      fetchedAt,
    },
  ];
}

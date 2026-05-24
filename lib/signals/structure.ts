import { Kline, SignalState } from '@/types/signals';

interface StructureResult {
  bias: 'bullish' | 'bearish' | 'neutral';
  passed: number;
  total: number;
}

function sma(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Robust trend detection across a configurable lookback window.
 * Returns 5 sub-criteria: drift, HHs, HLs, above-mid-SMA, above-long-SMA.
 */
export function detectStructure(klines: Kline[], lookback: number = 20): StructureResult {
  if (klines.length < lookback) return { bias: 'neutral', passed: 0, total: 5 };

  const window = klines.slice(-lookback);
  const priorWindow = klines.slice(-lookback * 2, -lookback);
  if (priorWindow.length === 0) return { bias: 'neutral', passed: 0, total: 5 };

  const last = klines[klines.length - 1];
  const firstInWindow = window[0];

  const recentHighs = Math.max(...window.map(k => k.high));
  const recentLows = Math.min(...window.map(k => k.low));
  const priorHighs = Math.max(...priorWindow.map(k => k.high));
  const priorLows = Math.min(...priorWindow.map(k => k.low));

  // For SMAs, use up to the most recent N closes
  const mids = klines.slice(-50).map(k => k.close);
  const longs = klines.slice(-200).map(k => k.close);
  const midMA = sma(mids);
  const longMA = sma(longs);

  let bullPassed = 0;
  let bearPassed = 0;

  // 1. Drift over the lookback window
  if (last.close > firstInWindow.close) bullPassed++;
  else if (last.close < firstInWindow.close) bearPassed++;

  // 2. Higher highs vs prior window
  if (recentHighs > priorHighs) bullPassed++;
  else if (recentHighs < priorHighs) bearPassed++;

  // 3. Higher lows vs prior window
  if (recentLows > priorLows) bullPassed++;
  else if (recentLows < priorLows) bearPassed++;

  // 4. Above mid-term SMA
  if (last.close > midMA) bullPassed++;
  else bearPassed++;

  // 5. Above long-term SMA
  if (longs.length >= 50 && last.close > longMA) bullPassed++;
  else if (longs.length >= 50) bearPassed++;

  if (bullPassed >= 4) return { bias: 'bullish', passed: bullPassed, total: 5 };
  if (bearPassed >= 4) return { bias: 'bearish', passed: bearPassed, total: 5 };
  return { bias: 'neutral', passed: Math.max(bullPassed, bearPassed), total: 5 };
}

/**
 * Long-term cycle health: compare current price to 200d high/low envelope.
 * Intact: holding above 200d low + above the 200d midpoint, no recent breakdown.
 * Broken: near 200d low or below 200d midpoint with downward drift.
 */
function detectLongTermStructure(klines: Kline[]): 'intact' | 'broken' | 'neutral' {
  if (klines.length < 200) return 'neutral';
  const last = klines[klines.length - 1].close;
  const last200 = klines.slice(-200);
  const high200 = Math.max(...last200.map(k => k.high));
  const low200 = Math.min(...last200.map(k => k.low));
  const mid200 = (high200 + low200) / 2;

  // Recent 30d swing low — if it's well above the 200d low, structure is intact
  const last30Lows = klines.slice(-30).map(k => k.low);
  const swing30Low = Math.min(...last30Lows);

  const aboveMid = last > mid200;
  const swing30AboveLow = swing30Low > low200 * 1.1; // recent swing low is 10%+ above the cycle low

  if (aboveMid && swing30AboveLow) return 'intact';
  if (!aboveMid && last < swing30Low * 1.02) return 'broken';
  return 'neutral';
}

export function getStructureSignals(klinesD: Kline[]): SignalState[] {
  const daily = detectStructure(klinesD, 20);
  const macro = detectStructure(klinesD, 60); // ~2 months for bull/bear market structure
  const longTerm = detectLongTermStructure(klinesD);
  const fetchedAt = Date.now();

  const isRanging = daily.bias === 'neutral';

  return [
    // --- Market Bias section ---
    {
      id: 'btc-trending-up',
      status: daily.bias === 'bullish' ? 'green' : 'none',
      score: daily.bias === 'bullish' ? 10 : 0,
      confluence: { passed: daily.bias === 'bullish' ? daily.passed : 0, total: 5 },
      fetchedAt,
    },
    {
      id: 'btc-trending-down',
      status: daily.bias === 'bearish' ? 'red' : 'none',
      score: daily.bias === 'bearish' ? -10 : 0,
      confluence: { passed: daily.bias === 'bearish' ? daily.passed : 0, total: 5 },
      fetchedAt,
    },
    {
      id: 'btc-ranging',
      status: isRanging ? 'yellow' : 'none',
      score: 0, // neutral signal — no directional score contribution
      confluence: { passed: isRanging ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'bull-market-structure',
      status: macro.bias === 'bullish' ? 'green' : 'none',
      score: macro.bias === 'bullish' ? 10 : 0,
      confluence: { passed: macro.bias === 'bullish' ? macro.passed : 0, total: 5 },
      fetchedAt,
    },
    {
      id: 'bear-market-structure',
      status: macro.bias === 'bearish' ? 'red' : 'none',
      score: macro.bias === 'bearish' ? -10 : 0,
      confluence: { passed: macro.bias === 'bearish' ? macro.passed : 0, total: 5 },
      fetchedAt,
    },
    {
      id: 'long-term-structure-intact',
      status: longTerm === 'intact' ? 'green' : 'none',
      score: longTerm === 'intact' ? 8 : 0,
      confluence: { passed: longTerm === 'intact' ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'long-term-structure-broken',
      status: longTerm === 'broken' ? 'red' : 'none',
      score: longTerm === 'broken' ? -8 : 0,
      confluence: { passed: longTerm === 'broken' ? 1 : 0, total: 1 },
      fetchedAt,
    },

    // --- Multi-Timeframe section (daily structure) ---
    {
      id: 'daily-bullish-structure',
      status: daily.bias === 'bullish' ? 'green' : 'none',
      score: daily.bias === 'bullish' ? 8 : 0,
      confluence: { passed: daily.bias === 'bullish' ? daily.passed : 0, total: daily.total },
      fetchedAt,
    },
    {
      id: 'daily-bearish-structure',
      status: daily.bias === 'bearish' ? 'red' : 'none',
      score: daily.bias === 'bearish' ? -8 : 0,
      confluence: { passed: daily.bias === 'bearish' ? daily.passed : 0, total: daily.total },
      fetchedAt,
    },
  ];
}

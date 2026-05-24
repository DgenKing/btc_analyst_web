import { Kline, SignalState } from '@/types/signals';
import { detectStructure } from './structure';
import { findPivots } from './supportResistance';
import { detectRange } from './range';

/**
 * Multi-timeframe signals computed from weekly + daily klines.
 * Covers: macro trend, weekly S/R reactions, daily-range proximity, daily break/down.
 */
export function getMultiTimeframeSignals(klinesD: Kline[], klinesW: Kline[]): SignalState[] {
  const fetchedAt = Date.now();
  const out: SignalState[] = [];

  // --- Macro trend (weekly structure) ---
  const macro = klinesW.length >= 20
    ? detectStructure(klinesW, 12)
    : { bias: 'neutral' as const, passed: 0, total: 5 };

  out.push(
    {
      id: 'macro-uptrend',
      status: macro.bias === 'bullish' ? 'green' : 'none',
      score: macro.bias === 'bullish' ? 10 : 0,
      confluence: { passed: macro.bias === 'bullish' ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'macro-downtrend',
      status: macro.bias === 'bearish' ? 'red' : 'none',
      score: macro.bias === 'bearish' ? -10 : 0,
      confluence: { passed: macro.bias === 'bearish' ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'macro-range',
      status: macro.bias === 'neutral' ? 'yellow' : 'none',
      score: 0,
      confluence: { passed: macro.bias === 'neutral' ? 1 : 0, total: 1 },
      fetchedAt,
    },
  );

  // --- Weekly S/R reactions ---
  // Use weekly pivots, check if current daily close is reacting to a weekly level
  if (klinesW.length > 10) {
    const { highs: wHighs, lows: wLows } = findPivots(klinesW, 3);
    const lastClose = klinesD[klinesD.length - 1].close;
    const wLowsBelow = wLows.filter(l => l < lastClose);
    const wHighsAbove = wHighs.filter(h => h > lastClose);
    const nearestWSup = wLowsBelow.length > 0 ? Math.max(...wLowsBelow) : lastClose * 0.5;
    const nearestWRes = wHighsAbove.length > 0 ? Math.min(...wHighsAbove) : lastClose * 1.5;
    const distWSup = (lastClose - nearestWSup) / lastClose;
    const distWRes = (nearestWRes - lastClose) / lastClose;

    // Weekly support holding: within 5% AND last weekly candle's low touched it but closed back above
    const lastWeekly = klinesW[klinesW.length - 1];
    const weeklySupportHolding = distWSup < 0.05
      && lastWeekly.low <= nearestWSup * 1.02
      && lastWeekly.close > nearestWSup;
    const weeklyResistanceRejecting = distWRes < 0.05
      && lastWeekly.high >= nearestWRes * 0.98
      && lastWeekly.close < nearestWRes;

    out.push(
      {
        id: 'weekly-support-holding',
        status: weeklySupportHolding ? 'green' : 'none',
        value: nearestWSup.toFixed(0),
        score: weeklySupportHolding ? 8 : 0,
        confluence: { passed: weeklySupportHolding ? 1 : 0, total: 1 },
        fetchedAt,
      },
      {
        id: 'weekly-resistance-rejecting',
        status: weeklyResistanceRejecting ? 'red' : 'none',
        value: nearestWRes.toFixed(0),
        score: weeklyResistanceRejecting ? -8 : 0,
        confluence: { passed: weeklyResistanceRejecting ? 1 : 0, total: 1 },
        fetchedAt,
      },
    );
  } else {
    out.push(
      { id: 'weekly-support-holding', status: 'none', score: 0, confluence: { passed: 0, total: 1 }, fetchedAt },
      { id: 'weekly-resistance-rejecting', status: 'none', score: 0, confluence: { passed: 0, total: 1 }, fetchedAt },
    );
  }

  // --- Daily range proximity (different from generic range — looks at a 30d daily range) ---
  const dailyRange = detectRange(klinesD, 30);
  if (dailyRange) {
    const { high, low, lastClose } = dailyRange;
    const distHigh = (high - lastClose) / lastClose;
    const distLow = (lastClose - low) / lastClose;
    const rangeSupportHolding = distLow < 0.04 && lastClose > low;
    const rangeResistanceRejecting = distHigh < 0.04 && lastClose < high;
    const breakout = lastClose > high * 1.001;
    const breakdown = lastClose < low * 0.999;

    out.push(
      {
        id: 'daily-range-support-holding',
        status: rangeSupportHolding ? 'green' : 'none',
        value: low.toFixed(0),
        score: rangeSupportHolding ? 8 : 0,
        confluence: { passed: rangeSupportHolding ? 1 : 0, total: 1 },
        fetchedAt,
      },
      {
        id: 'daily-range-resistance-rejecting',
        status: rangeResistanceRejecting ? 'red' : 'none',
        value: high.toFixed(0),
        score: rangeResistanceRejecting ? -8 : 0,
        confluence: { passed: rangeResistanceRejecting ? 1 : 0, total: 1 },
        fetchedAt,
      },
      {
        id: 'daily-breakout',
        status: breakout ? 'green' : 'none',
        value: high.toFixed(0),
        score: breakout ? 8 : 0,
        confluence: { passed: breakout ? 1 : 0, total: 1 },
        fetchedAt,
      },
      {
        id: 'daily-breakdown',
        status: breakdown ? 'red' : 'none',
        value: low.toFixed(0),
        score: breakdown ? -8 : 0,
        confluence: { passed: breakdown ? 1 : 0, total: 1 },
        fetchedAt,
      },
    );
  }

  return out;
}

import { Kline, SignalState } from '@/types/signals';
import { detectStructure } from './structure';
import { findPivots } from './supportResistance';
import { detectRange } from './range';

/**
 * 4H + 12H setup-trigger signals.
 * These are the trade-confirmation tier — where actual setups trigger within hours, not once daily.
 */
export function getTriggerSignals(klines4H: Kline[], klines12H: Kline[]): SignalState[] {
  const fetchedAt = Date.now();
  const out: SignalState[] = [];

  // Guard for insufficient data
  if (klines4H.length < 30 || klines12H.length < 20) {
    return [
      'trig-4h-support-reclaim', 'trig-4h-resistance-reject',
      'trig-4h-breakout', 'trig-4h-breakdown',
      'trig-4h-momentum-up', 'trig-4h-momentum-down',
      'trig-12h-trend-up', 'trig-12h-trend-down',
    ].map(id => ({
      id,
      status: 'none' as const,
      score: 0,
      confluence: { passed: 0, total: 1 },
      fetchedAt,
    }));
  }

  const last4H = klines4H[klines4H.length - 1];
  const last4HClose = last4H.close;
  const prior5_4H = klines4H.slice(-6, -1);

  // --- 4H PIVOTS & PROXIMITY ---
  const { highs: h4Highs, lows: h4Lows } = findPivots(klines4H, 6);
  const h4SupportsBelow = h4Lows.filter(l => l < last4HClose);
  const h4ResistancesAbove = h4Highs.filter(h => h > last4HClose);
  const h4NearestSup = h4SupportsBelow.length > 0 ? Math.max(...h4SupportsBelow) : last4HClose * 0.9;
  const h4NearestRes = h4ResistancesAbove.length > 0 ? Math.min(...h4ResistancesAbove) : last4HClose * 1.1;

  const h4DistSup = (last4HClose - h4NearestSup) / last4HClose;
  const h4DistRes = (h4NearestRes - last4HClose) / last4HClose;

  // trig-4h-support-reclaim: recent low swept support, closed back above
  const h4RecentLow = Math.min(...prior5_4H.map(k => k.low), last4H.low);
  const h4SupportReclaim = h4DistSup < 0.015
    && h4RecentLow <= h4NearestSup * 1.015
    && last4HClose > h4NearestSup;

  // trig-4h-resistance-reject: recent high tagged resistance, closed back below
  const h4RecentHigh = Math.max(...prior5_4H.map(k => k.high), last4H.high);
  const h4ResistanceReject = h4DistRes < 0.015
    && h4RecentHigh >= h4NearestRes * 0.985
    && last4HClose < h4NearestRes;

  out.push(
    {
      id: 'trig-4h-support-reclaim',
      status: h4SupportReclaim ? 'green' : 'none',
      value: h4NearestSup.toFixed(0),
      score: h4SupportReclaim ? 10 : 0,
      confluence: { passed: h4SupportReclaim ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'trig-4h-resistance-reject',
      status: h4ResistanceReject ? 'red' : 'none',
      value: h4NearestRes.toFixed(0),
      score: h4ResistanceReject ? -10 : 0,
      confluence: { passed: h4ResistanceReject ? 1 : 0, total: 1 },
      fetchedAt,
    },
  );

  // --- 4H RANGE (10 days ≈ 60 × 4H) ---
  const h4Range = detectRange(klines4H, 60);
  if (h4Range) {
    const { high: h4RangeHigh, low: h4RangeLow } = h4Range;
    const h4Breakout = last4HClose > h4RangeHigh * 1.001;
    const h4Breakdown = last4HClose < h4RangeLow * 0.999;

    out.push(
      {
        id: 'trig-4h-breakout',
        status: h4Breakout ? 'green' : 'none',
        value: h4RangeHigh.toFixed(0),
        score: h4Breakout ? 10 : 0,
        confluence: { passed: h4Breakout ? 1 : 0, total: 1 },
        fetchedAt,
      },
      {
        id: 'trig-4h-breakdown',
        status: h4Breakdown ? 'red' : 'none',
        value: h4RangeLow.toFixed(0),
        score: h4Breakdown ? -10 : 0,
        confluence: { passed: h4Breakdown ? 1 : 0, total: 1 },
        fetchedAt,
      },
    );
  } else {
    out.push(
      { id: 'trig-4h-breakout', status: 'none', score: 0, confluence: { passed: 0, total: 1 }, fetchedAt },
      { id: 'trig-4h-breakdown', status: 'none', score: 0, confluence: { passed: 0, total: 1 }, fetchedAt },
    );
  }

  // --- 4H MOMENTUM ---
  const last20Vol_4H = klines4H.slice(-20).reduce((s, k) => s + k.volume, 0) / 20;
  const h4CandleRange = last4H.high - last4H.low;
  const h4UpperThird = h4CandleRange > 0 && (last4H.close - last4H.low) / h4CandleRange > 0.66;
  const h4LowerThird = h4CandleRange > 0 && (last4H.high - last4H.close) / h4CandleRange > 0.66;
  const h4MomentumUp = last4H.close > last4H.open && last4H.volume > last20Vol_4H * 1.2 && h4UpperThird;
  const h4MomentumDown = last4H.close < last4H.open && last4H.volume > last20Vol_4H * 1.2 && h4LowerThird;

  out.push(
    {
      id: 'trig-4h-momentum-up',
      status: h4MomentumUp ? 'green' : 'none',
      score: h4MomentumUp ? 5 : 0,
      confluence: { passed: h4MomentumUp ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'trig-4h-momentum-down',
      status: h4MomentumDown ? 'red' : 'none',
      score: h4MomentumDown ? -5 : 0,
      confluence: { passed: h4MomentumDown ? 1 : 0, total: 1 },
      fetchedAt,
    },
  );

  // --- 12H TREND (lookback ~10 days) ---
  const h12Trend = detectStructure(klines12H, 20);

  out.push(
    {
      id: 'trig-12h-trend-up',
      status: h12Trend.bias === 'bullish' ? 'green' : 'none',
      score: h12Trend.bias === 'bullish' ? 8 : 0,
      confluence: { passed: h12Trend.bias === 'bullish' ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'trig-12h-trend-down',
      status: h12Trend.bias === 'bearish' ? 'red' : 'none',
      score: h12Trend.bias === 'bearish' ? -8 : 0,
      confluence: { passed: h12Trend.bias === 'bearish' ? 1 : 0, total: 1 },
      fetchedAt,
    },
  );

  return out;
}

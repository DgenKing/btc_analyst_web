import { Kline, SignalState } from '@/types/signals';

export function detectRange(klines: Kline[], lookback: number = 30) {
  if (klines.length < lookback) return null;

  const window = klines.slice(-lookback);
  const high = Math.max(...window.map(k => k.high));
  const low = Math.min(...window.map(k => k.low));
  const lastClose = klines[klines.length - 1].close;

  return { high, low, lastClose };
}

export function getRangeSignals(klines: Kline[]): SignalState[] {
  const range = detectRange(klines);
  if (!range) return [];

  const { high, low, lastClose } = range;
  const fetchedAt = Date.now();

  const distHigh = (high - lastClose) / lastClose;
  const distLow = (lastClose - low) / lastClose;

  const nearLow = distLow < 0.03;
  const nearHigh = distHigh < 0.03;
  const brokeAbove = lastClose > high;
  const brokeBelow = lastClose < low;

  // Failure back into range: did the prior 5 closes include a value above the range high or below the range low, but current is back inside?
  const prior5 = klines.slice(-6, -1);
  const priorBrokeAbove = prior5.some(k => k.close > high);
  const priorBrokeBelow = prior5.some(k => k.close < low);
  const failureBack = (priorBrokeAbove && !brokeAbove) || (priorBrokeBelow && !brokeBelow);

  return [
    {
      id: 'range-support-holding',
      status: nearLow ? 'green' : 'none',
      value: low.toFixed(0),
      score: nearLow ? 8 : 0,
      confluence: { passed: nearLow ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'range-resistance-rejecting',
      status: nearHigh ? 'red' : 'none',
      value: high.toFixed(0),
      score: nearHigh ? -8 : 0,
      confluence: { passed: nearHigh ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'break-above-range',
      status: brokeAbove ? 'green' : 'none',
      value: high.toFixed(0),
      score: brokeAbove ? 8 : 0,
      confluence: { passed: brokeAbove ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'break-below-range',
      status: brokeBelow ? 'red' : 'none',
      value: low.toFixed(0),
      score: brokeBelow ? -8 : 0,
      confluence: { passed: brokeBelow ? 1 : 0, total: 1 },
      fetchedAt,
    },
    {
      id: 'failure-back-to-range',
      status: failureBack ? 'red' : 'none',
      value: failureBack ? 'Failed break' : undefined,
      score: failureBack ? -8 : 0,
      confluence: { passed: failureBack ? 1 : 0, total: 1 },
      fetchedAt,
    },
  ];
}

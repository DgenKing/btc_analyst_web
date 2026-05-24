import { Kline, SignalState } from '@/types/signals';

export function calculateSMA(data: Kline[], period: number) {
  if (data.length < period) return null;
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
    sma.push({ time: data[i].time, value: sum / period });
  }
  return sma;
}

export function getMASignals(klines: Kline[]): SignalState[] {
  const ma20 = calculateSMA(klines, 20);
  const ma50 = calculateSMA(klines, 50);
  const ma100 = calculateSMA(klines, 100);
  const ma200 = calculateSMA(klines, 200);

  const lastClose = klines[klines.length - 1].close;
  const fetchedAt = Date.now();

  // A "support" signal is ACTIVE (green) only when price is above the MA.
  // When price is below, the signal is INACTIVE (none, score 0) — the bearish
  // case is conveyed by the separate ma200-rejection signal, not by a red dot
  // on the support card.
  const isAbove = (ma: { value: number }[] | null) =>
    ma != null && lastClose > ma[ma.length - 1].value;

  const mkSupport = (id: string, ma: { value: number }[] | null, weight: number): SignalState => {
    const active = isAbove(ma);
    return {
      id,
      status: active ? 'green' : 'none',
      value: ma?.[ma.length - 1].value.toFixed(0),
      score: active ? weight : 0,
      confluence: { passed: active ? 1 : 0, total: 1 },
      fetchedAt,
    };
  };

  const ma200Below = ma200 != null && lastClose < ma200[ma200.length - 1].value;

  return [
    mkSupport('ma20-support', ma20, 5),
    mkSupport('ma50-support', ma50, 5),
    mkSupport('ma100-support', ma100, 5),
    mkSupport('ma200-support', ma200, 10),
    {
      id: 'ma200-rejection',
      status: ma200Below ? 'red' : 'none',
      value: ma200?.[ma200.length - 1].value.toFixed(0),
      score: ma200Below ? -10 : 0,
      confluence: { passed: ma200Below ? 1 : 0, total: 1 },
      fetchedAt,
    },
  ];
}

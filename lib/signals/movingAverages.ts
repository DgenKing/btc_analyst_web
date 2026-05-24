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
  
  const getStatus = (ma: { value: number }[] | null): 'green' | 'red' | 'none' => {
    if (!ma) return 'none';
    const lastMA = ma[ma.length - 1].value;
    return lastClose > lastMA ? 'green' : 'red';
  };

  const fetchedAt = Date.now();

  const signals: SignalState[] = [
    { 
      id: 'ma20-support', 
      status: getStatus(ma20), 
      value: ma20?.[ma20.length - 1].value.toFixed(0),
      score: getStatus(ma20) === 'green' ? 5 : 0,
      confluence: { passed: getStatus(ma20) === 'green' ? 1 : 0, total: 1 },
      fetchedAt
    },
    { 
      id: 'ma50-support', 
      status: getStatus(ma50), 
      value: ma50?.[ma50.length - 1].value.toFixed(0),
      score: getStatus(ma50) === 'green' ? 5 : 0,
      confluence: { passed: getStatus(ma50) === 'green' ? 1 : 0, total: 1 },
      fetchedAt
    },
    { 
      id: 'ma100-support', 
      status: getStatus(ma100), 
      value: ma100?.[ma100.length - 1].value.toFixed(0),
      score: getStatus(ma100) === 'green' ? 5 : 0,
      confluence: { passed: getStatus(ma100) === 'green' ? 1 : 0, total: 1 },
      fetchedAt
    },
    { 
      id: 'ma200-support', 
      status: getStatus(ma200), 
      value: ma200?.[ma200.length - 1].value.toFixed(0),
      score: getStatus(ma200) === 'green' ? 10 : 0,
      confluence: { passed: getStatus(ma200) === 'green' ? 1 : 0, total: 1 },
      fetchedAt
    },
    { 
      id: 'ma200-rejection', 
      status: getStatus(ma200) === 'red' ? 'red' : 'none', 
      value: ma200?.[ma200.length - 1].value.toFixed(0),
      score: getStatus(ma200) === 'red' ? -10 : 0,
      confluence: { passed: getStatus(ma200) === 'red' ? 1 : 0, total: 1 },
      fetchedAt
    },
  ];

  return signals;
}

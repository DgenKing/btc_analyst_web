import { SignalState } from '@/types/signals';

export interface OverlaySourceData {
  status: string;
  fetchedAt?: number;
  error?: string;
  latestDayNetFlowUSD?: number;
  isConsecutive?: boolean;
  reserveRisk?: number;
  puellMultiple?: number;
}

export function getOverlaySignals(overlayData: {
  etfFlows?: OverlaySourceData;
  reserveRisk?: OverlaySourceData;
  puellMultiple?: OverlaySourceData;
}): SignalState[] {
  const { etfFlows, reserveRisk, puellMultiple } = overlayData;
  const signals: SignalState[] = [];

  // ETF Flows
  if (etfFlows?.status === 'success' && typeof etfFlows.latestDayNetFlowUSD === 'number') {
    const netFlow = etfFlows.latestDayNetFlowUSD;
    const fetchedAt = etfFlows.fetchedAt ?? Date.now();
    const isStrongIn = netFlow > 200_000_000;
    const isStrongOut = netFlow < -200_000_000;

    signals.push({
      id: 'etf-inflows-strong',
      status: isStrongIn ? 'green' : 'none',
      score: isStrongIn ? 5 : 0,
      confluence: { passed: isStrongIn ? 1 : 0, total: 1 },
      value: `$${(netFlow / 1_000_000).toFixed(1)}M`,
      fetchedAt,
    });

    signals.push({
      id: 'etf-inflows-consecutive',
      status: etfFlows.isConsecutive ? 'green' : 'none',
      score: etfFlows.isConsecutive ? 5 : 0,
      confluence: { passed: etfFlows.isConsecutive ? 1 : 0, total: 1 },
      fetchedAt,
    });

    signals.push({
      id: 'etf-outflows-strong',
      status: isStrongOut ? 'red' : 'none',
      score: isStrongOut ? -5 : 0,
      confluence: { passed: isStrongOut ? 1 : 0, total: 1 },
      value: `$${(netFlow / 1_000_000).toFixed(1)}M`,
      fetchedAt,
    });
  }

  // Reserve Risk
  if (reserveRisk?.status === 'success' && typeof reserveRisk.reserveRisk === 'number') {
    const rr = reserveRisk.reserveRisk;
    const fetchedAt = reserveRisk.fetchedAt ?? Date.now();
    const isLow = rr < 0.002;
    signals.push({
      id: 'reserve-risk-low',
      status: isLow ? 'green' : 'none',
      score: isLow ? 4 : 0,
      confluence: { passed: isLow ? 1 : 0, total: 1 },
      value: rr.toFixed(6),
      fetchedAt,
    });
  }

  // Puell Multiple
  if (puellMultiple?.status === 'success' && typeof puellMultiple.puellMultiple === 'number') {
    const pm = puellMultiple.puellMultiple;
    const fetchedAt = puellMultiple.fetchedAt ?? Date.now();
    const isLow = pm < 0.5;
    signals.push({
      id: 'puell-multiple-low',
      status: isLow ? 'green' : 'none',
      score: isLow ? 3 : 0,
      confluence: { passed: isLow ? 1 : 0, total: 1 },
      value: pm.toFixed(4),
      fetchedAt,
    });
  }

  return signals;
}

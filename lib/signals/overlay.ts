import { SignalState } from '@/types/signals';

interface OverlaySourceData {
  status: string;
  fetchedAt: number;
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
  if (etfFlows?.status === 'success') {
    const netFlow = etfFlows.latestDayNetFlowUSD;
    signals.push({
      id: 'etf-inflows-strong',
      status: netFlow > 200_000_000 ? 'green' : 'none',
      score: netFlow > 200_000_000 ? 5 : 0,
      confluence: { passed: netFlow > 200_000_000 ? 1 : 0, total: 1 },
      value: `$${(netFlow / 1_000_000).toFixed(1)}M`,
      fetchedAt: etfFlows.fetchedAt,
    });
    
    // Consecutive inflows (simplified logic for v1.5)
    signals.push({
      id: 'etf-inflows-consecutive',
      status: etfFlows.isConsecutive ? 'green' : 'none',
      score: etfFlows.isConsecutive ? 5 : 0,
      confluence: { passed: etfFlows.isConsecutive ? 1 : 0, total: 1 },
      fetchedAt: etfFlows.fetchedAt,
    });

    signals.push({
      id: 'etf-outflows-strong',
      status: netFlow < -200_000_000 ? 'red' : 'none',
      score: netFlow < -200_000_000 ? -5 : 0,
      confluence: { passed: netFlow < -200_000_000 ? 1 : 0, total: 1 },
      value: `$${(netFlow / 1_000_000).toFixed(1)}M`,
      fetchedAt: etfFlows.fetchedAt,
    });
  }

  // Reserve Risk
  if (reserveRisk?.status === 'success') {
    const rr = reserveRisk.reserveRisk;
    signals.push({
      id: 'reserve-risk-low',
      status: rr < 0.002 ? 'green' : 'none',
      score: rr < 0.002 ? 4 : 0,
      confluence: { passed: rr < 0.002 ? 1 : 0, total: 1 },
      value: rr.toFixed(6),
      fetchedAt: reserveRisk.fetchedAt,
    });
  }

  // Puell Multiple
  if (puellMultiple?.status === 'success') {
    const pm = puellMultiple.puellMultiple;
    signals.push({
      id: 'puell-multiple-low',
      status: pm < 0.5 ? 'green' : 'none',
      score: pm < 0.5 ? 3 : 0,
      confluence: { passed: pm < 0.5 ? 1 : 0, total: 1 },
      value: pm.toFixed(4),
      fetchedAt: puellMultiple.fetchedAt,
    });
  }

  return signals;
}

import { SignalState } from '@/types/signals';

export function getFundingSignals(currentFunding: { fundingRate: string }): SignalState[] {
  const rate = parseFloat(currentFunding.fundingRate);
  const fetchedAt = Date.now();
  
  const isNeutral = rate >= 0 && rate <= 0.0001;
  const isNegative = rate < 0;
  const isPositive = rate > 0.0001;

  return [
    { 
      id: 'funding-neutral', 
      status: isNeutral ? 'green' : 'none', 
      value: `${(rate * 100).toFixed(4)}%`,
      score: isNeutral ? 4 : 0,
      confluence: { passed: isNeutral ? 1 : 0, total: 1 },
      fetchedAt
    },
    { 
      id: 'funding-negative-support', 
      status: isNegative ? 'green' : 'none', 
      value: `${(rate * 100).toFixed(4)}%`,
      score: isNegative ? 4 : 0,
      confluence: { passed: isNegative ? 1 : 0, total: 1 },
      fetchedAt
    },
    { 
      id: 'funding-positive-resistance', 
      status: isPositive ? 'red' : 'none', 
      value: `${(rate * 100).toFixed(4)}%`,
      score: isPositive ? -4 : 0,
      confluence: { passed: isPositive ? 1 : 0, total: 1 },
      fetchedAt
    },
  ];
}

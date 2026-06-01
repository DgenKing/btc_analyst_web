import { SignalState } from '@/types/signals';

/**
 * Funding signals. `rate` must be expressed on an 8h basis (the threshold 0.0001
 * is calibrated to an 8-hour funding rate). `sourceLabel` names the exchange the
 * rate was taken from, so the displayed value shows which venue is dominant.
 */
export function getFundingSignals(
  currentFunding: { fundingRate: string },
  sourceLabel?: string
): SignalState[] {
  const rate = parseFloat(currentFunding.fundingRate);
  const fetchedAt = Date.now();

  const isNeutral = rate >= 0 && rate <= 0.0001;
  const isNegative = rate < 0;
  const isPositive = rate > 0.0001;

  const value = `${(rate * 100).toFixed(4)}%${sourceLabel ? ` (${sourceLabel})` : ''}`;

  return [
    {
      id: 'funding-neutral',
      status: isNeutral ? 'green' : 'none',
      value,
      score: isNeutral ? 4 : 0,
      confluence: { passed: isNeutral ? 1 : 0, total: 1 },
      fetchedAt
    },
    {
      id: 'funding-negative-support',
      status: isNegative ? 'green' : 'none',
      value,
      score: isNegative ? 4 : 0,
      confluence: { passed: isNegative ? 1 : 0, total: 1 },
      fetchedAt
    },
    {
      id: 'funding-positive-resistance',
      status: isPositive ? 'red' : 'none',
      value,
      score: isPositive ? -4 : 0,
      confluence: { passed: isPositive ? 1 : 0, total: 1 },
      fetchedAt
    },
  ];
}

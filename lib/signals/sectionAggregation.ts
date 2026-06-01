import { SignalSection, SignalState, SectionVerdict } from '@/types/signals';

export function computeSectionVerdict(
  section: SignalSection,
  states: SignalState[]
): SectionVerdict {
  const sectionStates = section.signals
    .map(s => states.find(st => st.id === s.id))
    .filter((s): s is SignalState => s !== undefined);

  const netScore = sectionStates.reduce((sum, s) => sum + (s.score ?? 0), 0);

  // Compute per-direction max score for this section.
  // NOTE: exclusive groups are intentionally NOT collapsed here. Within a single
  // section the directional signals are independent and can fire together
  // (e.g. resistance-rejection + failure-reclaim + breakdown all at once), so the
  // section denominator is simply the sum of weights on each side. The exclusive-
  // group collapse only applies to the GLOBAL denominator in confluence.ts, where
  // bull/bear location scenarios across the whole catalogue are mutually exclusive.
  let bullMax = 0;
  let bearMax = 0;

  for (const signal of section.signals) {
    const weight = signal.weight ?? 0;
    const direction = signal.direction ?? signal.bias;

    if (direction === 'bull' || direction === 'bullish') {
      bullMax += weight;
    } else if (direction === 'bear' || direction === 'bearish') {
      bearMax += weight;
    }
  }

  // Normalize by the appropriate direction's max, clamped to 100%
  const denom = netScore >= 0 ? bullMax : bearMax;
  const confidencePercent = denom > 0
    ? Math.min(100, Math.round(Math.abs(netScore) / denom * 100))
    : 0;

  const direction: SectionVerdict['direction'] =
    netScore > 0 ? 'bullish' :
    netScore < 0 ? 'bearish' :
    'neutral';

  const activeCount = sectionStates.filter(s => (s.score ?? 0) !== 0).length;
  const bullishActiveCount = sectionStates.filter(s => (s.score ?? 0) > 0).length;
  const bearishActiveCount = sectionStates.filter(s => (s.score ?? 0) < 0).length;

  return {
    sectionId: section.id,
    direction,
    confidencePercent,
    netScore,
    maxPossibleScore: netScore >= 0 ? bullMax : bearMax,
    activeCount,
    bullishActiveCount,
    bearishActiveCount,
    totalCount: section.signals.length,
  };
}

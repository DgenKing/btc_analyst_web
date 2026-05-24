import { SignalSection, SignalState, SectionVerdict } from '@/types/signals';

export function computeSectionVerdict(
  section: SignalSection,
  states: SignalState[]
): SectionVerdict {
  const sectionStates = section.signals
    .map(s => states.find(st => st.id === s.id))
    .filter((s): s is SignalState => s !== undefined);

  const netScore = sectionStates.reduce((sum, s) => sum + (s.score ?? 0), 0);
  const maxPossibleScore = section.signals.reduce((sum, s) => sum + (s.weight ?? 0), 0);
  const confidencePercent = maxPossibleScore > 0
    ? Math.round(Math.abs(netScore) / maxPossibleScore * 100)
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
    maxPossibleScore,
    activeCount,
    bullishActiveCount,
    bearishActiveCount,
    totalCount: section.signals.length,
  };
}

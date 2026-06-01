import { SignalState } from '@/types/signals';
import { signalSections } from '@/data/signals';
import { getRecommendation } from './recommendations';

/**
 * Compute per-direction max scores, accounting for exclusive groups.
 * Within each exclusive group, only the single largest weight counts (since
 * only one member can fire). Ungrouped signals add their full weight.
 */
function computeMaxScores() {
  const exclusiveGroups = new Map<string, number[]>();
  let bullMax = 0;
  let bearMax = 0;

  for (const section of signalSections) {
    for (const signal of section.signals) {
      const weight = signal.weight ?? 0;
      const direction = signal.direction ?? signal.bias;
      const group = signal.exclusiveGroup;

      if (group) {
        // Track this weight in the exclusive group
        if (!exclusiveGroups.has(group)) {
          exclusiveGroups.set(group, []);
        }
        exclusiveGroups.get(group)!.push(weight);
      } else {
        // Ungrouped: add full weight to appropriate side
        if (direction === 'bull' || direction === 'bullish') {
          bullMax += weight;
        } else if (direction === 'bear' || direction === 'bearish') {
          bearMax += weight;
        }
      }
    }
  }

  // For each exclusive group, add only the max weight to both sides
  // (both sides can use the same group, but only one member fires)
  for (const weights of exclusiveGroups.values()) {
    const maxInGroup = Math.max(...weights);
    // Add max once to bullish context (as potential bullish weight)
    bullMax += maxInGroup;
    // Add max once to bearish context (as potential bearish weight)
    bearMax += maxInGroup;
  }

  return { bullMax, bearMax };
}

const { bullMax, bearMax } = computeMaxScores();

export function computeMasterScorecard(states: SignalState[]) {
  const totalScore = states.reduce((sum, s) => sum + s.score, 0);
  const bullishActive = states.filter(s => s.score > 0).length;
  const bearishActive = states.filter(s => s.score < 0).length;

  // Normalize by the side of the actual score
  const denom = totalScore >= 0 ? bullMax : bearMax;
  const rawPct = denom > 0 ? (totalScore / denom) * 100 : 0;
  const confidencePercent = Math.max(-100, Math.min(100, Math.round(rawPct)));

  // Thresholds: now ±10/±30/±55 are realistically reachable
  const bias = (() => {
    if (confidencePercent >= 55) return 'Very Strong Bullish';
    if (confidencePercent >= 30) return 'Strong Bullish';
    if (confidencePercent >= 10) return 'Bullish Lean';
    if (confidencePercent <= -55) return 'Very Strong Bearish';
    if (confidencePercent <= -30) return 'Strong Bearish';
    if (confidencePercent <= -10) return 'Bearish Lean';
    return 'Neutral';
  })();

  const action = getRecommendation(confidencePercent, totalScore);

  return {
    bias,
    totalScore,
    confidencePercent,
    maxBullish: bullMax,
    maxBearish: bearMax,
    bullishActive,
    bearishActive,
    action,
  };
}

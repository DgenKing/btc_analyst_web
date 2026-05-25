import { SignalState } from '@/types/signals';
import { signalSections } from '@/data/signals';

/**
 * The theoretical maximum directional score, computed from the catalogue's
 * weights. If every signal in the catalogue fired in the same direction at full
 * strength, the totalScore could reach +MAX or -MAX. This is the denominator
 * we use to convert the raw signed score into a -100% / +100% confidence
 * percentage that the UI can show on a bar with truthful labels.
 *
 * Currently 420 across 57 signals.
 */
const MAX_POSSIBLE_SCORE = signalSections.reduce(
  (sum, section) => sum + section.signals.reduce((s, sig) => s + (sig.weight ?? 0), 0),
  0,
);

export function computeMasterScorecard(states: SignalState[]) {
  const totalScore = states.reduce((sum, s) => sum + s.score, 0);
  const bullishActive = states.filter(s => s.score > 0).length;
  const bearishActive = states.filter(s => s.score < 0).length;

  // Normalized -100 to +100. This is the number the UI bar represents.
  const rawPct = MAX_POSSIBLE_SCORE > 0 ? (totalScore / MAX_POSSIBLE_SCORE) * 100 : 0;
  const confidencePercent = Math.max(-100, Math.min(100, Math.round(rawPct)));
  const absPct = Math.abs(confidencePercent);

  // Thresholds expressed as percent of max so they remain meaningful regardless
  // of how many signals are added/removed in future.
  //   <10%  Neutral       — no edge
  //   10-30 Lean          — directional bias, not conviction
  //   30-55 Strong        — meaningful confluence
  //   55+   Very Strong   — rare full-alignment scenario
  const bias = (() => {
    if (confidencePercent >= 55) return 'Very Strong Bullish';
    if (confidencePercent >= 30) return 'Strong Bullish';
    if (confidencePercent >= 10) return 'Bullish Lean';
    if (confidencePercent <= -55) return 'Very Strong Bearish';
    if (confidencePercent <= -30) return 'Strong Bearish';
    if (confidencePercent <= -10) return 'Bearish Lean';
    return 'Neutral';
  })();

  const action = (() => {
    if (confidencePercent >= 45 && bullishActive >= 12)
      return 'High-probability long — execute on confirmation';
    if (confidencePercent >= 25) return 'Lean long — wait for entry trigger';
    if (confidencePercent <= -45 && bearishActive >= 12)
      return 'High-probability short — execute on confirmation';
    if (confidencePercent <= -25) return 'Lean short — wait for entry trigger';
    if (absPct < 10) return 'No trade — insufficient confluence';
    return 'Watch — mixed signals';
  })();

  return {
    bias,
    totalScore,            // raw signed sum (kept for reference / tooltips)
    confidencePercent,     // -100 to +100, what the bar shows
    maxPossibleScore: MAX_POSSIBLE_SCORE,
    bullishActive,
    bearishActive,
    action,
  };
}

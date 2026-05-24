import { SignalState } from '@/types/signals';

export function computeMasterScorecard(states: SignalState[]) {
  const totalScore = states.reduce((sum, s) => sum + s.score, 0);
  const bullishActive = states.filter(s => s.score > 0).length;
  const bearishActive = states.filter(s => s.score < 0).length;

  const bias = (() => {
    if (totalScore >= 30) return 'Strong Bullish';
    if (totalScore >= 10) return 'Bullish Lean';
    if (totalScore <= -30) return 'Strong Bearish';
    if (totalScore <= -10) return 'Bearish Lean';
    return 'Neutral';
  })();

  const action = (() => {
    if (totalScore >= 40 && bullishActive >= 12) return 'High-probability long — execute on confirmation';
    if (totalScore >= 20) return 'Lean long — wait for entry trigger';
    if (totalScore <= -40 && bearishActive >= 12) return 'High-probability short — execute on confirmation';
    if (totalScore <= -20) return 'Lean short — wait for entry trigger';
    if (Math.abs(totalScore) < 10) return 'No trade — insufficient confluence';
    return 'Watch — mixed signals';
  })();

  return { bias, totalScore, bullishActive, bearishActive, action };
}

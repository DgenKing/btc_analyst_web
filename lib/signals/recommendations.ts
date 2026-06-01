/**
 * Recommended-action engine.
 *
 * The conviction % is a discrete value (it hops in chunks as whole signals fire),
 * so we don't key lines to exact percentages. Instead we bucket the reading into
 * 7 bands and keep a deep pool of lines per band. Selection is DETERMINISTIC off
 * the raw score, so the displayed line is "stable per conviction level" — it only
 * changes when the actual reading moves, not on every refresh.
 *
 * Tone: recommend without fully committing (lean / watch / wait for the trigger),
 * reference concrete 4H/12H triggers, and keep it light. Cameos: Michael Saylor,
 * Inverse Cramer, Peter Schiff, PlanB — and Raphaela Rigo (complimentary only).
 */

type Band =
  | 'very-strong-bullish'
  | 'strong-bullish'
  | 'bullish-lean'
  | 'neutral'
  | 'bearish-lean'
  | 'strong-bearish'
  | 'very-strong-bearish';

function pickBand(confidencePercent: number): Band {
  if (confidencePercent >= 55) return 'very-strong-bullish';
  if (confidencePercent >= 30) return 'strong-bullish';
  if (confidencePercent >= 10) return 'bullish-lean';
  if (confidencePercent <= -55) return 'very-strong-bearish';
  if (confidencePercent <= -30) return 'strong-bearish';
  if (confidencePercent <= -10) return 'bearish-lean';
  return 'neutral';
}

const POOLS: Record<Band, string[]> = {
  'very-strong-bullish': [
    "Stacked confluence to the upside. Execute on confirmation — but scale in, don't market-buy the wick. Saylor already did that for you.",
    "The kind of read that makes Peter Schiff quietly check the BTC price. High-probability long; confirm the entry, then commit.",
    "Green across the board. Don't chase the candle that already left — wait for a clean retest, then size up.",
    "Raphaela Rigo would've mapped this level days ago. Respect the structure: long on confirmation, invalidation tight.",
    "Strong long setup. PlanB is dusting off the rainbow chart. Enter on a pullback into support, not on emotion.",
    "Cramer just told his viewers to sell. You know what that means. Lean long — confirm and execute.",
    "Maximum confluence. Saylor's laser eyes are glowing. Still: define your stop before you define your dreams.",
    "Everything lines up bullish. The only mistake here is overleveraging. One clean entry is enough.",
    "High conviction up. Let price reclaim and hold the 4H level, then commit. No reclaim, no party.",
    "The tape is screaming long. Schiff is buying more gold out of spite. Take it on confirmation, not FOMO.",
    "Textbook bullish stack. Enter the retest, trail your stop, let the position breathe. Don't fiddle.",
    "A 'one good trade a week' setup. Confirm, size sensibly, channel your inner Saylor: conviction, not gambling.",
    "Strong upside edge. Need a second opinion? Cramer's bearish — so we're good. Long on confirmation.",
    "Confluence maxed to the upside. Patience on entry still wins: wait for the candle close, then commit.",
  ],
  'strong-bullish': [
    "Solid long bias. Not a slam dunk — wait for price to confirm at support before committing real size.",
    "Bulls have the ball. Lean long on a clean retest. Saylor wouldn't wait, but Saylor never sells either.",
    "Good upside edge building. Let the 4H trigger fire (reclaim/breakout) before you pull the trigger yourself.",
    "Leaning long. Raphaela Rigo's read: respect the level, enter on confirmation, don't pre-empt the move.",
    "Bullish structure firming up. Scale in on strength, keep a stop you can actually live with.",
    "Decent long setup. Cramer's nervous, which is encouraging. Confirm the entry and don't overstay.",
    "Upside favored. PlanB is feeling vindicated again. Lean long, but let the market prove it first.",
    "Strong-ish bullish lean. Wait for a pullback into support — chasing here is how you donate to the book.",
    "Buyers in control. Enter on confirmation, trail your stop, ignore the noise on your timeline.",
    "Good edge long. Schiff is still bearish, so the floor is probably in. Confirm, then commit modest size.",
    "Bullish but not euphoric. Take the trade on a clean trigger, skip it if price won't confirm.",
    "Leaning long with conviction. One disciplined entry beats five impulsive ones. Wait for the setup.",
    "Upside bias intact. Let 4H structure reclaim and hold, then size in. No reclaim = stay flat.",
    "Strong long lean. The setup's there; your job is to wait for the entry, not to predict the future.",
  ],
  'bullish-lean': [
    "Mild long lean. Not enough to bet the farm — watch for a 4H reclaim before doing anything.",
    "Slight bullish tilt. Be patient: let price come to support. A 'watch', not a 'send it'.",
    "Leaning long, lightly. Even Saylor would tell you to wait here (he wouldn't, but he should).",
    "Faint upside edge. Raphaela Rigo would let the chart confirm before acting — so should you.",
    "Bulls slightly ahead. No trade yet; mark your level and wait for the trigger to actually fire.",
    "Mild long bias. Cramer hasn't said anything dumb yet, so stay alert and let the setup mature.",
    "Soft bullish lean. PlanB says wait for the next halving; you can wait for the next 4H close.",
    "Tilting long but unconfirmed. Patience. Keep powder dry until structure proves itself.",
    "Slight upside. Reconnaissance, not execution. Watch support, wait for the reclaim.",
    "Gentle bull lean. Schiff is still wrong, but that alone isn't a trade. Wait for confirmation.",
    "Lightly long-biased. No FOMO — the edge is thin. Let the 4H trigger decide for you.",
    "Mild bullish read. Sit on your hands, mark your entry, and let price do the work.",
    "Faint long tilt. One clean trigger and this becomes interesting. Until then: watch.",
    "Slight upside bias. The market's whispering, not shouting. Wait for it to speak clearly.",
  ],
  neutral: [
    "No edge. This is chop. The best trade right now is no trade — go touch grass.",
    "Mixed signals, no conviction. Even Cramer would be confused, and that's saying something.",
    "Flat read. Capital preservation mode. Saylor's HODLing; you can sit on your hands.",
    "No confluence. Don't manufacture a setup out of boredom — that's how accounts die.",
    "Coin-flip territory. Raphaela Rigo would wait for the chart to pick a side; follow her patience.",
    "Neutral. The market hasn't decided, so neither should you. Watchlist, not order ticket.",
    "Zero edge. PlanB is staring at the rainbow chart waiting too. Patience pays here.",
    "Chop city. No trade. Protect your capital and your sanity.",
    "Balanced book, no bias. Schiff and the bulls are equally annoyed. Sit it out.",
    "Indecisive tape. The disciplined move is to do nothing and wait for confluence to build.",
    "No clear direction. Don't trade noise. One good setup beats ten boredom trades.",
    "Neutral read. Mark your levels, set alerts, close the laptop. The setup will find you.",
    "Flat. This is where overtraders lose money. Be the patient one for once.",
    "No conviction either way. The market's asking you to wait — so wait.",
  ],
  'bearish-lean': [
    "Mild short lean. Not a conviction trade — watch for a 4H rejection before acting.",
    "Slight bearish tilt. Let price tag resistance and reject. No rejection, no trade.",
    "Leaning short, lightly. Saylor isn't worried, but Saylor never is. Stay nimble.",
    "Faint downside edge. Raphaela Rigo would wait for confirmation at resistance — mirror that discipline.",
    "Bears slightly ahead. Mark the level, wait for the trigger. No FOMO shorts.",
    "Mild short bias. If Cramer says 'buy the dip' soon, we'll feel even better about it.",
    "Soft bearish lean. PlanB is in denial; you don't have to be. But wait for confirmation.",
    "Tilting short, unconfirmed. Patience — let the 4H reject before you commit a cent.",
    "Slight downside. Reconnaissance only. Watch resistance, wait for the fade.",
    "Gentle bear lean. Schiff is finally happy, which is unsettling. Confirm before you act.",
    "Lightly short-biased. Thin edge. Let the trigger fire; don't pre-empt the move.",
    "Mild bearish read. Sit tight, mark your entry at resistance, let price come to you.",
    "Faint short tilt. One clean rejection and this gets interesting. Until then: watch.",
    "Slight downside bias. The market's leaning, not committing. Neither should you — yet.",
  ],
  'strong-bearish': [
    "Solid short bias. Lean short on a clean rejection at resistance — let it tag and fail first.",
    "Bears in control. Wait for the 4H to reject resistance, then commit. Reclaim above = stand down.",
    "Good downside edge. Saylor's buying the dip; you can fade the bounce. Confirm, then enter.",
    "Leaning short with conviction. Raphaela Rigo would let resistance prove itself — enter on the fail, not the hope.",
    "Strong-ish bearish lean. Short the rejection, keep a tight stop above the level.",
    "Downside favored. Cramer just called it 'a buying opportunity' — chef's kiss. Lean short.",
    "Bearish structure firming. PlanB is quiet for once. Let price reject, then size in modestly.",
    "Good short setup. Don't chase the candle that already dumped — wait for the retest of resistance.",
    "Sellers ahead. Enter on confirmation at resistance, trail your stop, ignore the hopium.",
    "Strong bear lean. Schiff is doing a victory lap. Confirm the rejection and take the trade.",
    "Bearish but not capitulation. Short the clean trigger, skip it if price reclaims.",
    "Leaning short. One disciplined entry at resistance beats panic-shorting the wick.",
    "Downside bias intact. Let resistance reject and hold, then commit. No fade, no trade.",
    "Strong short lean. The setup's there — wait for the rejection, don't predict it.",
  ],
  'very-strong-bearish': [
    "Stacked confluence to the downside. Lean short on confirmation — fade the bounce into resistance, don't chase the dump.",
    "The read where Saylor announces another buy and the chart keeps bleeding. High-probability short on the retest.",
    "Red across the board. Don't short the candle that already fell — wait for a bounce into resistance, then commit.",
    "Raphaela Rigo would've flagged this breakdown early. Respect it: short the retest, invalidation tight.",
    "Strong short setup. PlanB has gone suspiciously silent. Enter on a fade into resistance, not on emotion.",
    "Cramer just told everyone to buy. You know the drill. Lean short — confirm and execute.",
    "Maximum downside confluence. Schiff is unbearable right now. Still: define your stop before you celebrate.",
    "Everything lines up bearish. The only mistake is shorting with no stop. One clean fade is enough.",
    "High conviction down. Let price bounce and reject the 4H level, then commit. No rejection, no entry.",
    "The tape is bleeding. Saylor's averaging down; you're fading the relief rally. Confirm, then short.",
    "Textbook bearish stack. Short the retest, trail your stop, let the position work. Don't fiddle.",
    "A 'one good trade a week' short. Confirm at resistance, size sensibly, stay disciplined.",
    "Strong downside edge. Need a second opinion? Cramer's bullish — so we're set. Short on confirmation.",
    "Confluence maxed to the downside. Patience still wins: wait for the bounce to fail, then commit.",
  ],
};

/**
 * Returns a recommended-action line for the current conviction.
 * Selection is deterministic off `totalScore` so the line is stable for a given
 * reading and only rotates as the score actually moves through the band.
 */
export function getRecommendation(confidencePercent: number, totalScore: number): string {
  const band = pickBand(confidencePercent);
  const pool = POOLS[band];
  const idx = Math.abs(Math.trunc(totalScore)) % pool.length;
  return pool[idx];
}

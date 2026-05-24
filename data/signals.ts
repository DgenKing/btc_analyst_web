import { SignalSection } from '../types/signals';

export const signalSections: SignalSection[] = [
  {
    id: 'market-bias',
    title: 'Market Bias Signals',
    description: 'Higher timeframe trend and macro structure.',
    signals: [
      { id: 'btc-trending-up', title: 'BTC trending up', bias: 'bullish', meaning: 'Higher timeframe trend supports long setups.', weight: 10, subCriteriaCount: 5, sourceLabel: 'Live' },
      { id: 'btc-trending-down', title: 'BTC trending down', bias: 'bearish', meaning: 'Higher timeframe trend supports short setups or caution on longs.', weight: 10, subCriteriaCount: 5, sourceLabel: 'Live' },
      { id: 'btc-ranging', title: 'BTC ranging', bias: 'neutral', meaning: 'Focus shifts to range support, range resistance, acceptance, and rejection.', weight: 5, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'bull-market-structure', title: 'Bull market structure', bias: 'bullish', meaning: 'Higher timeframe market supports upside continuation.', weight: 10, subCriteriaCount: 3, sourceLabel: 'Live' },
      { id: 'bear-market-structure', title: 'Bear market structure', bias: 'bearish', meaning: 'Higher timeframe market supports downside continuation.', weight: 10, subCriteriaCount: 3, sourceLabel: 'Live' },
      { id: 'major-support-nearby', title: 'Major support nearby', bias: 'defensive', meaning: 'Price is approaching an important reaction zone.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'major-resistance-nearby', title: 'Major resistance nearby', bias: 'defensive', meaning: 'Price is approaching an important rejection zone.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'long-term-structure-intact', title: 'Long-term structure intact', bias: 'bullish', meaning: 'Larger trend remains valid.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'long-term-structure-broken', title: 'Long-term structure broken', bias: 'bearish', meaning: 'Larger trend may be weakening.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
    ],
  },
  {
    id: 'multi-timeframe',
    title: 'Multi-Timeframe Signals',
    description: 'Alignment across Monthly, Weekly, Daily, 4H, and 1H.',
    signals: [
      { id: 'macro-uptrend', title: 'Macro uptrend', bias: 'bullish', meaning: 'Higher timeframe trend favours longs.', weight: 10, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'macro-downtrend', title: 'Macro downtrend', bias: 'bearish', meaning: 'Higher timeframe trend favours shorts.', weight: 10, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'macro-range', title: 'Macro range', bias: 'neutral', meaning: 'Trade range boundaries rather than chasing direction.', weight: 5, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'weekly-support-holding', title: 'Major weekly support holding', bias: 'bullish', meaning: 'Larger buyers may be defending the level.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'weekly-resistance-rejecting', title: 'Major weekly resistance rejecting', bias: 'bearish', meaning: 'Larger sellers may be defending the level.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'daily-bullish-structure', title: 'Daily bullish structure', bias: 'bullish', meaning: 'Swing direction favours longs.', weight: 8, subCriteriaCount: 3, sourceLabel: 'Live' },
      { id: 'daily-bearish-structure', title: 'Daily bearish structure', bias: 'bearish', meaning: 'Swing direction favours shorts.', weight: 8, subCriteriaCount: 3, sourceLabel: 'Live' },
      { id: 'daily-range-support-holding', title: 'Daily range support holding', bias: 'bullish', meaning: 'Price is respecting lower range boundary.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'daily-range-resistance-rejecting', title: 'Daily range resistance rejecting', bias: 'bearish', meaning: 'Price is respecting upper range boundary.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'daily-breakout', title: 'Daily breakout', bias: 'bullish', meaning: 'Price is leaving a range or structure zone.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'daily-breakdown', title: 'Daily breakdown', bias: 'bearish', meaning: 'Price has lost key support.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
    ],
  },
  {
    id: 'overlay',
    title: 'Fundamental & Derivatives Overlay',
    description: 'ETF flows, funding rates, and on-chain indicators.',
    signals: [
      { id: 'etf-inflows-strong', title: 'Strong ETF net inflows', bias: 'bullish', meaning: 'Institutional demand is supporting BTC.', weight: 5, subCriteriaCount: 1, sourceLabel: 'Daily (Dune)' },
      { id: 'etf-inflows-consecutive', title: 'Several days of ETF net inflows', bias: 'bullish', meaning: 'Sustained institutional demand may support weekly bias.', weight: 5, subCriteriaCount: 1, sourceLabel: 'Daily (Dune)' },
      { id: 'etf-outflows-strong', title: 'Strong ETF net outflows', bias: 'bearish', meaning: 'Institutional demand is weakening or selling pressure is rising.', weight: 5, subCriteriaCount: 1, sourceLabel: 'Daily (Dune)' },
      { id: 'funding-neutral', title: 'Neutral funding', bias: 'neutral', meaning: 'The market is not overly crowded.', weight: 4, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'funding-negative-support', title: 'Negative funding at major support', bias: 'bullish', meaning: 'Shorts may be crowded near a possible reversal area.', weight: 4, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'funding-positive-resistance', title: 'Extremely positive funding', bias: 'caution', meaning: 'Longs may be overcrowded; flush risk rises.', weight: 4, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'reserve-risk-low', title: 'Low Reserve Risk', bias: 'bullish', meaning: 'Long-term holder confidence is strong relative to price.', weight: 4, subCriteriaCount: 1, sourceLabel: 'Daily (on-chain)' },
      { id: 'puell-multiple-low', title: 'Low Puell Multiple', bias: 'bullish', meaning: 'Miner revenue is depressed relative to normal conditions.', weight: 3, subCriteriaCount: 1, sourceLabel: 'Daily (on-chain)' },
    ],
  },
  {
    id: 'support-resistance',
    title: 'Support & Resistance',
    signals: [
      { id: 'horizontal-support', title: 'Horizontal support', bias: 'bullish', meaning: 'Stronger than diagonal support. Key long area.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'horizontal-resistance', title: 'Horizontal resistance', bias: 'bearish', meaning: 'Stronger than diagonal resistance. Key short/take-profit area.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'old-res-as-sup', title: 'Old resistance becomes support', bias: 'bullish', meaning: 'Breakout retest holds.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'old-sup-as-res', title: 'Old support becomes resistance', bias: 'bearish', meaning: 'Breakdown retest rejects.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
    ],
  },
  {
    id: 'volume-profile',
    title: 'Volume Profile',
    signals: [
      { id: 'hvn-support', title: 'High Volume Node support', bias: 'bullish', meaning: 'HVN acts as support after price returns to it.', weight: 7, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'hvn-resistance', title: 'High Volume Node resistance', bias: 'bearish', meaning: 'HVN acts as resistance from below.', weight: 7, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'poc-support', title: 'POC support', bias: 'bullish', meaning: 'Price reacts from highest-volume area.', weight: 7, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'poc-resistance', title: 'POC resistance', bias: 'bearish', meaning: 'Price rejects from highest-volume area.', weight: 7, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'above-value-area', title: 'Acceptance above value area', bias: 'bullish', meaning: 'Buyers are accepting higher prices.', weight: 7, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'below-value-area', title: 'Acceptance below value area', bias: 'bearish', meaning: 'Sellers are accepting lower prices.', weight: 7, subCriteriaCount: 1, sourceLabel: 'Live' },
    ],
  },
  {
    id: 'range-trading',
    title: 'Range Trading',
    signals: [
      { id: 'range-support-holding', title: 'Range support holding', bias: 'bullish', meaning: 'Lower range boundary is defended.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'range-resistance-rejecting', title: 'Range resistance rejecting', bias: 'bearish', meaning: 'Upper range boundary is defended.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'break-above-range', title: 'Break above range high', bias: 'bullish', meaning: 'Possible move into next higher range.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'break-below-range', title: 'Break below range low', bias: 'bearish', meaning: 'Possible move into lower range.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'failure-back-to-range', title: 'Failure back into old range', bias: 'bearish', meaning: 'Breakout failed.', weight: 8, subCriteriaCount: 1, sourceLabel: 'Live' },
    ],
  },
  {
    id: 'moving-averages',
    title: 'Moving Averages',
    signals: [
      { id: 'ma20-support', title: '20 MA support', bias: 'bullish', meaning: 'Short-term momentum is holding.', weight: 5, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'ma50-support', title: '50 MA support', bias: 'bullish', meaning: 'Medium-term trend is holding.', weight: 5, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'ma100-support', title: '100 MA support', bias: 'bullish', meaning: 'Intermediate structure is holding.', weight: 5, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'ma200-support', title: '200 MA support', bias: 'bullish', meaning: 'Major macro trend level is holding.', weight: 10, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'ma200-rejection', title: '200 MA rejection', bias: 'bearish', meaning: 'Major macro trend level is rejecting.', weight: 10, subCriteriaCount: 1, sourceLabel: 'Live' },
    ],
  },
  {
    id: 'long-setups',
    title: 'Bullish Long Setups',
    signals: [
      { id: 'long-support-holding', title: 'Support holding', bias: 'bullish', strength: 'strong', meaning: 'Primary long requirement.', weight: 10, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'long-structure-reclaim', title: 'Structure reclaim', bias: 'bullish', strength: 'strong', meaning: 'Price regains lost structure.', weight: 10, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'long-liquidity-sweep', title: 'Liquidity sweep then reclaim', bias: 'bullish', strength: 'strong', meaning: 'Strong entry signal.', weight: 10, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'long-momentum-conf', title: 'Momentum confirmation', bias: 'bullish', strength: 'strong', meaning: 'Buyers defending with strength.', weight: 5, subCriteriaCount: 1, sourceLabel: 'Live' },
    ],
  },
  {
    id: 'short-setups',
    title: 'Bearish Short Setups',
    signals: [
      { id: 'short-res-rejection', title: 'Resistance rejection', bias: 'bearish', strength: 'strong', meaning: 'Primary short requirement.', weight: 10, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'short-failure-reclaim', title: 'Failure reclaim', bias: 'bearish', strength: 'strong', meaning: 'Price cannot regain lost structure.', weight: 10, subCriteriaCount: 1, sourceLabel: 'Live' },
      { id: 'short-breakdown', title: 'Breakdown below support', bias: 'bearish', strength: 'strong', meaning: 'Key level has failed.', weight: 10, subCriteriaCount: 1, sourceLabel: 'Live' },
    ],
  },
  {
    id: 'entry-filters',
    title: 'Entry Filters',
    signals: [
      { id: 'tight-risk', title: 'Can risk be kept tight?', bias: 'neutral', strength: 'execution filter', meaning: 'Stop can be placed near invalidation.', weight: 3, subCriteriaCount: 1, sourceLabel: 'Manual' },
      { id: 'confirmation', title: 'Is there confirmation?', bias: 'neutral', strength: 'execution filter', meaning: 'Do not enter purely on touch.', weight: 3, subCriteriaCount: 1, sourceLabel: 'Manual' },
    ],
  },
];

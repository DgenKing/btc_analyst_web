import { MarketSnapshot, SignalState } from '@/types/signals';
import { SIGNAL_SOURCES } from './sources';
import { getMASignals } from '../signals/movingAverages';
import { getFundingSignals } from '../signals/funding';
import { getStructureSignals } from '../signals/structure';
import { getSRSignals } from '../signals/supportResistance';
import { getRangeSignals } from '../signals/range';
import { getMultiTimeframeSignals } from '../signals/multiTimeframe';
import { getVolumeProfileSignals } from '../signals/volumeProfile';
import { getSetupSignals } from '../signals/setups';
import { getEntryFilterSignals } from '../signals/entryFilters';
import { getOverlaySignals, OverlaySourceData } from '../signals/overlay';

export interface VerificationRow {
  sectionId: string;
  sectionTitle: string;
  id: string;
  title: string;
  status: 'green' | 'red' | 'yellow' | 'none' | 'unavailable';
  score: number;
  value: string | null;
  sourceUrl: string;
  inputs: Record<string, string | number>;
  verified: boolean;
  expected: { status: string; score: number } | null;
  fetchedAt: number;
}

export interface VerificationReport {
  generatedAt: string;
  snapshotAge: number;
  totalSignals: number;
  verifiedCount: number;
  mismatchCount: number;
  unavailableCount: number;
  rows: VerificationRow[];
}

const SECTION_MAP: Record<string, { id: string; title: string }> = {
  // Market Bias
  'btc-trending-up': { id: 'market-bias', title: 'Market Bias' },
  'btc-trending-down': { id: 'market-bias', title: 'Market Bias' },
  'btc-ranging': { id: 'market-bias', title: 'Market Bias' },
  'bull-market-structure': { id: 'market-bias', title: 'Market Bias' },
  'bear-market-structure': { id: 'market-bias', title: 'Market Bias' },
  'major-support-nearby': { id: 'market-bias', title: 'Market Bias' },
  'major-resistance-nearby': { id: 'market-bias', title: 'Market Bias' },
  'long-term-structure-intact': { id: 'market-bias', title: 'Market Bias' },
  'long-term-structure-broken': { id: 'market-bias', title: 'Market Bias' },

  // Multi-Timeframe
  'macro-uptrend': { id: 'multi-timeframe', title: 'Multi-Timeframe' },
  'macro-downtrend': { id: 'multi-timeframe', title: 'Multi-Timeframe' },
  'macro-range': { id: 'multi-timeframe', title: 'Multi-Timeframe' },
  'weekly-support-holding': { id: 'multi-timeframe', title: 'Multi-Timeframe' },
  'weekly-resistance-rejecting': { id: 'multi-timeframe', title: 'Multi-Timeframe' },
  'daily-bullish-structure': { id: 'multi-timeframe', title: 'Multi-Timeframe' },
  'daily-bearish-structure': { id: 'multi-timeframe', title: 'Multi-Timeframe' },
  'daily-range-support-holding': { id: 'multi-timeframe', title: 'Multi-Timeframe' },
  'daily-range-resistance-rejecting': { id: 'multi-timeframe', title: 'Multi-Timeframe' },
  'daily-breakout': { id: 'multi-timeframe', title: 'Multi-Timeframe' },
  'daily-breakdown': { id: 'multi-timeframe', title: 'Multi-Timeframe' },

  // Overlay
  'etf-inflows-strong': { id: 'overlay', title: 'Fundamental & Derivatives Overlay' },
  'etf-inflows-consecutive': { id: 'overlay', title: 'Fundamental & Derivatives Overlay' },
  'etf-outflows-strong': { id: 'overlay', title: 'Fundamental & Derivatives Overlay' },
  'funding-neutral': { id: 'overlay', title: 'Fundamental & Derivatives Overlay' },
  'funding-negative-support': { id: 'overlay', title: 'Fundamental & Derivatives Overlay' },
  'funding-positive-resistance': { id: 'overlay', title: 'Fundamental & Derivatives Overlay' },
  'reserve-risk-low': { id: 'overlay', title: 'Fundamental & Derivatives Overlay' },
  'puell-multiple-low': { id: 'overlay', title: 'Fundamental & Derivatives Overlay' },

  // Support / Resistance
  'horizontal-support': { id: 'support-resistance', title: 'Support / Resistance' },
  'horizontal-resistance': { id: 'support-resistance', title: 'Support / Resistance' },
  'old-res-as-sup': { id: 'support-resistance', title: 'Support / Resistance' },
  'old-sup-as-res': { id: 'support-resistance', title: 'Support / Resistance' },

  // Volume Profile
  'hvn-support': { id: 'volume-profile', title: 'Volume Profile' },
  'hvn-resistance': { id: 'volume-profile', title: 'Volume Profile' },
  'poc-support': { id: 'volume-profile', title: 'Volume Profile' },
  'poc-resistance': { id: 'volume-profile', title: 'Volume Profile' },
  'above-value-area': { id: 'volume-profile', title: 'Volume Profile' },
  'below-value-area': { id: 'volume-profile', title: 'Volume Profile' },

  // Range Trading
  'range-support-holding': { id: 'range-trading', title: 'Range Trading' },
  'range-resistance-rejecting': { id: 'range-trading', title: 'Range Trading' },
  'break-above-range': { id: 'range-trading', title: 'Range Trading' },
  'break-below-range': { id: 'range-trading', title: 'Range Trading' },
  'failure-back-to-range': { id: 'range-trading', title: 'Range Trading' },

  // Moving Averages
  'ma20-support': { id: 'moving-averages', title: 'Moving Averages' },
  'ma50-support': { id: 'moving-averages', title: 'Moving Averages' },
  'ma100-support': { id: 'moving-averages', title: 'Moving Averages' },
  'ma200-support': { id: 'moving-averages', title: 'Moving Averages' },
  'ma200-rejection': { id: 'moving-averages', title: 'Moving Averages' },

  // Long Setups
  'long-support-holding': { id: 'bullish-setups', title: 'Bullish Long Setups' },
  'long-structure-reclaim': { id: 'bullish-setups', title: 'Bullish Long Setups' },
  'long-liquidity-sweep': { id: 'bullish-setups', title: 'Bullish Long Setups' },
  'long-momentum-conf': { id: 'bullish-setups', title: 'Bullish Long Setups' },

  // Short Setups
  'short-res-rejection': { id: 'bearish-setups', title: 'Bearish Short Setups' },
  'short-failure-reclaim': { id: 'bearish-setups', title: 'Bearish Short Setups' },
  'short-breakdown': { id: 'bearish-setups', title: 'Bearish Short Setups' },

  // Entry Filters
  'tight-risk': { id: 'entry-filters', title: 'Entry Filters' },
  'confirmation': { id: 'entry-filters', title: 'Entry Filters' },
};

const TITLE_MAP: Record<string, string> = {
  'btc-trending-up': 'BTC trending up',
  'btc-trending-down': 'BTC trending down',
  'btc-ranging': 'BTC ranging',
  'bull-market-structure': 'Bull market structure',
  'bear-market-structure': 'Bear market structure',
  'major-support-nearby': 'Major support nearby',
  'major-resistance-nearby': 'Major resistance nearby',
  'long-term-structure-intact': 'Long-term structure intact',
  'long-term-structure-broken': 'Long-term structure broken',
  'macro-uptrend': 'Macro uptrend',
  'macro-downtrend': 'Macro downtrend',
  'macro-range': 'Macro range',
  'weekly-support-holding': 'Weekly support holding',
  'weekly-resistance-rejecting': 'Weekly resistance rejecting',
  'daily-bullish-structure': 'Daily bullish structure',
  'daily-bearish-structure': 'Daily bearish structure',
  'daily-range-support-holding': 'Daily range support holding',
  'daily-range-resistance-rejecting': 'Daily range resistance rejecting',
  'daily-breakout': 'Daily breakout',
  'daily-breakdown': 'Daily breakdown',
  'etf-inflows-strong': 'Strong ETF net inflows',
  'etf-inflows-consecutive': 'Consecutive ETF inflows',
  'etf-outflows-strong': 'Strong ETF net outflows',
  'funding-neutral': 'Neutral funding',
  'funding-negative-support': 'Negative funding',
  'funding-positive-resistance': 'Extremely positive funding',
  'reserve-risk-low': 'Low Reserve Risk',
  'puell-multiple-low': 'Low Puell Multiple',
  'horizontal-support': 'Horizontal support',
  'horizontal-resistance': 'Horizontal resistance',
  'old-res-as-sup': 'Old resistance becomes support',
  'old-sup-as-res': 'Old support becomes resistance',
  'hvn-support': 'HVN support',
  'hvn-resistance': 'HVN resistance',
  'poc-support': 'POC support',
  'poc-resistance': 'POC resistance',
  'above-value-area': 'Acceptance above value area',
  'below-value-area': 'Acceptance below value area',
  'range-support-holding': 'Range support holding',
  'range-resistance-rejecting': 'Range resistance rejecting',
  'break-above-range': 'Break above range',
  'break-below-range': 'Break below range',
  'failure-back-to-range': 'Failure back into range',
  'ma20-support': '20 MA support',
  'ma50-support': '50 MA support',
  'ma100-support': '100 MA support',
  'ma200-support': '200 MA support',
  'ma200-rejection': '200 MA rejection',
  'long-support-holding': 'Support holding',
  'long-structure-reclaim': 'Structure reclaim',
  'long-liquidity-sweep': 'Liquidity sweep + reclaim',
  'long-momentum-conf': 'Momentum confirmation',
  'short-res-rejection': 'Resistance rejection',
  'short-failure-reclaim': 'Failure reclaim',
  'short-breakdown': 'Breakdown below support',
  'tight-risk': 'Tight risk available',
  'confirmation': 'Confirmation present',
};

export function verifyAllSignals(
  snapshot: MarketSnapshot,
  overlayData: {
    etfFlows?: OverlaySourceData;
    reserveRisk?: OverlaySourceData;
    puellMultiple?: OverlaySourceData;
  },
  currentFunding: { fundingRate: string }
): VerificationReport {
  const { klines } = snapshot;
  const lastClose = klines.d[klines.d.length - 1].close;

  // Recompute all expected signals
  const expectedSignals: SignalState[] = [
    ...getMASignals(klines.d),
    ...getFundingSignals(currentFunding),
    ...getStructureSignals(klines.d),
    ...getSRSignals(klines.d),
    ...getRangeSignals(klines.d),
    ...getMultiTimeframeSignals(klines.d, klines.w),
    ...getVolumeProfileSignals(klines.d),
    ...getSetupSignals(klines.d, klines.h1),
    ...getEntryFilterSignals(klines.d, klines.h1),
    ...getOverlaySignals(overlayData),
  ];

  const rows: VerificationRow[] = [];
  const snapshotSignalsMap = new Map(snapshot.signals.map(s => [s.id, s]));
  const expectedSignalsMap = new Map(expectedSignals.map(s => [s.id, s]));

  // Ensure all 57 signals are accounted for
  const allSignalIds = Object.keys(SECTION_MAP);

  for (const id of allSignalIds) {
    const live = snapshotSignalsMap.get(id);
    const expected = expectedSignalsMap.get(id);
    const section = SECTION_MAP[id] || { id: 'unknown', title: 'Unknown' };

    const inputs: Record<string, string | number> = {
      price: lastClose,
    };

    // Add specific inputs based on signal type
    if (id.startsWith('ma')) {
      const period = parseInt(id.replace(/\D/g, ''));
      if (!isNaN(period)) {
        inputs.period = period;
      }
    } else if (id.startsWith('funding')) {
      inputs.fundingRate = currentFunding.fundingRate;
    } else if (id.includes('etf')) {
      inputs.netFlow = overlayData.etfFlows?.latestDayNetFlowUSD ?? 'N/A';
      inputs.consecutive = overlayData.etfFlows?.isConsecutive ? 'Yes' : 'No';
    } else if (id === 'reserve-risk-low') {
      inputs.reserveRisk = overlayData.reserveRisk?.reserveRisk ?? 'N/A';
    } else if (id === 'puell-multiple-low') {
      inputs.puellMultiple = overlayData.puellMultiple?.puellMultiple ?? 'N/A';
    }

    const verified = live && expected 
      ? (live.status === expected.status && live.score === expected.score)
      : false;

    rows.push({
      sectionId: section.id,
      sectionTitle: section.title,
      id,
      title: TITLE_MAP[id] || id,
      status: live?.status || 'none',
      score: live?.score || 0,
      value: live?.value?.toString() || null,
      sourceUrl: SIGNAL_SOURCES[id] || 'https://www.bybit.com/en/trade/spot/BTC/USDT',
      inputs,
      verified: !!verified,
      expected: expected ? { status: expected.status, score: expected.score } : null,
      fetchedAt: live?.fetchedAt || Date.now(),
    });
  }

  // Sort: Mismatches first, then by section
  rows.sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? 1 : -1;
    return a.sectionId.localeCompare(b.sectionId);
  });

  const verifiedCount = rows.filter(r => r.verified).length;
  const mismatchCount = rows.filter(r => !r.verified && r.status !== 'unavailable').length;
  const unavailableCount = rows.filter(r => r.status === 'unavailable').length;

  const snapshotDate = new Date(snapshot.lastUpdated);
  const snapshotAge = Date.now() - snapshotDate.getTime();

  return {
    generatedAt: new Date().toISOString(),
    snapshotAge,
    totalSignals: allSignalIds.length,
    verifiedCount,
    mismatchCount,
    unavailableCount,
    rows,
  };
}

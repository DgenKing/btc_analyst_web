export type Bias = 'bullish' | 'bearish' | 'neutral' | 'watch' | 'caution' | 'defensive';
export type Strength = 'strong' | 'medium' | 'weak' | 'entry filter' | 'bias filter' | 'execution filter';

export interface Signal {
  id: string;
  title: string;
  bias: Bias;
  meaning: string;
  strength?: Strength;
  weight: number;
  subCriteriaCount: number;
  sourceLabel?: string;
  direction?: 'bull' | 'bear' | 'neutral';
  exclusiveGroup?: string;
}

export interface SignalSection {
  id: string;
  title: string;
  description?: string;
  signals: Signal[];
}

export type SignalStatus = 'green' | 'red' | 'yellow' | 'none' | 'unavailable';

export interface SignalState {
  id: string;
  status: SignalStatus;
  value?: string | number;
  score: number;
  confluence: { passed: number; total: number };
  fetchedAt: number;
}

export interface SectionVerdict {
  sectionId: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidencePercent: number;
  netScore: number;
  maxPossibleScore: number;
  activeCount: number;
  bullishActiveCount: number;
  bearishActiveCount: number;
  totalCount: number;
}

export interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

export interface MarketSnapshot {
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  lastUpdated: string;
  klines: {
    d: Kline[];
    w: Kline[];
    h4: Kline[];
    h12: Kline[];
    h1: Kline[];
  };
  funding: {
    current: number;
    history?: unknown[];
  };
  openInterest: {
    current: number;
    history?: unknown[];
  };
  signals: SignalState[];
}

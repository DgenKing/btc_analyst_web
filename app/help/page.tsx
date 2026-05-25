'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { signalSections } from '@/data/signals';

// Expanded help content for all 57 signals
const signalHelpContent: Record<string, { what: string; means: string; example?: string }> = {
  // Market Bias
  'btc-trending-up': {
    what: 'This signal monitors the daily price structure and 20-day trend. It passes when at least 4 out of 5 bullish criteria are met, including positive drift, consecutive higher highs and higher lows, and price remaining above the 50 and 200 SMAs.',
    means: 'The short-term market momentum is clearly bullish. In this state, long setups generally have a higher probability of success, and traders should prefer buying pullbacks rather than trying to pick a top.',
    example: 'Active when BTC breaks above a consolidation and holds above the 20-day MA while the 50-day MA is sloping upward.'
  },
  'btc-trending-down': {
    what: 'The opposite of the trending up signal, this checks 5 bearish criteria over a 20-day window. It activates when the structure shows clear lower highs, lower lows, and sustained trading below key moving averages.',
    means: 'The path of least resistance is currently down. Short setups are favoured, and "buy the dip" strategies should be treated with extreme caution as momentum is working against them.',
    example: 'Triggered when a breakdown below a major daily level is confirmed by a loss of the 50-day SMA.'
  },
  'btc-ranging': {
    what: 'This signal activates when the market lacks a clear directional trend according to our 20-day criteria. Neither bullish nor bearish metrics dominate the price action.',
    means: 'The market is in a period of indecision or consolidation. Instead of chasing breakouts, traders should look to trade the boundaries of the range—buying support and selling resistance.',
    example: 'Active when price bounces between a well-defined floor and ceiling for two weeks without making a new monthly high or low.'
  },
  'bull-market-structure': {
    what: 'A longer-term trend indicator using a 60-day lookback. It evaluates macro structure to determine if the multi-month trend remains healthy and bullish.',
    means: 'The broader macro picture is supportive of higher prices. This suggests that mid-term pullbacks are likely opportunities to add to positions rather than signs of a trend reversal.',
    example: 'Remains active throughout a multi-month rally as long as the 60-day higher low structure remains intact.'
  },
  'bear-market-structure': {
    what: 'Evaluates the 60-day macro structure for bearish dominance. It tracks whether the multi-month price action is consistently producing lower peaks and troughs.',
    means: 'The primary macro trend is bearish. Relieving rallies (bounces) are typically considered selling opportunities or "exit pumps" until a structural reclaim occurs.',
    example: 'Active during sustained downtrends where every attempt to reclaim the 200-day SMA fails.'
  },
  'major-support-nearby': {
    what: 'Identifies if the current price is within 5% of a significant swing-low pivot detected on the daily chart.',
    means: 'Price is approaching a "defensive zone" where buyers have historically stepped in. This provides a clear area for potential long entries with a defined invalidation level (tight stop) just below the support.',
    example: 'Price drops to $62,000 while the previous major swing low was at $60,000.'
  },
  'major-resistance-nearby': {
    what: 'Identifies if the current price is within 5% of a significant swing-high pivot on the daily chart.',
    means: 'Price is nearing a "rejection zone" where sellers are likely to increase pressure. Long positions should consider taking profits here, and aggressive traders might look for short setups.',
    example: 'BTC rallies toward $72,000 after a previous rejection at $73,800.'
  },
  'long-term-structure-intact': {
    what: 'Checks if price is above the 200-day midpoint and if the most recent 30-day swing low is significantly higher than the 200-day low.',
    means: 'The overall macro cycle has not been compromised. Despite any short-term volatility, the underlying bull market remains healthy and dips are generally buyable.',
    example: 'A 15% correction occurs, but price stays comfortably above the 200-day SMA and previous cycle lows.'
  },
  'long-term-structure-broken': {
    what: 'Triggers when price falls below the 200-day midpoint and loses the recent 30-day swing low.',
    means: 'Significant macro damage has occurred. This often signals a shift in the primary market cycle, and any rallies should be treated as bear-market bounces until the structure is rebuilt.',
    example: 'BTC loses the 200-day SMA and the prior months support level simultaneously.'
  },

  // Multi-Timeframe
  'macro-uptrend': {
    what: 'Applies our 5-criteria trend structure to the weekly timeframe with a 12-week lookback period.',
    means: 'The "Big Picture" is pointing up. Trading in the direction of the weekly trend provides a massive tailwind for daily and hourly setups.',
    example: 'Active when the weekly chart shows a clean series of higher closes over the last quarter.'
  },
  'macro-downtrend': {
    what: 'Applies our 5-criteria trend structure to the weekly timeframe with a 12-week lookback period for bearish signals.',
    means: 'The macro environment is hostile. Long setups are counter-trend and carry much higher risk; shorts are aligned with the dominant weekly momentum.',
    example: 'Confirmed when BTC closes several weekly candles below the weekly 20-period EMA.'
  },
  'macro-range': {
    what: 'Activated when the weekly timeframe structure is mixed or directionless.',
    means: 'The multi-week direction is undecided. Traders should avoid heavy directional bias and instead focus on playing the extremes of the weekly range.',
    example: 'Occurs when the weekly chart shows alternating red and green candles within a sideways consolidation.'
  },
  'weekly-support-holding': {
    what: 'Price is within 5% of a weekly pivot low, and the current weekly candle has touched this level but stayed above it.',
    means: 'Large-scale institutional buyers are defending a major price floor. This is one of the highest-conviction bullish signals in the framework.',
    example: 'BTC wicks down to $50,000 (a weekly level) and immediately bounces back to $53,000.'
  },
  'weekly-resistance-rejecting': {
    what: 'Price is within 5% of a weekly pivot high, and the candle action shows a clear rejection from that zone.',
    means: 'Significant selling pressure exists at this level from large-scale market participants. Expect strong headwinds for any further upside.',
    example: 'BTC touches the prior year high on the weekly chart but closes the week significantly lower.'
  },
  'daily-bullish-structure': {
    what: 'A standard daily-20d structure check for bullish alignment (HHs, HLs, and trend).',
    means: 'The daily "swing" direction is up. This is the primary timeframe for most swing traders, indicating that momentum supports bullish entries.',
    example: 'Active when the daily chart makes a new local high after a successful retest of a previous low.'
  },
  'daily-bearish-structure': {
    what: 'A standard daily-20d structure check for bearish alignment.',
    means: 'The daily swing direction is down. Long positions should be minimized or avoided as the intermediate trend is working against you.',
    example: 'Triggered when the daily chart breaks a series of higher lows and begins trending down.'
  },
  'daily-range-support-holding': {
    what: 'Price is closing within 4% of the lowest point recorded in the last 30 days.',
    means: 'The market is testing the bottom of its current range. If the level holds, it represents a high-reward entry point for a range-trade long.',
    example: 'BTC has been bouncing between $64k and $68k; price is currently at $64,200.'
  },
  'daily-range-resistance-rejecting': {
    what: 'Price is closing within 4% of the highest point recorded in the last 30 days.',
    means: 'The market is testing its local ceiling. This is an area to look for short entries or to lock in profits on long positions.',
    example: 'BTC reaches the $70k level after weeks of consolidation between $62k and $70k.'
  },
  'daily-breakout': {
    what: 'The daily candle closes above the high of the previous 30-day range with a small buffer.',
    means: 'The period of consolidation has ended, and a new trend may be starting. Traders often use this to enter momentum-following long positions.',
    example: 'BTC closes at $71,500 after spending a month capped under $70,000.'
  },
  'daily-breakdown': {
    what: 'The daily candle closes below the low of the previous 30-day range.',
    means: 'The support floor has given way, suggesting further downside. This is a bearish expansion signal for trend-following short entries.',
    example: 'BTC drops below $59,000 after holding $60,000 for several weeks.'
  },

  // Overlay
  'etf-inflows-strong': {
    what: 'The most recent daily report for aggregate Spot BTC ETF flows shows a net inflow of more than $300M.',
    means: 'Heavy institutional buying is occurring. This adds fundamental "real money" support to any bullish technical setups.',
    example: 'Active when BlackRock and Fidelity report a combined $400M+ in daily net buying.'
  },
  'etf-inflows-consecutive': {
    what: 'The Spot BTC ETF flows have been net positive for at least three consecutive trading days.',
    means: 'Institutional demand is sustained and consistent, not just a one-day anomaly. This builds confidence in a more durable price move.',
    example: 'Active when Monday, Tuesday, and Wednesday all show positive net inflows.'
  },
  'etf-outflows-strong': {
    what: 'The most recent daily report for Spot BTC ETF flows shows a net outflow exceeding $300M.',
    means: 'Institutional investors are withdrawing capital or selling, creating significant headwind for the price.',
    example: 'Triggered when Grayscale outflows significantly outweigh the inflows of other ETFs.'
  },
  'funding-neutral': {
    what: 'Perpetual swap funding rates are between 0% and 0.01%.',
    means: 'The market is balanced. Neither longs nor shorts are overly leveraged or crowded, reducing the risk of a sudden liquidation squeeze.',
    example: 'Active when the market is quietly consolidating and funding stays near the baseline.'
  },
  'funding-negative-support': {
    what: 'Perpetual swap funding rates drop below 0% (shorts are paying longs).',
    means: 'Market participants are aggressively shorting. If price is near support, this creates a high probability of a "short squeeze" where shorts are forced to buy back.',
    example: 'Active when BTC is at a major low and funding turns negative as everyone panics.'
  },
  'funding-positive-resistance': {
    what: 'Perpetual swap funding rates rise above 0.01% (longs are paying shorts).',
    means: 'The market is "overheated" with too many people buying on leverage. This increases the risk of a "long flush" or price drop into resistance.',
    example: 'Active when BTC is rallying toward a high and funding spikes as retail traders FOMO in.'
  },
  'reserve-risk-low': {
    what: 'The Reserve Risk on-chain metric is below 0.002, indicating high confidence of long-term holders relative to the current price.',
    means: 'Historically, this suggests that Bitcoin is undervalued relative to the conviction of its strongest holders. It is often seen as a macro cycle-bottom signal.',
    example: 'Active during deep bear markets or mid-cycle corrections when price is low but holders aren\'t selling.'
  },
  'puell-multiple-low': {
    what: 'The Puell Multiple is below 1.0, meaning miner revenue is low compared to its yearly average.',
    means: 'Miner stress is high, which historically marks periods of mid-to-long term accumulation. It suggests we are in a lower-risk zone for long-term investors.',
    example: 'Active when miner revenue drops significantly, often coinciding with local or macro bottoms.'
  },

  // Support / Resistance
  'horizontal-support': {
    what: 'Price is within 3% of a clearly defined horizontal pivot low.',
    means: 'We are at a key "buy" level. Horizontal levels are generally more respected than diagonal ones, providing a high-probability area for a bounce.',
    example: 'BTC returns to $60,000, which has acted as a floor three times in the last month.'
  },
  'horizontal-resistance': {
    what: 'Price is within 3% of a clearly defined horizontal pivot high.',
    means: 'We are at a key "sell" level. Expect sellers to defend this zone, making it a good place to take profit or look for a rejection.',
    example: 'BTC rallies to $73,000, just below the all-time high.'
  },
  'old-res-as-sup': {
    what: 'Price has broken above a prior resistance level and is now retesting it from above (within 3%).',
    means: 'A classic "breakout and retest" pattern. If the level holds, it confirms that the old ceiling has become the new floor.',
    example: 'BTC breaks $70k, then drops back to $70,200 and starts to bounce.'
  },
  'old-sup-as-res': {
    what: 'Price has broken below a prior support level and is now retesting it from below.',
    means: 'A bearish retest pattern. If price fails to reclaim the level, it confirms that the old floor has become a new ceiling.',
    example: 'BTC loses $60k, rallies back to $59,800, and immediately gets sold off.'
  },

  // Volume Profile
  'hvn-support': {
    what: 'Current price is just above a High-Volume Node (HVN) from the recent volume profile.',
    means: 'Price is entering an area where a lot of trading has historically occurred. This "agreement zone" often acts as a magnet and support during pullbacks.',
    example: 'A large volume bar at $62,000 provides support when BTC drops from $65,000.'
  },
  'hvn-resistance': {
    what: 'Current price is just below a High-Volume Node (HVN).',
    means: 'The area above has significant historical volume, which may act as heavy supply that needs to be "chewed through" before further upside.',
    example: 'BTC struggles to move through $68,000 where a massive volume spike sits on the profile.'
  },
  'poc-support': {
    what: 'Price is trading just above the Point of Control (POC), the single price level with the highest volume in the lookback period.',
    means: 'Sitting on the market\'s "fair value". Being above the POC suggests that the current consensus is supportive of the bullish case.',
    example: 'BTC consolidates at the POC before a leg up.'
  },
  'poc-resistance': {
    what: 'Price is trading just below the Point of Control (POC).',
    means: 'Market consensus is currently acting as resistance. Being below the POC suggests a bearish lean as the "fair value" is acting as a ceiling.',
    example: 'BTC attempts to rally but keeps getting rejected at the $64,500 POC.'
  },
  'above-value-area': {
    what: 'Price has closed above the Value Area High (VAH), which represents the upper bound of where 70% of volume occurred.',
    means: 'The market has moved into an "imbalance" to the upside. Buyers are accepting prices above the normal value range, suggesting a trend is starting.',
    example: 'BTC leaves its high-volume consolidation zone and stays above it for several daily closes.'
  },
  'below-value-area': {
    what: 'Price has closed below the Value Area Low (VAL).',
    means: 'The market is accepting lower prices. This imbalance to the downside suggests that sellers are in control and a breakdown is in progress.',
    example: 'BTC drops out of its primary trading range into low-volume "air" below.'
  },

  // Range Trading
  'range-support-holding': {
    what: 'Price is closing within 3% of the 30-day range low and shows signs of a bounce.',
    means: 'The bottom of the range is being defended. This is a primary entry signal for range-trading strategies.',
    example: 'BTC hits $60,500 in a $60k-$66k range and closes back above $61k.'
  },
  'range-resistance-rejecting': {
    what: 'Price is closing within 3% of the 30-day range high and showing signs of rejection.',
    means: 'The top of the range is holding. This is a primary area to take profits or look for short-the-range setups.',
    example: 'BTC touches $65,800 in a $60k-$66k range and immediately sells off.'
  },
  'break-above-range': {
    what: 'Price closes decisively above the 30-day high.',
    means: 'A trend has started. The range is no longer valid, and traders should shift from "range-trading" to "trend-following" modes.',
    example: 'BTC closes at $67,500 after weeks of being capped at $66,000.'
  },
  'break-below-range': {
    what: 'Price closes decisively below the 30-day low.',
    means: 'The range floor has failed. Expect a expansion move to the downside toward the next support zone.',
    example: 'BTC closes at $58,500 after holding $60,000 as support for a month.'
  },
  'failure-back-to-range': {
    what: 'Price moved outside the 30-day range in the last 5 days but has now closed back inside the range.',
    means: 'A "fakeout" or "failed breakout" has occurred. This is a very strong reversal signal as trapped traders are forced to exit.',
    example: 'BTC wicks up to $70k from a $68k range, then closes the day back at $67,500.'
  },

  // Moving Averages
  'ma20-support': {
    what: 'Price is trading and closing above the 20-day Simple Moving Average (SMA).',
    means: 'Short-term momentum is positive. The 20 MA is often used as a trailing stop or a baseline for quick trend traders.',
    example: 'BTC pulls back but stays above the 20-day SMA before making a new high.'
  },
  'ma50-support': {
    what: 'Price is trading and closing above the 50-day Simple Moving Average (SMA).',
    means: 'The intermediate trend is healthy. Losing the 50 MA is often the first sign that a larger correction is beginning.',
    example: 'BTC holds the 50-day SMA during a mid-month dip.'
  },
  'ma100-support': {
    what: 'Price is trading and closing above the 100-day Simple Moving Average (SMA).',
    means: 'The medium-to-long term structure is intact. This is a significant support level for institutional "dip buying".',
    example: 'BTC finds a floor at the 100-day SMA after a 10% correction.'
  },
  'ma200-support': {
    what: 'Price is trading and closing above the 200-day Simple Moving Average (SMA).',
    means: 'The primary macro trend is bullish. The 200-day SMA is the "line in the sand" for bull vs. bear markets globally.',
    example: 'Active throughout most of a multi-year bull cycle.'
  },
  'ma200-rejection': {
    what: 'Price is trading and closing below the 200-day Simple Moving Average (SMA).',
    means: 'The primary macro trend is bearish. Bounces into the 200-day SMA from below are often where rallies die.',
    example: 'BTC rallies toward the 200-day SMA but cannot close a daily candle above it.'
  },

  // Bullish Setups
  'long-support-holding': {
    what: 'Price is near a pivot low, the recent wick touched that low, and the candle closed back above it.',
    means: 'A clear "buy the dip" signal where demand has empirically stepped in to defend a level.',
    example: 'BTC wicks to $60k and closes the hour at $61,500.'
  },
  'long-structure-reclaim': {
    what: 'Price recently closed below a key level but has now closed back above it.',
    means: 'A "trap" has been sprung. Sellers failed to keep price down, leading to a strong bullish reversal opportunity.',
    example: 'BTC drops below $60k for two days, then closes back at $61k on high volume.'
  },
  'long-liquidity-sweep': {
    what: 'A lower-timeframe (1H) wick moved below a recent swing low to "sweep" stop losses, but price immediately reclaimed the level.',
    means: 'Smart money has likely filled orders using the liquidity of retail stop losses. This is a high-conviction entry trigger.',
    example: 'BTC wicks under a local low by $200 and immediately snaps back.'
  },
  'long-momentum-conf': {
    what: 'A daily candle shows positive price action with volume above the 10-day average, closing in the top 33% of its range.',
    means: 'Buyers are participating with size. This confirms that the current move has institutional backing.',
    example: 'A large green candle appears with 2x the normal daily volume.'
  },

  // Bearish Setups
  'short-res-rejection': {
    what: 'Price is near a pivot high, the recent wick touched that high, and the candle closed back below it.',
    means: 'A "sell the bounce" signal where supply has stepped in to cap the price at a known level.',
    example: 'BTC touches $70k and immediately drops back to $68k.'
  },
  'short-failure-reclaim': {
    what: 'Price recently closed above a key level but has now failed and closed back below it.',
    means: 'A "bull trap" where buyers could not sustain the breakout. Often leads to a fast move in the opposite direction.',
    example: 'BTC breaks $74k for a few hours but closes the daily candle at $72k.'
  },
  'short-breakdown': {
    what: 'Price has been holding a support level for several days but has now closed decisively below it.',
    means: 'The defensive line has broken. This is a primary signal to exit longs or enter trend-following shorts.',
    example: 'BTC finally closes below the $60k floor after three weeks of trying to hold it.'
  },

  // Entry Filters
  'tight-risk': {
    what: 'Checks if there is a clear technical level (pivot or MA) within 3% of the entry price.',
    means: 'Good risk management is possible. A nearby level allows for a tight stop-loss, improving the Risk-to-Reward (R:R) ratio of the trade.',
    example: 'Entering at $61k with a clear stop at $59,800 (under a pivot).'
  },
  'confirmation': {
    what: 'Checks if the lower-timeframe (1H) trend aligns with the daily directional bias.',
    means: 'Reduces "catching a falling knife". Wait for the smaller timeframe to start turning in your direction before entering a swing trade.',
    example: 'Waiting for a 1H bullish engulfing candle before entering a daily long setup.'
  },
};

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    if (!searchQuery) return signalSections;

    const query = searchQuery.toLowerCase();
    return signalSections
      .map((section) => {
        // Filter signals within the section
        const filteredSignals = section.signals.filter(
          (signal) =>
            signal.title.toLowerCase().includes(query) ||
            signal.id.toLowerCase().includes(query) ||
            section.title.toLowerCase().includes(query)
        );

        // If the section title matches, keep all its signals
        if (section.title.toLowerCase().includes(query)) {
          return section;
        }

        // If any signals match, return the section with only those signals
        if (filteredSignals.length > 0) {
          return { ...section, signals: filteredSignals };
        }

        return null;
      })
      .filter((section): section is typeof signalSections[0] => section !== null);
  }, [searchQuery]);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-12">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Signal Reference</h1>
        </div>
        <p className="text-zinc-400 text-lg">
          Detailed explanations for every signal in the Confluence Dashboard. 
          Use this guide to understand the underlying logic and trader interpretation.
        </p>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            placeholder="Search signals by name, ID, or section..."
            className="pl-10 h-12 bg-zinc-900/50 border-zinc-800 focus:ring-zinc-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Signal Sections */}
      <div className="space-y-12">
        {filteredSections.map((section) => (
          <Collapsible key={section.id} defaultOpen className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-4">
                <h2 className="text-2xl font-semibold text-zinc-100">{section.title}</h2>
                <span className="text-zinc-500 text-sm font-mono">
                  {section.signals.length} {section.signals.length === 1 ? 'signal' : 'signals'}
                </span>
              </div>
              <CollapsibleTrigger className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-300">
                <ChevronDown className="w-5 h-5 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-6">
              <div className="grid gap-6">
                {section.signals.map((signal) => {
                  const help = signalHelpContent[signal.id];
                  return (
                    <Card key={signal.id} className="bg-zinc-900/30 border-zinc-800 overflow-hidden">
                      <CardHeader className="pb-3 border-b border-zinc-800/50 bg-zinc-900/20">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-1">
                            <CardTitle className="text-xl font-medium">{signal.title}</CardTitle>
                            <code className="text-xs text-zinc-500 font-mono">{signal.id}</code>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`
                              px-3 py-1 uppercase text-[10px] tracking-wider font-bold
                              ${signal.bias === 'bullish' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                              ${signal.bias === 'bearish' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                              ${signal.bias === 'neutral' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' : ''}
                              ${signal.bias === 'defensive' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                              ${signal.bias === 'caution' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
                            `}
                          >
                            {signal.bias}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-6">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">What it measures</h4>
                          <p className="text-zinc-300 leading-relaxed">
                            {help?.what || 'Description coming soon.'}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Trader Interpretation</h4>
                          <p className="text-zinc-300 leading-relaxed italic">
                            {help?.means || 'Interpretation coming soon.'}
                          </p>
                        </div>

                        {help?.example && (
                          <div className="pt-2">
                            <div className="bg-zinc-800/30 rounded-md p-3 border border-zinc-800/50">
                              <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Example Scenario</span>
                              <p className="text-sm text-zinc-400">{help.example}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CollapsibleContent>
            {/* Added separator for visual clarity when collapsed */}
            <Separator className="bg-zinc-800/50" />
          </Collapsible>
        ))}

        {filteredSections.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
            <HelpCircle className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-zinc-400">No signals match your search</h3>
            <p className="text-zinc-500 mt-2">Try searching for a different term or browse the sections below.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-6 text-zinc-100 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-20 pt-12 border-t border-zinc-800 text-center">
        <p className="text-zinc-500 text-sm">
          BTC Swing Trading Framework • Confluence Dash v1.8
        </p>
      </footer>
    </main>
  );
}

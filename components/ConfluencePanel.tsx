'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SignalState } from '@/types/signals';
import { computeMasterScorecard } from '@/lib/signals/confluence';

interface ConfluencePanelProps {
  autoSignals: SignalState[];
}

export default function ConfluencePanel({ autoSignals }: ConfluencePanelProps) {
  const scorecard = computeMasterScorecard(autoSignals);
  
  const getBiasColor = (bias: string) => {
    if (bias.includes('Very Strong Bullish')) return 'text-green-400';
    if (bias.includes('Strong Bullish')) return 'text-green-500';
    if (bias.includes('Bullish Lean')) return 'text-green-400';
    if (bias.includes('Very Strong Bearish')) return 'text-red-400';
    if (bias.includes('Strong Bearish')) return 'text-red-500';
    if (bias.includes('Bearish Lean')) return 'text-red-400';
    return 'text-zinc-500';
  };

  // Bar position: 0% = far left (-100% confidence), 50% = centre (neutral),
  // 100% = far right (+100% confidence). Maps -100..+100 to 0..100.
  const barPosition = (scorecard.confidencePercent + 100) / 2;
  const pctLabel = scorecard.confidencePercent > 0
    ? `+${scorecard.confidencePercent}%`
    : `${scorecard.confidencePercent}%`;

  return (
    <Card className="sticky top-20 border-primary/20 bg-card/80 backdrop-blur shadow-xl overflow-hidden">
      <div className={`h-1.5 w-full ${scorecard.confidencePercent >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex justify-between items-center">
          Market Bias
          <span className={`text-sm font-bold uppercase tracking-widest ${getBiasColor(scorecard.bias)}`}>
            {scorecard.bias}
          </span>
        </CardTitle>
        <CardDescription>Aggregate Confluence Engine</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Conviction</span>
              <span className="text-[10px] text-muted-foreground/60 mt-0.5">
                Raw score: {scorecard.totalScore > 0 ? `+${scorecard.totalScore}` : scorecard.totalScore} / ±{scorecard.maxPossibleScore}
              </span>
            </div>
            <span className={`text-3xl font-black tabular-nums ${scorecard.confidencePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {pctLabel}
            </span>
          </div>
          <div className="relative pt-7 pb-4">
            {/* Two-half solid gradient: dim near centre, vibrant at the edges */}
            <div className="relative h-3 w-full overflow-hidden rounded-full flex shadow-inner">
              <div className="flex-1 bg-gradient-to-l from-red-900 via-red-700 to-red-500" />
              <div className="flex-1 bg-gradient-to-r from-green-900 via-green-700 to-green-500" />
            </div>
            {/* Centre divider tick (zero mark) */}
            <div className="pointer-events-none absolute left-1/2 top-7 h-5 w-px -translate-x-1/2 bg-zinc-300/70" />
            <div className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 text-[8px] uppercase font-bold tracking-widest text-zinc-500">
              0
            </div>
            {/* Live confidence position marker with floating percent badge */}
            <div
              className="pointer-events-none absolute top-1 transition-all duration-500"
              style={{ left: `${barPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className={`mx-auto w-fit rounded px-1.5 py-0.5 text-[9px] font-black tabular-nums shadow-md ${
                  scorecard.confidencePercent >= 0
                    ? 'bg-green-500 text-black'
                    : 'bg-red-500 text-white'
                }`}
              >
                {pctLabel}
              </div>
              <div className="mx-auto mt-1 h-5 w-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/60">
            <span>100% Bearish</span>
            <span>100% Bullish</span>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Bullish Active</span>
            <div className="text-xl font-bold text-green-500">{scorecard.bullishActive}</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Bearish Active</span>
            <div className="text-xl font-bold text-red-500">{scorecard.bearishActive}</div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Recommended Action</span>
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
            <p className="text-sm font-bold leading-tight text-primary">
              {scorecard.action}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-[10px] leading-relaxed text-muted-foreground text-center italic">
            &ldquo;One good trade is enough. Wait for the confluence.&rdquo;
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { SignalState } from '@/types/signals';
import { computeMasterScorecard } from '@/lib/signals/confluence';

interface ConfluencePanelProps {
  autoSignals: SignalState[];
}

export default function ConfluencePanel({ autoSignals }: ConfluencePanelProps) {
  const scorecard = computeMasterScorecard(autoSignals);
  
  const getBiasColor = (bias: string) => {
    if (bias.includes('Strong Bullish')) return 'text-green-500';
    if (bias.includes('Bullish Lean')) return 'text-green-400';
    if (bias.includes('Strong Bearish')) return 'text-red-500';
    if (bias.includes('Bearish Lean')) return 'text-red-400';
    return 'text-zinc-500';
  };

  const scorePercentage = ((scorecard.totalScore + 100) / 200) * 100;

  return (
    <Card className="sticky top-20 border-primary/20 bg-card/80 backdrop-blur shadow-xl overflow-hidden">
      <div className={`h-1.5 w-full ${scorecard.totalScore >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
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
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Total Score</span>
            <span className={`text-3xl font-black ${scorecard.totalScore >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {scorecard.totalScore > 0 ? `+${scorecard.totalScore}` : scorecard.totalScore}
            </span>
          </div>
          <Progress value={scorePercentage} className="h-2 bg-red-500/20" />
          <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/60">
            <span>Strong Bearish (-100)</span>
            <span>Strong Bullish (+100)</span>
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

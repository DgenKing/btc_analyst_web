'use client';

import React from 'react';
import { SignalSection, SignalState, SectionVerdict } from '@/types/signals';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SignalRow from './SignalRow';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  section: SignalSection;
  signalStates: SignalState[];
  verdict: SectionVerdict;
}

export default function SectionCard({ section, signalStates, verdict }: SectionCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const getDirectionBadge = () => {
    switch (verdict.direction) {
      case 'bullish':
        return (
          <Badge className="bg-green-500/15 text-green-400 border-green-500/30 font-black uppercase text-[10px] tracking-widest px-2">
            Bullish
          </Badge>
        );
      case 'bearish':
        return (
          <Badge className="bg-red-500/15 text-red-400 border-red-500/30 font-black uppercase text-[10px] tracking-widest px-2">
            Bearish
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 font-black uppercase text-[10px] tracking-widest px-2">
            Neutral
          </Badge>
        );
    }
  };

  const isDataMissing = verdict.totalCount > 0 && signalStates.every(s => s.status === 'none');

  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/30 overflow-hidden backdrop-blur-sm shadow-sm transition-all hover:border-white/10">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <CollapsibleTrigger asChild>
          <div className="p-5 cursor-pointer hover:bg-white/5 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors">
                  {section.title}
                </h3>
                <div className="flex items-center gap-3">
                  {getDirectionBadge()}
                  <span className={cn(
                    "text-xs font-bold",
                    verdict.direction === 'bullish' ? "text-green-500/80" : 
                    verdict.direction === 'bearish' ? "text-red-500/80" : "text-zinc-500"
                  )}>
                    {verdict.confidencePercent}% Confidence
                  </span>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
                    {verdict.bullishActiveCount > 0 && (
                      <span className="text-green-500/80">{verdict.bullishActiveCount} bullish</span>
                    )}
                    {verdict.bullishActiveCount > 0 && verdict.bearishActiveCount > 0 && (
                      <span className="text-zinc-600"> · </span>
                    )}
                    {verdict.bearishActiveCount > 0 && (
                      <span className="text-red-500/80">{verdict.bearishActiveCount} bearish</span>
                    )}
                    {verdict.activeCount === 0 && (
                      <span>0/{verdict.totalCount} firing</span>
                    )}
                    {verdict.activeCount > 0 && (
                      <span className="text-zinc-600"> · {verdict.activeCount}/{verdict.totalCount}</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isDataMissing && (
                  <Badge variant="outline" className="text-amber-500/50 border-amber-500/20 text-[9px] uppercase px-1.5 h-5 font-bold">
                    <AlertCircle className="h-3 w-3 mr-1" /> No Data
                  </Badge>
                )}
                <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-all">
                  <ChevronDown className={cn("h-4 w-4 text-zinc-500 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-white/5 bg-black/20 pb-2">
            <div className="px-4 py-3">
              <p className="text-xs text-zinc-500 leading-relaxed italic">
                {section.description || `Aggregate details for ${section.title}.`}
              </p>
            </div>
            <div className="space-y-px">
              {section.signals.map((signal) => {
                const state = signalStates.find((s) => s.id === signal.id) || {
                  id: signal.id,
                  status: 'none' as const,
                  score: 0,
                  confluence: { passed: 0, total: signal.subCriteriaCount },
                  fetchedAt: 0,
                };
                return (
                  <SignalRow
                    key={signal.id}
                    signal={signal}
                    state={state}
                  />
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

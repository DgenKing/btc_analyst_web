import React from 'react';
import { Signal, SignalState } from '@/types/signals';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SignalRowProps {
  signal: Signal;
  state: SignalState;
}

export default function SignalRow({ signal, state }: SignalRowProps) {
  const getDotColor = () => {
    if (state.status === 'unavailable') return 'border-amber-500/50 bg-transparent';
    if (state.score > 0) return 'bg-green-500';
    if (state.score < 0) return 'bg-red-500';
    if (state.status === 'yellow') return 'bg-yellow-500';
    return 'bg-zinc-700';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-between py-2 px-4 hover:bg-white/5 transition-colors cursor-help group">
            <div className="flex items-center gap-3">
              <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", getDotColor())} />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                {signal.title}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {state.value && (
                <span className="text-[10px] font-mono text-zinc-500">{state.value}</span>
              )}
              <span className={cn(
                "text-xs font-mono font-bold w-12 text-right",
                state.score > 0 ? "text-green-500" : state.score < 0 ? "text-red-500" : "text-zinc-600"
              )}>
                {state.score > 0 ? `+${state.score}` : state.score} pts
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs bg-zinc-900 border-zinc-800 text-zinc-200">
          <div className="space-y-1">
            <p className="font-bold text-xs uppercase text-zinc-400 tracking-wider">{signal.title}</p>
            <p className="text-sm">{signal.meaning}</p>
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-800 text-[10px] text-zinc-500 uppercase font-bold">
              <span>Source: {signal.sourceLabel}</span>
              {state.confluence.total > 1 && (
                <span>Confluence: {state.confluence.passed}/{state.confluence.total}</span>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

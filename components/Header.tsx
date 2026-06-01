'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface HeaderProps {
  lastUpdated?: string;
}

export default function Header({ lastUpdated }: HeaderProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number>(0);

  useEffect(() => {
    // Live BTC perp price from Hyperliquid (mark price + 24h change vs prevDayPx).
    const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');

    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: 'subscribe',
        subscription: { type: 'activeAssetCtx', coin: 'BTC' },
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.channel === 'activeAssetCtx' && data.data?.coin === 'BTC') {
        const ctx = data.data.ctx;
        const mark = parseFloat(ctx.markPx);
        const prevDay = parseFloat(ctx.prevDayPx);
        if (!Number.isNaN(mark)) setPrice(mark);
        if (!Number.isNaN(mark) && prevDay > 0) {
          setChange(((mark - prevDay) / prevDay) * 100);
        }
      }
    };

    return () => ws.close();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.jpg"
            alt="BTC Analyst"
            width={48}
            height={48}
            priority
            className="h-12 w-12 rounded-lg object-cover"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-none">BTC Analyst</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              Confluence • Patience • High-Probability
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8">
          {lastUpdated && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">Last Snapshot</span>
              <span className="text-xs font-mono">{new Date(lastUpdated).toLocaleTimeString()}</span>
            </div>
          )}
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-xl font-mono font-bold tracking-tighter sm:tracking-normal">
                {price ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Loading...'}
              </span>
              {change !== 0 && (
                <span className={`flex items-center text-xs sm:text-sm font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {change >= 0 ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5" /> : <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5" />}
                  {Math.abs(change).toFixed(2)}%
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-medium">Hyperliquid Perp Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}

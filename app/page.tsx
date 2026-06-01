'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Header from '@/components/Header';
import SectionCard from '@/components/SectionCard';
import ConfluencePanel from '@/components/ConfluencePanel';
import Chart from '@/components/Chart';
import { signalSections } from '@/data/signals';
import { MarketSnapshot } from '@/types/signals';
import { computeSectionVerdict } from '@/lib/signals/sectionAggregation';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('d');

  const { data: snapshot, isLoading } = useSWR<MarketSnapshot>('/api/snapshot', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });

  const signalStates = useMemo(() => {
    if (!snapshot?.signals) {
      return signalSections.flatMap(section =>
        section.signals.map(signal => ({
          id: signal.id,
          status: 'none' as const,
          score: 0,
          confluence: { passed: 0, total: signal.subCriteriaCount },
          fetchedAt: 0,
        }))
      );
    }
    return snapshot.signals;
  }, [snapshot]);

  const filteredSections = useMemo(() => {
    return signalSections.map(section => ({
      ...section,
      signals: section.signals.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.meaning.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(section => section.signals.length > 0);
  }, [searchQuery]);

  const chartData = useMemo(() => {
    if (!snapshot?.klines) return [];
    return snapshot.klines[timeframe as keyof typeof snapshot.klines] || snapshot.klines.d || [];
  }, [snapshot, timeframe]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-primary/30 selection:text-white">
      <Header lastUpdated={snapshot?.lastUpdated} />
      
      <main className="container py-8 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row items-start">
          {/* Left Column: Signals & Content */}
          <div className="flex-1 space-y-8 w-full">
            {/* Market Bias — mobile only, sits directly under the header/price.
                On desktop (lg+) this is hidden and the sticky sidebar version is used instead. */}
            <div className="lg:hidden">
              <ConfluencePanel autoSignals={signalStates} />
            </div>

            {/* Chart Section */}
            <Card className="overflow-hidden border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
                  <div className="flex items-center gap-6">
                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-500">Market Performance</h3>
                    <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5">
                      {['w', 'd', 'h4', 'h1'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={cn(
                            "px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all",
                            timeframe === tf 
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                          )}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                <div className="px-1 py-3 sm:p-6 h-[300px] sm:h-[400px] bg-gradient-to-b from-transparent to-black/20">
                  {chartData.length > 0 ? (
                    <Chart data={chartData} />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-600">
                      <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Synchronizing Klines...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-md group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Filter signals by name or logic..." 
                  className="pl-12 bg-zinc-900/50 border-white/5 h-12 text-sm focus:ring-primary/20 focus:border-primary/30 transition-all rounded-xl shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {filteredSections.map((section) => (
                <SectionCard 
                  key={section.id} 
                  section={section} 
                  signalStates={signalStates}
                  verdict={computeSectionVerdict(section, signalStates)}
                />
              ))}
            </div>

            <section className="rounded-2xl border border-white/5 bg-zinc-900/40 p-8 shadow-xl">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 border-b border-white/5 pb-4">Execution Principles</h2>
              <div className="grid gap-12 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-black text-xs uppercase tracking-widest text-primary/80">Risk Protocols</h4>
                  <ul className="text-xs space-y-4 text-zinc-400 font-medium">
                    <li className="flex items-start gap-3"><span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" /> No defined invalidation = No trade execution.</li>
                    <li className="flex items-start gap-3"><span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" /> Capital preservation is the only true performance metric.</li>
                    <li className="flex items-start gap-3"><span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" /> Emotional or revenge trading results in immediate lockout.</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-black text-xs uppercase tracking-widest text-primary/80">Edge & Psychology</h4>
                  <ul className="text-xs space-y-4 text-zinc-400 font-medium">
                    <li className="flex items-start gap-3"><span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" /> High-probability setups only. Filter the noise.</li>
                    <li className="flex items-start gap-3"><span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" /> One high-quality trade per week creates generational wealth.</li>
                    <li className="flex items-start gap-3"><span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" /> We trade market reactions, we do not predict futures.</li>
                  </ul>
                </div>
              </div>
            </section>

            <footer className="border-t border-white/5 pt-12 pb-24 text-center">
              <blockquote className="text-xl font-serif italic text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                &ldquo;One signal is information. Multiple aligned signals create a trade setup.&rdquo;
              </blockquote>
              <div className="mt-8">
                <Link 
                  href="/help" 
                  className="text-xs font-bold text-zinc-400 hover:text-primary transition-colors flex items-center justify-center gap-2 group"
                >
                  Signal reference 
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">
                BTC Analyst Dashboard • v1.8 • Global Confluence
              </p>
            </footer>
          </div>

          {/* Right Column: Scorecard & Actions — desktop only (mobile renders it
              at the top of the content column instead). */}
          <div className="hidden lg:block lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-24">
            <ConfluencePanel autoSignals={signalStates} />
          </div>
        </div>
      </main>
    </div>
  );
}

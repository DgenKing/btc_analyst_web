'use client';

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ExternalLink, 
  RefreshCcw, 
  Search,
  ChevronRight
} from 'lucide-react';
import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { VerificationReport, VerificationRow } from '@/lib/diagnostics/verify';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDiagnosticsPage() {
  const { data: report, error, mutate, isLoading, isValidating } = useSWR<VerificationReport>(
    '/api/diagnostics',
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loading = isLoading || isValidating;

  const filteredRows = useMemo(() => {
    if (!report) return [];
    return report.rows.filter(row => {
      const matchesSearch = row.title.toLowerCase().includes(search.toLowerCase()) || 
                          row.id.toLowerCase().includes(search.toLowerCase());
      const matchesSection = sectionFilter === 'all' || row.sectionId === sectionFilter;
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesSearch && matchesSection && matchesStatus;
    });
  }, [report, search, sectionFilter, statusFilter]);

  const sections = useMemo(() => {
    if (!report) return [];
    const uniqueSections = Array.from(new Set(report.rows.map(r => JSON.stringify({ id: r.sectionId, title: r.sectionTitle }))));
    return uniqueSections.map(s => JSON.parse(s));
  }, [report]);

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-neutral-400">Running diagnostic suite...</p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white p-6">
        <Card className="max-w-md w-full border-red-900/50 bg-neutral-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-6 h-6" />
              Diagnostics Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-neutral-400">{error.message || 'Failed to fetch diagnostics'}</p>
            <Button onClick={() => mutate()} className="w-full">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allVerified = report?.mismatchCount === 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 space-y-8 font-sans">
      {/* Header Banner */}
      <div className={cn(
        "p-4 rounded-lg border flex flex-col md:flex-row items-center justify-between gap-4",
        allVerified ? "bg-green-900/20 border-green-800/50" : "bg-red-900/20 border-red-800/50"
      )}>
        <div className="flex items-center gap-3">
          {allVerified ? (
            <CheckCircle className="w-8 h-8 text-green-500" />
          ) : (
            <XCircle className="w-8 h-8 text-red-500" />
          )}
          <div>
            <h1 className="text-xl font-bold">
              {allVerified 
                ? `All ${report?.totalSignals} signals verified ✓` 
                : `${report?.mismatchCount} signals failed verification ✗`}
            </h1>
            <p className="text-sm text-neutral-400">
              Last run: {report ? formatDistanceToNow(new Date(report.generatedAt)) : 'never'} ago
            </p>
          </div>
        </div>
        
        {!allVerified && (
          <div className="text-sm text-red-400 max-w-md text-right">
            Failed: {report?.rows.filter(r => !r.verified).map(r => r.id).join(', ')}
          </div>
        )}

        <Button 
          variant="outline" 
          onClick={() => mutate()} 
          disabled={loading}
          className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800"
        >
          <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input 
            placeholder="Search signals by name or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-neutral-900 border-neutral-800 focus:ring-blue-500"
          />
        </div>
        <select 
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Sections</option>
          {sections.map((s: { id: string; title: string }) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="green">Green (Bullish)</option>
          <option value="red">Red (Bearish)</option>
          <option value="yellow">Yellow (Neutral)</option>
          <option value="none">None (Inactive)</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Signal Table */}
      <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800 z-10">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Section</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Signal ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Score</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Current Value</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Inputs</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredRows.map((row) => (
                <tr key={row.id} className={cn(
                  "hover:bg-neutral-800/50 transition-colors",
                  !row.verified ? "bg-red-950/20" : "",
                  row.status === 'unavailable' ? "opacity-60 bg-neutral-950" : ""
                )}>
                  <td className="px-4 py-4 text-xs text-neutral-400 whitespace-nowrap">
                    {row.sectionTitle}
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-neutral-500 whitespace-nowrap">
                    {row.id}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium">
                    {row.title}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={cn(
                      "font-mono font-bold",
                      row.score > 0 ? "text-green-500" : row.score < 0 ? "text-red-500" : "text-neutral-500"
                    )}>
                      {row.score > 0 ? `+${row.score}` : row.score}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-mono text-neutral-300">
                    {row.value || '—'}
                  </td>
                  <td className="px-4 py-4">
                    <a 
                      href={row.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-xs"
                    >
                      Source <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-1 text-[10px] uppercase font-bold text-neutral-500 hover:text-neutral-300">
                        <ChevronRight className="w-3 h-3" /> Inputs
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="bg-neutral-950 p-2 rounded text-[10px] font-mono text-neutral-400 space-y-1">
                          {Object.entries(row.inputs).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-4">
                              <span className="text-neutral-600">{k}:</span>
                              <span>{v}</span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {row.verified ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <XCircle className="w-5 h-5 text-red-500" />
                        {row.expected && (
                          <span className="text-[9px] text-red-400 font-mono">
                            Exp: {row.expected.status} / {row.expected.score}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-xs text-neutral-500 px-2">
        <p>BTC Analyst Diagnostic Suite v1.0</p>
        <p>Snapshot age: {report ? Math.floor(report.snapshotAge / 1000) : 0}s</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: VerificationRow['status'] }) {
  switch (status) {
    case 'green':
      return <Badge className="bg-green-500/20 text-green-500 border-green-500/20 hover:bg-green-500/30">Bullish</Badge>;
    case 'red':
      return <Badge className="bg-red-500/20 text-red-500 border-red-500/20 hover:bg-red-500/30">Bearish</Badge>;
    case 'yellow':
      return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/30">Neutral</Badge>;
    case 'none':
      return <Badge variant="outline" className="text-neutral-500 border-neutral-800">Inactive</Badge>;
    case 'unavailable':
      return <Badge className="bg-neutral-800 text-neutral-500 border-neutral-700">Unavailable</Badge>;
    default:
      return null;
  }
}

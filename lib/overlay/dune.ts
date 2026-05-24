/**
 * Fetches BTC ETF net flows from Dune Analytics.
 *
 * Default query ID 3430945 (hildobby's per-ETF flows) returns rows like:
 *   { time: '2026-05-23', issuer: 'BlackRock', etf_ticker: 'IBIT',
 *     amount_usd_net_flow: 123000000, ... }
 *
 * We aggregate per-date across all issuers to get daily net flow totals.
 *
 * If you fork the query and pre-aggregate yourself, your query can simply
 * return rows shaped { time, amount_usd_net_flow } (or net_flow_usd) and
 * this fetcher will still work.
 */
interface DuneRow {
  time?: string;
  day?: string;
  date?: string;
  amount_usd_net_flow?: number;
  net_flow_usd?: number;
  net_inflow_usd?: number;
}

function pickDate(row: DuneRow): string | undefined {
  return row.time ?? row.day ?? row.date;
}

function pickUsd(row: DuneRow): number | undefined {
  return row.amount_usd_net_flow ?? row.net_flow_usd ?? row.net_inflow_usd;
}

export async function fetchDuneEtfFlows() {
  const apiKey = process.env.DUNE_API_KEY;
  const queryId = process.env.DUNE_ETF_QUERY_ID;

  if (!apiKey || !queryId) {
    return { status: 'unavailable', error: 'Missing Dune API credentials' };
  }

  try {
    const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results`, {
      headers: { 'X-Dune-API-Key': apiKey },
      next: { revalidate: 43200 }, // 12h
    });

    if (!response.ok) {
      return { status: 'unavailable', error: `Dune API ${response.status}` };
    }

    const data = await response.json();
    const rows: DuneRow[] = data?.result?.rows ?? [];
    if (rows.length === 0) {
      return { status: 'unavailable', error: 'Dune returned no rows' };
    }

    // Aggregate per-day net flow across all issuers/ETFs
    const byDay = new Map<string, number>();
    for (const row of rows) {
      const date = pickDate(row);
      const usd = pickUsd(row);
      if (!date || typeof usd !== 'number') continue;
      // Normalise to YYYY-MM-DD (strip any time portion)
      const dayKey = date.slice(0, 10);
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + usd);
    }

    if (byDay.size === 0) {
      return { status: 'unavailable', error: 'Dune rows had no usable date/USD fields' };
    }

    // Sort days descending — latest first
    const sortedDays = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
    const latestDayNetFlowUSD = sortedDays[0][1];
    const last3 = sortedDays.slice(0, 3).map(([, usd]) => usd);
    const isConsecutive = last3.length === 3 && last3.every(v => v > 0);

    return {
      status: 'success',
      latestDayNetFlowUSD,
      isConsecutive,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    return {
      status: 'unavailable',
      error: error instanceof Error ? error.message : 'Unknown',
    };
  }
}

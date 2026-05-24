/**
 * Fetches BTC ETF net flows from Dune Analytics.
 *
 * Tolerates several known schemas:
 *   • hildobby per-ETF flows (deprecated, kept for backwards compat)
 *       cols: time, issuer, etf_ticker, amount_usd_net_flow
 *   • thechriscen per-transaction flows (active as of 2026-05)
 *       cols: block_time, issuer, etf_ticker, usd_value, flow_type
 *   • any custom forked query that returns
 *       cols: time|day|date, net_flow_usd|amount_usd_net_flow|net_inflow_usd
 *
 * We aggregate per-day across all rows. For per-transaction schemas with a
 * `flow_type` column, outflows are sign-flipped.
 */
interface DuneRow {
  time?: string;
  day?: string;
  date?: string;
  block_time?: string;
  amount_usd_net_flow?: number;
  net_flow_usd?: number;
  net_inflow_usd?: number;
  usd_value?: number;
  flow_type?: string;
}

function pickDate(row: DuneRow): string | undefined {
  return row.time ?? row.day ?? row.date ?? row.block_time;
}

function pickSignedUsd(row: DuneRow): number | undefined {
  // Pre-aggregated net-flow columns take precedence (already signed)
  const preSigned =
    row.amount_usd_net_flow ?? row.net_flow_usd ?? row.net_inflow_usd;
  if (typeof preSigned === 'number') return preSigned;

  // Per-transaction column needs sign derived from flow_type
  if (typeof row.usd_value === 'number') {
    const ft = (row.flow_type ?? '').toLowerCase();
    if (ft === 'outflow' || ft === 'withdrawal' || ft === 'redeem') {
      return -Math.abs(row.usd_value);
    }
    if (ft === 'inflow' || ft === 'deposit' || ft === 'mint') {
      return Math.abs(row.usd_value);
    }
    // No flow_type — assume value is already signed
    return row.usd_value;
  }

  return undefined;
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
      const resultPreview = JSON.stringify(data?.result ?? null).slice(0, 800);
      return {
        status: 'unavailable',
        error: `Dune no rows. result=${resultPreview}`,
      };
    }

    // Aggregate per-day net flow across all rows
    const byDay = new Map<string, number>();
    for (const row of rows) {
      const date = pickDate(row);
      const usd = pickSignedUsd(row);
      if (!date || typeof usd !== 'number') continue;
      const dayKey = date.slice(0, 10);
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + usd);
    }

    if (byDay.size === 0) {
      const cols = data?.result?.metadata?.column_names?.join(',') ?? 'unknown';
      return {
        status: 'unavailable',
        error: `Dune rows had no usable date/USD fields. Columns: [${cols}]`,
      };
    }

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

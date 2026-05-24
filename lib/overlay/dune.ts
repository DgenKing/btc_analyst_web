export async function fetchDuneEtfFlows() {
  const apiKey = process.env.DUNE_API_KEY;
  const queryId = process.env.DUNE_ETF_QUERY_ID;

  if (!apiKey || !queryId) {
    return { status: 'unavailable', error: 'Missing Dune API credentials' };
  }

  try {
    const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results`, {
      headers: { 'X-Dune-API-Key': apiKey },
      next: { revalidate: 43200 } // 12h
    });
    
    if (!response.ok) throw new Error('Dune API error');
    
    const data = await response.json();
    const latest = data.result.rows[0]; // Assuming sorted by date desc
    
    return {
      status: 'success',
      latestDayNetFlowUSD: latest.net_flow_usd,
      isConsecutive: data.result.rows.slice(0, 3).every((r: { net_flow_usd: number }) => r.net_flow_usd > 0),
      fetchedAt: Date.now()
    };
  } catch (error) {
    return { status: 'unavailable', error: error instanceof Error ? error.message : 'Unknown' };
  }
}

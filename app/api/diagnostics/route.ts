import { NextResponse } from 'next/server';
import { getCurrentFundingAndOI } from '@/lib/bybit';
import { verifyAllSignals } from '@/lib/diagnostics/verify';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { origin } = new URL(request.url);

    // Pull already-cached snapshot and overlay data
    // We use the full URL to ensure it works in both local and deployed environments
    const [snapshotResp, overlayResp, ticker] = await Promise.all([
      fetch(`${origin}/api/snapshot`, { cache: 'no-store' }),
      fetch(`${origin}/api/overlay-cached`, { cache: 'no-store' }),
      getCurrentFundingAndOI('BTCUSDT'),
    ]);

    if (!snapshotResp.ok) {
      throw new Error(`Failed to fetch snapshot: ${snapshotResp.status}`);
    }
    if (!overlayResp.ok) {
      throw new Error(`Failed to fetch overlay: ${overlayResp.status}`);
    }

    const snapshot = await snapshotResp.json();
    const overlayData = await overlayResp.json();

    // The verifier handles the logic of comparing live vs expected
    const report = verifyAllSignals(snapshot, overlayData, ticker);

    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Diagnostics API Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

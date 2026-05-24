import { NextResponse } from 'next/server';
import { getKlines, getCurrentFundingAndOI } from '@/lib/bybit';
import { getMASignals } from '@/lib/signals/movingAverages';
import { getFundingSignals } from '@/lib/signals/funding';
import { getStructureSignals } from '@/lib/signals/structure';
import { getSRSignals } from '@/lib/signals/supportResistance';

import { getRangeSignals } from '@/lib/signals/range';
import { getMultiTimeframeSignals } from '@/lib/signals/multiTimeframe';
import { getVolumeProfileSignals } from '@/lib/signals/volumeProfile';
import { getSetupSignals } from '@/lib/signals/setups';
import { getEntryFilterSignals } from '@/lib/signals/entryFilters';
import { getOverlaySignals } from '@/lib/signals/overlay';

export const revalidate = 60; // 60 seconds edge cache

// Fetch overlay through the dedicated /api/_overlay route — it's cached at the
// Vercel edge layer with a 12h revalidate, so this fetch is served from CDN
// even when /api/snapshot is hit hundreds of times per day. This is the only
// thing that reliably enforces the upstream call budget across instances.
async function getOverlayViaCachedRoute(request: Request) {
  try {
    const overlayUrl = new URL('/api/_overlay', request.url);
    const resp = await fetch(overlayUrl.toString(), {
      next: { revalidate: 43200 },
    });
    if (!resp.ok) {
      return {
        etfFlows: { status: 'unavailable', error: `_overlay ${resp.status}` },
        reserveRisk: { status: 'unavailable', error: `_overlay ${resp.status}` },
        puellMultiple: { status: 'unavailable', error: `_overlay ${resp.status}` },
      };
    }
    return await resp.json();
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown';
    return {
      etfFlows: { status: 'unavailable', error },
      reserveRisk: { status: 'unavailable', error },
      puellMultiple: { status: 'unavailable', error },
    };
  }
}

export async function GET(request: Request) {
  try {
    const [klinesD, klinesW, klines4H, klines1H, perpTicker, overlayData] = await Promise.all([
      getKlines('BTCUSDT', 'D', 200),
      getKlines('BTCUSDT', 'W', 200),
      getKlines('BTCUSDT', '240', 200),
      getKlines('BTCUSDT', '60', 200),
      getCurrentFundingAndOI('BTCUSDT'),
      getOverlayViaCachedRoute(request),
    ]);

    const maSignals = getMASignals(klinesD);
    const fundingSignals = getFundingSignals(perpTicker);
    const structureSignals = getStructureSignals(klinesD);
    const srSignals = getSRSignals(klinesD);
    const rangeSignals = getRangeSignals(klinesD);
    const mtfSignals = getMultiTimeframeSignals(klinesD, klinesW);
    const volProfileSignals = getVolumeProfileSignals(klinesD);
    const setupSignals = getSetupSignals(klinesD, klines1H);
    const entryFilterSignals = getEntryFilterSignals(klinesD, klines1H);
    const overlaySignals = getOverlaySignals(overlayData);

    // Combine all auto-detected signals
    const signals = [
      ...maSignals,
      ...fundingSignals,
      ...structureSignals,
      ...srSignals,
      ...rangeSignals,
      ...mtfSignals,
      ...volProfileSignals,
      ...setupSignals,
      ...entryFilterSignals,
      ...overlaySignals,
    ];

    const snapshot = {
      price: parseFloat(perpTicker.lastPrice),
      priceChangePercent24h: parseFloat(perpTicker.price24hPcnt) * 100,
      lastUpdated: new Date().toISOString(),
      klines: {
        d: klinesD,
        w: klinesW,
        h4: klines4H,
        h1: klines1H,
      },
      funding: {
        current: parseFloat(perpTicker.fundingRate),
      },
      openInterest: {
        current: parseFloat(perpTicker.openInterest),
      },
      signals,
    };

    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Snapshot API Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

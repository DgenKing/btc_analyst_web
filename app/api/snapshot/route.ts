import { NextResponse } from 'next/server';
import { getKlines, getPerpContext } from '@/lib/hyperliquid';
import { getCurrentFundingAndOI } from '@/lib/bybit';
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
import { getTriggerSignals } from '@/lib/signals/triggers';

export const revalidate = 60; // 60 seconds edge cache

// Fetch overlay through the dedicated /api/overlay-cached route — it's cached at the
// Vercel edge layer with a 12h revalidate, so this fetch is served from CDN
// even when /api/snapshot is hit hundreds of times per day. This is the only
// thing that reliably enforces the upstream call budget across instances.
async function getOverlayViaCachedRoute(request: Request) {
  try {
    const overlayUrl = new URL('/api/overlay-cached', request.url);
    const resp = await fetch(overlayUrl.toString(), {
      next: { revalidate: 43200 },
    });
    if (!resp.ok) {
      return {
        etfFlows: { status: 'unavailable', error: `overlay-cached ${resp.status}` },
        reserveRisk: { status: 'unavailable', error: `overlay-cached ${resp.status}` },
        puellMultiple: { status: 'unavailable', error: `overlay-cached ${resp.status}` },
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
    // Price + klines come from Hyperliquid BTC perp (what the user actually trades).
    // Funding/OI signal stays on Bybit linear — its thresholds are calibrated to
    // Bybit's 8h funding rate, whereas Hyperliquid funding is hourly (~8x smaller).
    const [klinesD, klinesW, klines4H, klines12H, klines1H, perpCtx, perpTicker, overlayData] = await Promise.all([
      getKlines('BTC', 'D', 200),
      getKlines('BTC', 'W', 200),
      getKlines('BTC', '240', 200),
      getKlines('BTC', '720', 200),
      getKlines('BTC', '60', 200),
      getPerpContext('BTC'),
      getCurrentFundingAndOI('BTCUSDT'),
      getOverlayViaCachedRoute(request),
    ]);

    // Funding: compare Bybit vs Hyperliquid on a common 8h basis and use whichever
    // venue's funding is larger in magnitude. Bybit's rate is already 8h; Hyperliquid
    // is hourly, so multiply by 8 to make them comparable. The chosen 8h rate feeds
    // getFundingSignals, whose threshold (0.0001) is calibrated to an 8h rate.
    const bybitFunding8h = parseFloat(perpTicker.fundingRate);
    const hlFunding8h = perpCtx.funding * 8;
    const useHyperliquidFunding = Math.abs(hlFunding8h) > Math.abs(bybitFunding8h);
    const chosenFunding8h = useHyperliquidFunding ? hlFunding8h : bybitFunding8h;
    const fundingSource = useHyperliquidFunding ? 'Hyperliquid' : 'Bybit';

    const maSignals = getMASignals(klinesD);
    const fundingSignals = getFundingSignals({ fundingRate: String(chosenFunding8h) }, fundingSource);
    const structureSignals = getStructureSignals(klinesD);
    const srSignals = getSRSignals(klinesD);
    const rangeSignals = getRangeSignals(klinesD);
    const mtfSignals = getMultiTimeframeSignals(klinesD, klinesW);
    const triggerSignals = getTriggerSignals(klines4H, klines12H);
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
      ...triggerSignals,
      ...volProfileSignals,
      ...setupSignals,
      ...entryFilterSignals,
      ...overlaySignals,
    ];

    const snapshot = {
      price: perpCtx.markPx,
      priceChangePercent24h: perpCtx.change24hPercent,
      lastUpdated: new Date().toISOString(),
      klines: {
        d: klinesD,
        w: klinesW,
        h4: klines4H,
        h12: klines12H,
        h1: klines1H,
      },
      funding: {
        current: chosenFunding8h,
        source: fundingSource,
        bybit8h: bybitFunding8h,
        hyperliquid8h: hlFunding8h,
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

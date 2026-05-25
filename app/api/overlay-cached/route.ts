import { NextResponse } from 'next/server';
import { getOverlayData } from '@/lib/overlay';

// Layer 3 of the overlay caching defense — Vercel edge cache shares this
// response across all function instances and regions.
//
// 43_200 seconds = 12 hours. Combined with the in-module rate limiter in
// lib/overlay/index.ts, this guarantees at most 2 upstream calls per 24h.
export const revalidate = 43200;

export async function GET() {
  const data = await getOverlayData();
  return NextResponse.json(data);
}

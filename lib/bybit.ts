import { Kline } from '@/types/signals';

const BASE_URL = 'https://api.bybit.com';

export async function getKlines(symbol: string, interval: string, limit: number = 200): Promise<Kline[]> {
  const url = `${BASE_URL}/v5/market/kline?category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.retCode !== 0) {
    throw new Error(`Bybit API error: ${data.retMsg}`);
  }

  return data.result.list.map((k: string[]) => ({
    time: parseInt(k[0]) / 1000,
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    turnover: parseFloat(k[6]),
  })).reverse();
}

export async function getTickers(symbol: string) {
  const url = `${BASE_URL}/v5/market/tickers?category=spot&symbol=${symbol}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.retCode !== 0) {
    throw new Error(`Bybit API error: ${data.retMsg}`);
  }

  return data.result.list[0];
}

export async function getFundingHistory(symbol: string, limit: number = 20) {
  const url = `${BASE_URL}/v5/market/funding/history?category=linear&symbol=${symbol}&limit=${limit}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.retCode !== 0) {
    throw new Error(`Bybit API error: ${data.retMsg}`);
  }

  return data.result.list;
}

export async function getOpenInterest(symbol: string, interval: string = '1h', limit: number = 20) {
  const url = `${BASE_URL}/v5/market/open-interest?category=linear&symbol=${symbol}&intervalTime=${interval}&limit=${limit}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.retCode !== 0) {
    throw new Error(`Bybit API error: ${data.retMsg}`);
  }

  return data.result.list;
}

export async function getCurrentFundingAndOI(symbol: string) {
  const url = `${BASE_URL}/v5/market/tickers?category=linear&symbol=${symbol}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.retCode !== 0) {
    throw new Error(`Bybit API error: ${data.retMsg}`);
  }

  return data.result.list[0];
}

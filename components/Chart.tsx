'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, CandlestickData, Time, IChartApi } from 'lightweight-charts';
import { Kline } from '@/types/signals';

interface ChartProps {
  data: Kline[];
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
}

export default function Chart({
  data,
  colors: {
    backgroundColor = 'transparent',
    textColor = '#d1d5db',
  } = {},
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (!chartContainerRef.current) return;
      chartRef.current?.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        fontSize: 11,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      autoSize: true,
      grid: {
        vertLines: { color: 'rgba(197, 203, 206, 0.1)' },
        horzLines: { color: 'rgba(197, 203, 206, 0.1)' },
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.2)',
        rightOffset: 4,
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.2)',
        minimumWidth: 56,
      },
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const seriesData: CandlestickData<Time>[] = data.map((k) => ({
      time: k.time as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));
    candleSeries.setData(seriesData);

    chart.timeScale().fitContent();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, backgroundColor, textColor]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}

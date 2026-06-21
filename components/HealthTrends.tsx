"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TimelineEvent } from "@/lib/healthTimeline";

/**
 * Health Trends — plots numeric lab values over time from logged test-result events.
 * A premium feature: longitudinal view of the same marker across multiple reports.
 *
 * Test-result events have titles like "HbA1c: 7.10 % (High)". We parse the test
 * name + numeric value, group by test, and chart any marker with 2+ data points.
 */

interface DataPoint {
  ts: number;
  value: number;
  raw: string;
}
interface Series {
  name: string;
  unit: string;
  points: DataPoint[];
}

function parseTestEvent(e: TimelineEvent): { name: string; value: number; unit: string } | null {
  // title format: "HbA1c: 7.10 % (High)"  or  "Total Bilirubin: 5.00 mg/dL (Critically Critical)"
  const m = e.title.match(/^(.+?):\s*([\d.]+)\s*([^\s(]*)/);
  if (!m) return null;
  const value = parseFloat(m[2]);
  if (!isFinite(value)) return null;
  return { name: m[1].trim(), value, unit: (m[3] || "").trim() };
}

function buildSeries(events: TimelineEvent[]): Series[] {
  const map = new Map<string, Series>();
  for (const e of events) {
    if (e.type !== "test-result") continue;
    const parsed = parseTestEvent(e);
    if (!parsed) continue;
    const key = parsed.name.toLowerCase();
    if (!map.has(key)) map.set(key, { name: parsed.name, unit: parsed.unit, points: [] });
    map.get(key)!.points.push({ ts: e.timestamp, value: parsed.value, raw: e.title });
  }
  // Only markers with 2+ points make a trend; sort points chronologically.
  const series = Array.from(map.values())
    .map((s) => ({ ...s, points: s.points.sort((a, b) => a.ts - b.ts) }))
    .filter((s) => s.points.length >= 2);
  return series;
}

function Sparkline({ series }: { series: Series }) {
  const W = 280;
  const H = 70;
  const pad = 6;
  const values = series.points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const n = series.points.length;

  const x = (i: number) => pad + (i * (W - 2 * pad)) / (n - 1);
  const y = (v: number) => H - pad - ((v - min) / range) * (H - 2 * pad);

  const path = series.points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");

  const first = series.points[0].value;
  const last = series.points[series.points.length - 1].value;
  const delta = last - first;
  const trendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = delta === 0 ? "text-gray-500" : delta > 0 ? "text-orange-600" : "text-teal-600";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{series.name}</h4>
          <p className="text-xs text-gray-500">{series.points.length} readings{series.unit ? ` · ${series.unit}` : ""}</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
          {first} → {last}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[70px]" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {series.points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill="#0d9488" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{new Date(series.points[0].ts).toLocaleDateString(undefined, { month: "short", year: "2-digit" })}</span>
        <span>{new Date(series.points[series.points.length - 1].ts).toLocaleDateString(undefined, { month: "short", year: "2-digit" })}</span>
      </div>
    </div>
  );
}

export function HealthTrends({ events, isPremium, onUpgrade }: { events: TimelineEvent[]; isPremium: boolean; onUpgrade: () => void }) {
  const series = useMemo(() => buildSeries(events), [events]);

  if (series.length === 0) return null; // nothing to trend yet

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-teal-600" />
          Your Trends
          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">PRO</span>
        </h3>
        <span className="text-xs text-gray-500">{series.length} marker{series.length === 1 ? "" : "s"} tracked</span>
      </div>

      {isPremium ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {series.map((s) => (
            <Sparkline key={s.name} series={s} />
          ))}
        </div>
      ) : (
        // Locked preview for free users
        <div className="relative rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 blur-sm pointer-events-none select-none">
            {series.slice(0, 2).map((s) => (
              <Sparkline key={s.name} series={s} />
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] text-center p-4">
            <TrendingUp className="h-7 w-7 text-teal-600 mb-2" />
            <p className="font-semibold text-gray-900 text-sm">See how your health changes over time</p>
            <p className="text-xs text-gray-600 mt-1 max-w-xs">
              You have {series.length} marker{series.length === 1 ? "" : "s"} with enough data to chart (like {series[0]?.name}). Track them with Premium.
            </p>
            <button
              onClick={onUpgrade}
              className="mt-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
            >
              Unlock Trends
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

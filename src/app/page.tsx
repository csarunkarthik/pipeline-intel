"use client";

import Link from "next/link";
import { SCORED_DEALS, TEAM_QUOTA, fmt } from "@/lib/scoring";
import { BAND_COLORS } from "@/lib/healthScore";
import { ArrowRight, AlertTriangle } from "lucide-react";

const BANDS = ["Critical", "At Risk", "Monitor", "Healthy"] as const;

const BAND_BG: Record<string, string> = {
  Healthy:   "#dcfce7",
  Monitor:   "#fef9c3",
  "At Risk": "#ffedd5",
  Critical:  "#fee2e2",
};
const BAND_TEXT: Record<string, string> = {
  Healthy:   "#15803d",
  Monitor:   "#a16207",
  "At Risk": "#9a3412",
  Critical:  "#991b1b",
};

function getStats() {
  const totalCRM       = SCORED_DEALS.reduce((s, d) => s + d.arr_value,      0);
  const totalProjected = SCORED_DEALS.reduce((s, d) => s + d.projected_value, 0);
  const gap            = totalCRM - totalProjected;
  const gapPct         = Math.round((gap / totalCRM) * 100);
  const atRiskValue    = SCORED_DEALS
    .filter(d => d.band === "At Risk" || d.band === "Critical")
    .reduce((s, d) => s + d.arr_value, 0);
  const flagged        = SCORED_DEALS.filter(d => d.signals.length > 0).length;
  const critical       = SCORED_DEALS.filter(d => d.band === "Critical").length;
  return { totalCRM, totalProjected, gap, gapPct, atRiskValue, flagged, critical };
}

function getRepStats() {
  const reps: Record<string, { totalARR: number; projected: number; count: number; flagged: number; bands: Record<string, number> }> = {};
  for (const d of SCORED_DEALS) {
    if (!reps[d.rep_name]) reps[d.rep_name] = { totalARR: 0, projected: 0, count: 0, flagged: 0, bands: {} };
    reps[d.rep_name].totalARR   += d.arr_value;
    reps[d.rep_name].projected  += d.projected_value;
    reps[d.rep_name].count++;
    if (d.signals.length > 0) reps[d.rep_name].flagged++;
    reps[d.rep_name].bands[d.band] = (reps[d.rep_name].bands[d.band] ?? 0) + 1;
  }
  return Object.entries(reps).sort((a, b) => b[1].totalARR - a[1].totalARR);
}

function getHealthDist() {
  return BANDS.map(band => ({
    band,
    count: SCORED_DEALS.filter(d => d.band === band).length,
    value: SCORED_DEALS.filter(d => d.band === band).reduce((s, d) => s + d.arr_value, 0),
    color: BAND_COLORS[band],
  })).filter(b => b.count > 0);
}

export default function OverviewPage() {
  const stats = getStats();
  const reps  = getRepStats();
  const dist  = getHealthDist();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--stripe-text)" }}>
          Q2 Pipeline Overview
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--stripe-muted)" }}>
          Team of 5 reps · 25 active deals · {fmt(TEAM_QUOTA)} quota
        </p>
      </div>

      {/* ── Hero gap banner ──────────────────────────────────────────────── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--stripe-border)" }}
      >
        {/* Top strip */}
        <div
          className="px-6 py-3 flex items-center gap-2 text-sm font-medium"
          style={{ backgroundColor: "#fff1f2", borderBottom: "1px solid #fecdd3", color: "#9f1239" }}
        >
          <AlertTriangle size={14} />
          Pipeline Intel has identified a significant gap between CRM data and realistic close projections.
        </div>

        {/* Four stat cells */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0"
          style={{ backgroundColor: "var(--stripe-card)" }}
        >
          <StatCell
            label="CRM Pipeline"
            value={fmt(stats.totalCRM)}
            sub="what your CRM shows"
            valueColor="var(--stripe-text)"
          />
          <StatCell
            label="Intel Projection"
            value={fmt(stats.totalProjected)}
            sub="health + rep adjusted"
            valueColor="#0570de"
          />
          <div
            className="px-6 py-5 flex items-center gap-3"
            style={{ borderColor: "var(--stripe-border)" }}
          >
            <ArrowRight size={16} style={{ color: "#9ca3af" }} className="shrink-0" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--stripe-muted)" }}>
                Projection Gap
              </p>
              <p className="text-3xl font-bold tabular-nums" style={{ color: "#df1b41" }}>
                −{fmt(stats.gap)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--stripe-muted)" }}>
                {stats.gapPct}% of CRM pipeline at risk · not visible in your CRM
              </p>
            </div>
          </div>
          <StatCell
            label="At-Risk Value"
            value={fmt(stats.atRiskValue)}
            sub={`${stats.critical} Critical · ${stats.flagged} flagged deals`}
            valueColor="#f97316"
          />
        </div>
      </div>

      {/* ── Health distribution + CTA ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Distribution bar */}
        <div
          className="lg:col-span-2 rounded-xl border p-6"
          style={{ borderColor: "var(--stripe-border)", backgroundColor: "var(--stripe-card)" }}
        >
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--stripe-text)" }}>
            Pipeline Health Distribution
          </p>
          <div className="flex h-9 rounded-lg overflow-hidden gap-0.5">
            {dist.map(({ band, count, color }) => (
              <div
                key={band}
                style={{ width: `${(count / SCORED_DEALS.length) * 100}%`, backgroundColor: color }}
                className="flex items-center justify-center text-white text-xs font-bold"
                title={`${band}: ${count} deals`}
              >
                {count}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {dist.map(({ band, count, value, color }) => (
              <div key={band} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs" style={{ color: "var(--stripe-secondary)" }}>
                  <span className="font-semibold" style={{ color: "var(--stripe-text)" }}>{band}</span>
                  {" "}· {count} deals · {fmt(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick CTA */}
        <div
          className="rounded-xl border p-6 flex flex-col justify-between"
          style={{ borderColor: "var(--stripe-border)", backgroundColor: "#f0f7ff" }}
        >
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: "#0570de" }}>
              See every deal side-by-side
            </p>
            <p className="text-sm" style={{ color: "#1e40af" }}>
              The Pipeline Grid shows CRM value vs Intel projection vs gap for every deal.
              Worst health first, by default.
            </p>
          </div>
          <Link
            href="/pipeline"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0570de" }}
          >
            Open Pipeline Grid <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Rep Summary Table ─────────────────────────────────────────────── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--stripe-border)", backgroundColor: "var(--stripe-card)" }}
      >
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--stripe-border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--stripe-text)" }}>Rep Summary</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--stripe-border)" }}>
              {["Rep", "Deals", "CRM Pipeline", "Projected", "Gap", "Flagged", "Health Mix"].map((h, i) => (
                <th
                  key={h}
                  className={`py-3 text-xs font-semibold uppercase tracking-wide ${i === 0 ? "text-left px-6" : i < 6 ? "text-right px-4" : "px-6"}`}
                  style={{ color: "var(--stripe-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reps.map(([rep, s], idx) => {
              const g = s.totalARR - s.projected;
              const gPct = Math.round((g / s.totalARR) * 100);
              return (
                <tr
                  key={rep}
                  style={{ borderBottom: idx < reps.length - 1 ? "1px solid var(--stripe-border)" : "none" }}
                  className="hover:bg-[#f8fafc] transition-colors"
                >
                  <td className="px-6 py-3.5 font-medium text-sm" style={{ color: "var(--stripe-text)" }}>{rep}</td>
                  <td className="text-right px-4 py-3.5 tabular-nums" style={{ color: "var(--stripe-secondary)" }}>{s.count}</td>
                  <td className="text-right px-4 py-3.5 tabular-nums" style={{ color: "var(--stripe-secondary)" }}>{fmt(s.totalARR)}</td>
                  <td className="text-right px-4 py-3.5 tabular-nums font-semibold" style={{ color: "#0570de" }}>{fmt(s.projected)}</td>
                  <td className="text-right px-4 py-3.5">
                    <span className="tabular-nums font-semibold text-sm" style={{ color: "#df1b41" }}>
                      −{fmt(g)}
                    </span>
                    <p className="text-[10px] tabular-nums" style={{ color: "#9ca3af" }}>{gPct}% risk</p>
                  </td>
                  <td className="text-right px-4 py-3.5">
                    <span
                      className="font-semibold tabular-nums"
                      style={{ color: s.flagged > 2 ? "#df1b41" : s.flagged > 0 ? "#f59e0b" : "#16a34a" }}
                    >
                      {s.flagged}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex h-4 rounded overflow-hidden gap-px w-28">
                      {BANDS.map(band => {
                        const count = s.bands[band] ?? 0;
                        if (!count) return null;
                        return (
                          <div
                            key={band}
                            style={{ width: `${(count / s.count) * 100}%`, backgroundColor: BAND_COLORS[band] }}
                            title={`${band}: ${count}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {BANDS.filter(b => s.bands[b]).map(b => (
                        <span key={b} className="text-[10px]" style={{ color: BAND_COLORS[b] }}>
                          {s.bands[b]}{b[0]}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCell({ label, value, sub, valueColor }: {
  label: string; value: string; sub: string; valueColor: string;
}) {
  return (
    <div className="px-6 py-5" style={{ borderColor: "var(--stripe-border)" }}>
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--stripe-muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums" style={{ color: valueColor }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--stripe-muted)" }}>{sub}</p>
    </div>
  );
}

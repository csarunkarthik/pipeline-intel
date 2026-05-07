"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SCORED_DEALS, ScoredDeal, fmt } from "@/lib/scoring";
import { ChevronUp, ChevronDown, Filter, ArrowRight } from "lucide-react";

// ─── constants ──────────────────────────────────────────────────────────────

const STAGES       = ["All", "Qualifying", "Discovery", "Demo", "Proposal", "Negotiation"];
const REPS         = ["All", ...Array.from(new Set(SCORED_DEALS.map(d => d.rep_name))).sort()];
const BANDS        = ["All", "Critical", "At Risk", "Monitor", "Healthy"];
const FORECAST_CATS= ["All", "Commit", "Best Case", "Pipeline"];

// Stripe-style badge: light bg + darker text for each signal key
const SIGNAL_STYLES: Record<string, { bg: string; text: string }> = {
  DARK:            { bg: "#f5f3ff", text: "#5b21b6" },
  STAGNANT:        { bg: "#fef2f2", text: "#991b1b" },
  SLIPPING:        { bg: "#fff7ed", text: "#9a3412" },
  SINGLE_THREAD:   { bg: "#fffbeb", text: "#92400e" },
  OVERDUE:         { bg: "#fefce8", text: "#713f12" },
  NO_NEXT_STEP:    { bg: "#f9fafb", text: "#374151" },
  LARGE_ANOMALY:   { bg: "#ecfeff", text: "#155e75" },
  COMMIT_MISMATCH: { bg: "#fff1f2", text: "#9f1239" },
};

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

// ─── sub-components ──────────────────────────────────────────────────────────

function HealthScore({ score, band, color }: { score: number; band: string; color: string }) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-lg font-bold tabular-nums leading-none" style={{ color }}>
        {score}
      </span>
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: BAND_BG[band], color: BAND_TEXT[band] }}
      >
        {band}
      </span>
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    Qualifying:  { bg: "#f1f5f9", text: "#475569" },
    Discovery:   { bg: "#eff6ff", text: "#1d4ed8" },
    Demo:        { bg: "#faf5ff", text: "#7c3aed" },
    Proposal:    { bg: "#fffbeb", text: "#b45309" },
    Negotiation: { bg: "#fff7ed", text: "#c2410c" },
  };
  const s = styles[stage] ?? { bg: "#f1f5f9", text: "#475569" };
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {stage}
    </span>
  );
}

function Signals({ deal }: { deal: ScoredDeal }) {
  if (!deal.signals.length) return <span style={{ color: "#d1d5db" }}>—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {deal.signals.map(s => {
        const style = SIGNAL_STYLES[s.key] ?? { bg: "#f3f4f6", text: "#374151" };
        return (
          <span
            key={s.key}
            className="signal-badge"
            style={{ backgroundColor: style.bg, color: style.text }}
            title={s.description}
          >
            {s.label}
          </span>
        );
      })}
    </div>
  );
}

type SortKey = "health_score" | "arr_value" | "days_since_last_activity" | "expected_close_date" | "projected_value";

// ─── main page ───────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [stage,       setStage]       = useState("All");
  const [rep,         setRep]         = useState("All");
  const [band,        setBand]        = useState("All");
  const [forecast,    setForecast]    = useState("All");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sortKey,     setSortKey]     = useState<SortKey>("health_score");
  const [sortAsc,     setSortAsc]     = useState(true);

  const filtered = useMemo(() => {
    let d = SCORED_DEALS;
    if (stage    !== "All") d = d.filter(x => x.stage            === stage);
    if (rep      !== "All") d = d.filter(x => x.rep_name         === rep);
    if (band     !== "All") d = d.filter(x => x.band             === band);
    if (forecast !== "All") d = d.filter(x => x.forecast_category === forecast);
    if (flaggedOnly)        d = d.filter(x => x.signals.length    >  0);

    return [...d].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string")
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [stage, rep, band, forecast, flaggedOnly, sortKey, sortAsc]);

  const totals = useMemo(() => ({
    crm:       filtered.reduce((s, d) => s + d.arr_value,      0),
    projected: filtered.reduce((s, d) => s + d.projected_value, 0),
    flagged:   filtered.filter(d => d.signals.length > 0).length,
  }), [filtered]);

  const gap = totals.crm - totals.projected;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(key === "health_score"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp size={11} style={{ color: "#d1d5db" }} />;
    return sortAsc
      ? <ChevronUp  size={11} style={{ color: "#0570de" }} />
      : <ChevronDown size={11} style={{ color: "#0570de" }} />;
  }

  const resetFilters = () => {
    setStage("All"); setRep("All"); setBand("All");
    setForecast("All"); setFlaggedOnly(false);
  };

  const hasFilters = stage !== "All" || rep !== "All" || band !== "All" || forecast !== "All" || flaggedOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--stripe-text)" }}>
            Pipeline Grid
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--stripe-muted)" }}>
            {filtered.length} of {SCORED_DEALS.length} deals · sorted by worst health first
          </p>
        </div>
      </div>

      {/* ── Summary strip — the product story ─────────────────────────────── */}
      <div
        className="rounded-xl border mb-5 overflow-hidden"
        style={{ borderColor: "var(--stripe-border)", backgroundColor: "var(--stripe-card)" }}
      >
        <div className="grid grid-cols-4 divide-x" style={{ borderColor: "var(--stripe-border)" }}>
          <SummaryCell
            label="CRM Pipeline"
            value={fmt(totals.crm)}
            sub="what your CRM shows"
            valueColor="var(--stripe-text)"
          />
          <SummaryCell
            label="Pipeline Intel Projection"
            value={fmt(totals.projected)}
            sub="health + rep adjusted"
            valueColor="#0570de"
          />
          <div className="px-6 py-4 flex items-center gap-3">
            <ArrowRight size={16} style={{ color: "#9ca3af" }} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--stripe-muted)" }}>
                Projection Gap
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: "#df1b41" }}>
                −{fmt(gap)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--stripe-muted)" }}>
                CRM overstatement
              </p>
            </div>
          </div>
          <SummaryCell
            label="Deals Flagged"
            value={`${totals.flagged}`}
            sub={`of ${filtered.length} have risk signals`}
            valueColor={totals.flagged > 5 ? "#df1b41" : "#0570de"}
          />
        </div>
      </div>

      <div className="flex gap-5">

        {/* ── Sidebar filters ──────────────────────────────────────────────── */}
        <aside className="w-48 shrink-0">
          <div
            className="rounded-xl border p-4 space-y-4"
            style={{ borderColor: "var(--stripe-border)", backgroundColor: "var(--stripe-card)" }}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--stripe-muted)" }}
              >
                <Filter size={11} /> Filters
              </span>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-medium hover:underline"
                  style={{ color: "#0570de" }}
                >
                  Reset
                </button>
              )}
            </div>

            <FilterSelect label="Stage"    options={STAGES}        value={stage}    onChange={setStage} />
            <FilterSelect label="Rep"      options={REPS}          value={rep}      onChange={setRep} />
            <FilterSelect label="Health"   options={BANDS}         value={band}     onChange={setBand} />
            <FilterSelect label="Forecast" options={FORECAST_CATS} value={forecast} onChange={setForecast} />

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <div
                onClick={() => setFlaggedOnly(v => !v)}
                className="w-8 h-4 rounded-full transition-colors cursor-pointer flex items-center px-0.5"
                style={{ backgroundColor: flaggedOnly ? "#0570de" : "#e5e7eb" }}
              >
                <div
                  className="w-3 h-3 rounded-full bg-white shadow transition-transform"
                  style={{ transform: flaggedOnly ? "translateX(16px)" : "translateX(0)" }}
                />
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--stripe-secondary)" }}>
                Flagged only
              </span>
            </label>
          </div>
        </aside>

        {/* ── Deal table ───────────────────────────────────────────────────── */}
        <div
          className="flex-1 min-w-0 rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--stripe-border)", backgroundColor: "var(--stripe-card)" }}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--stripe-border)", backgroundColor: "#f8fafc" }}>
                {/* color strip */}
                <th className="w-1 p-0" />
                <Th align="left" className="pl-4 pr-3 py-3 w-56">Deal</Th>
                <Th align="left" className="px-3 py-3">Stage</Th>
                <Th align="left" className="px-3 py-3" sortKey="health_score" current={sortKey} asc={sortAsc} onSort={toggleSort}>
                  Health <SortIcon k="health_score" />
                </Th>
                <Th align="right" className="px-3 py-3" sortKey="arr_value" current={sortKey} asc={sortAsc} onSort={toggleSort}>
                  CRM Value <SortIcon k="arr_value" />
                </Th>
                <Th align="right" className="px-3 py-3" sortKey="projected_value" current={sortKey} asc={sortAsc} onSort={toggleSort}>
                  Projected <SortIcon k="projected_value" />
                </Th>
                <Th align="right" className="px-3 py-3">Gap</Th>
                <Th align="left" className="px-3 py-3">Risk Signals</Th>
                <Th align="right" className="px-3 py-3" sortKey="days_since_last_activity" current={sortKey} asc={sortAsc} onSort={toggleSort}>
                  Dark <SortIcon k="days_since_last_activity" />
                </Th>
                <Th align="right" className="pr-4 pl-3 py-3">Close</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center text-sm" style={{ color: "var(--stripe-muted)" }}>
                    No deals match the current filters.
                  </td>
                </tr>
              )}
              {filtered.map(deal => {
                const dealGap = deal.arr_value - deal.projected_value;
                const gapPct  = Math.round((dealGap / deal.arr_value) * 100);
                return (
                  <tr
                    key={deal.deal_id}
                    className="deal-row transition-colors cursor-pointer"
                    style={{ borderBottom: "1px solid var(--stripe-border)" }}
                  >
                    {/* Health-band left strip */}
                    <td className="p-0 w-1">
                      <div className="w-1 h-full min-h-[52px]" style={{ backgroundColor: deal.band_color }} />
                    </td>

                    {/* Deal name + rep */}
                    <td className="pl-4 pr-3 py-3">
                      <Link href={`/deal/${deal.deal_id}`} className="block group">
                        <p
                          className="font-medium text-sm leading-tight group-hover:underline"
                          style={{ color: "var(--stripe-text)" }}
                        >
                          {deal.deal_name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--stripe-muted)" }}>
                          {deal.rep_name}
                        </p>
                      </Link>
                    </td>

                    {/* Stage */}
                    <td className="px-3 py-3">
                      <StageBadge stage={deal.stage} />
                    </td>

                    {/* Health score */}
                    <td className="px-3 py-3">
                      <HealthScore score={deal.health_score} band={deal.band} color={deal.band_color} />
                    </td>

                    {/* CRM Value */}
                    <td className="px-3 py-3 text-right tabular-nums font-medium" style={{ color: "var(--stripe-text)" }}>
                      {fmt(deal.arr_value)}
                    </td>

                    {/* Projected */}
                    <td className="px-3 py-3 text-right tabular-nums font-semibold" style={{ color: "#0570de" }}>
                      {fmt(deal.projected_value)}
                    </td>

                    {/* Gap — the aha column */}
                    <td className="px-3 py-3 text-right">
                      <span className="tabular-nums font-semibold text-sm" style={{ color: "#df1b41" }}>
                        −{fmt(dealGap)}
                      </span>
                      <p className="text-[10px] tabular-nums" style={{ color: "#9ca3af" }}>
                        {gapPct}% at risk
                      </p>
                    </td>

                    {/* Signals */}
                    <td className="px-3 py-3 max-w-[200px]">
                      <Signals deal={deal} />
                    </td>

                    {/* Dark days */}
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span
                        className="text-sm font-medium"
                        style={{ color: deal.days_since_last_activity >= 14 ? "#df1b41" : "var(--stripe-secondary)" }}
                      >
                        {deal.days_since_last_activity}d
                      </span>
                    </td>

                    {/* Close date */}
                    <td className="pr-4 pl-3 py-3 text-right text-xs tabular-nums" style={{ color: "var(--stripe-muted)" }}>
                      {deal.expected_close_date.slice(5)}
                      {deal.close_date_changes > 0 && (
                        <span className="ml-1" style={{ color: "#f59e0b" }}>↻{deal.close_date_changes}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table footer */}
          {filtered.length > 0 && (
            <div
              className="flex items-center justify-between px-4 py-3 text-xs border-t"
              style={{ borderColor: "var(--stripe-border)", color: "var(--stripe-muted)" }}
            >
              <span>{filtered.length} deals shown</span>
              <span>
                Total gap on view:{" "}
                <strong style={{ color: "#df1b41" }}>−{fmt(gap)}</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── helper components ────────────────────────────────────────────────────────

function SummaryCell({ label, value, sub, valueColor }: {
  label: string; value: string; sub: string; valueColor: string;
}) {
  return (
    <div className="px-6 py-4">
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--stripe-muted)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums" style={{ color: valueColor }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--stripe-muted)" }}>{sub}</p>
    </div>
  );
}

function FilterSelect({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium mb-1" style={{ color: "var(--stripe-muted)" }}>{label}</p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2"
        style={{
          border: "1px solid var(--stripe-border)",
          backgroundColor: "var(--stripe-card)",
          color: "var(--stripe-secondary)",
        }}
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Th({
  children, align, className, sortKey: sk, current, asc, onSort,
}: {
  children: React.ReactNode;
  align: "left" | "right";
  className?: string;
  sortKey?: SortKey;
  current?: SortKey;
  asc?: boolean;
  onSort?: (k: SortKey) => void;
}) {
  const base = `text-xs font-semibold uppercase tracking-wide select-none ${align === "right" ? "text-right" : "text-left"} ${className ?? ""}`;
  const style = { color: "var(--stripe-muted)" };

  if (sk && onSort) {
    return (
      <th className={base} style={style}>
        <button
          onClick={() => onSort(sk)}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          style={{ marginLeft: align === "right" ? "auto" : undefined }}
        >
          {children}
        </button>
      </th>
    );
  }
  return <th className={base} style={style}>{children}</th>;
}

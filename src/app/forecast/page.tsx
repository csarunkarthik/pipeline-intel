"use client";

import React from "react";
import Link from "next/link";
import { SCORED_DEALS, ScoredDeal, TEAM_QUOTA, fmt } from "@/lib/scoring";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Scenario {
  label: string;
  description: string;
  deals: ScoredDeal[];
  extraDeals: ScoredDeal[];
  value: number;
  color: string;
  icon: React.ElementType;
}

function buildScenarios(): Scenario[] {
  const commitDeals = SCORED_DEALS.filter(d => d.forecast_category === "Commit");
  const bestCaseDeals = SCORED_DEALS.filter(d => d.forecast_category === "Best Case");

  return [
    {
      label: "Best Case",
      description: "All Commit + Best Case deals close at projected value",
      deals: [...commitDeals, ...bestCaseDeals],
      extraDeals: [],
      value: [...commitDeals, ...bestCaseDeals].reduce((s, d) => s + d.projected_value, 0),
      color: "#22c55e",
      icon: TrendingUp,
    },
    {
      label: "Expected",
      description: "All Commit deals + 50% of Best Case deals at projected value",
      deals: commitDeals,
      extraDeals: bestCaseDeals,
      value: Math.round(
        commitDeals.reduce((s, d) => s + d.projected_value, 0) +
        bestCaseDeals.reduce((s, d) => s + d.projected_value * 0.5, 0)
      ),
      color: "#3b82f6",
      icon: Minus,
    },
    {
      label: "Worst Case",
      description: "Only Commit deals, at 75% of projected value",
      deals: commitDeals,
      extraDeals: [],
      value: Math.round(commitDeals.reduce((s, d) => s + d.projected_value * 0.75, 0)),
      color: "#ef4444",
      icon: TrendingDown,
    },
  ];
}

function CoverageBar({ value, quota }: { value: number; quota: number }) {
  const pct = Math.min((value / quota) * 100, 100);
  const color = pct >= 90 ? "#22c55e" : pct >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Coverage vs {fmt(quota)} quota</span>
        <span className="font-semibold" style={{ color }}>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-full transition-all" />
      </div>
    </div>
  );
}

function DealRow({ deal }: { deal: ScoredDeal }) {
  return (
    <Link href={`/deal/${deal.deal_id}`} className="flex items-center justify-between py-2 hover:bg-slate-50 px-3 -mx-3 rounded-lg transition-colors">
      <div>
        <p className="text-sm font-medium text-slate-700 leading-tight">{deal.deal_name}</p>
        <p className="text-xs text-slate-400">{deal.rep_name} · {deal.stage}</p>
      </div>
      <div className="text-right ml-4">
        <p className="text-sm font-semibold" style={{ color: deal.band_color }}>{fmt(deal.projected_value)}</p>
        <p className="text-xs text-slate-400">of {fmt(deal.arr_value)}</p>
      </div>
    </Link>
  );
}

export default function ForecastPage() {
  const scenarios = buildScenarios();
  const totalCRMCommit = SCORED_DEALS.filter(d => d.forecast_category === "Commit").reduce((s, d) => s + d.arr_value, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Forecast View</h1>
        <p className="text-slate-500 text-sm mt-1">Three scenarios based on deal health and rep performance</p>
      </div>

      {/* CRM vs Reality callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-amber-800 mb-1">CRM &ldquo;Commit&rdquo; total: {fmt(totalCRMCommit)}</p>
        <p className="text-sm text-amber-700">
          Reps have committed {fmt(totalCRMCommit)} to close this quarter. Pipeline Intel projects{" "}
          <strong>{fmt(scenarios[1].value)}</strong> (expected scenario) after health adjustments — a{" "}
          <strong>−{fmt(totalCRMCommit - scenarios[1].value)}</strong> gap from what the CRM is showing.
        </p>
      </div>

      {/* Scenario cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {scenarios.map(scenario => {
          const Icon = scenario.icon;
          return (
            <div key={scenario.label} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} style={{ color: scenario.color }} />
                <h2 className="font-semibold text-slate-800">{scenario.label}</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">{scenario.description}</p>

              <div className="text-4xl font-bold mb-1" style={{ color: scenario.color }}>
                {fmt(scenario.value)}
              </div>
              <p className="text-xs text-slate-500">{scenario.deals.length} deals · {fmt(TEAM_QUOTA)} target</p>

              <CoverageBar value={scenario.value} quota={TEAM_QUOTA} />

              <div className="mt-5 border-t border-slate-100 pt-4 space-y-0.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Included deals</p>
                {scenario.deals.map(d => <DealRow key={d.deal_id} deal={d} />)}
                {scenario.extraDeals.length > 0 && (
                  <>
                    <p className="text-xs text-slate-400 pt-2 pb-1">+ 50% of Best Case</p>
                    {scenario.extraDeals.map(d => <DealRow key={d.deal_id} deal={d} />)}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gap table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Scenario Comparison</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-medium uppercase tracking-wide">
              <th className="text-left px-6 py-3">Scenario</th>
              <th className="text-right px-4 py-3">Value</th>
              <th className="text-right px-4 py-3">vs Quota</th>
              <th className="text-right px-4 py-3">vs CRM Commit</th>
              <th className="text-right px-6 py-3">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scenarios.map(s => {
              const vsQuota = s.value - TEAM_QUOTA;
              const vsCRM = s.value - totalCRMCommit;
              const coverage = Math.round((s.value / TEAM_QUOTA) * 100);
              return (
                <tr key={s.label}>
                  <td className="px-6 py-4 font-medium" style={{ color: s.color }}>{s.label}</td>
                  <td className="text-right px-4 py-4 font-semibold text-slate-800">{fmt(s.value)}</td>
                  <td className={`text-right px-4 py-4 font-medium ${vsQuota >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {vsQuota >= 0 ? "+" : ""}{fmt(Math.abs(vsQuota))} {vsQuota < 0 ? "short" : "over"}
                  </td>
                  <td className={`text-right px-4 py-4 ${vsCRM >= 0 ? "text-slate-500" : "text-red-600"}`}>
                    {vsCRM >= 0 ? "+" : "−"}{fmt(Math.abs(vsCRM))}
                  </td>
                  <td className="text-right px-6 py-4 font-semibold" style={{ color: s.color }}>
                    {coverage}%
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

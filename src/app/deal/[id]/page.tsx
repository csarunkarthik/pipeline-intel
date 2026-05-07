"use client";

import { use } from "react";
import Link from "next/link";
import { SCORED_DEALS, ScoredDeal, fmt } from "@/lib/scoring";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export default function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const deal = SCORED_DEALS.find(d => d.deal_id === id);

  if (!deal) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">Deal not found.</p>
        <Link href="/pipeline" className="text-blue-600 hover:underline text-sm mt-2 inline-block">← Back to Pipeline</Link>
      </div>
    );
  }

  const gaugeData = [
    { value: deal.health_score },
    { value: 100 - deal.health_score },
  ];

  const breakdownData = Object.entries(deal.score_breakdown)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, penalty]) => ({ name, penalty }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Back + header */}
      <div>
        <Link href="/pipeline" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft size={14} /> Back to Pipeline
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{deal.deal_name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {deal.rep_name} · {deal.region} · {deal.stage} · {deal.forecast_category}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-800">{fmt(deal.arr_value)}</p>
            <p className="text-sm text-slate-400">ARR</p>
          </div>
        </div>
      </div>

      {/* Score + Breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gauge */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center">
          <p className="text-sm font-semibold text-slate-600 mb-2">Health Score</p>
          <div className="relative">
            <PieChart width={220} height={130}>
              <Pie
                data={gaugeData}
                startAngle={180}
                endAngle={0}
                innerRadius={65}
                outerRadius={100}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill={deal.band_color} />
                <Cell fill="#e2e8f0" />
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
              <span className="text-4xl font-bold" style={{ color: deal.band_color }}>{deal.health_score}</span>
              <span className="text-xs font-semibold text-slate-500 mt-0.5">{deal.band}</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 w-full text-center text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-400 text-xs">CRM Value</p>
              <p className="font-bold text-slate-700 mt-0.5">{fmt(deal.arr_value)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-blue-400 text-xs">Projected Value</p>
              <p className="font-bold text-blue-700 mt-0.5">{fmt(deal.projected_value)}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Projected = ARR × stage rate × health × rep performance
          </p>
        </div>

        {/* Penalty Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm font-semibold text-slate-600 mb-4">Score Breakdown</p>
          {breakdownData.length === 0 ? (
            <p className="text-slate-400 text-sm">No penalties — this deal is healthy.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={breakdownData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <XAxis type="number" domain={[0, 30]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v) => [`−${v} pts`, "Penalty"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="penalty" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">
              Started at <strong>100</strong> · Total penalty: <strong>−{100 - deal.health_score}</strong> · Final score: <strong style={{ color: deal.band_color }}>{deal.health_score}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Deal Info Row */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-sm font-semibold text-slate-700 mb-4">Deal Details</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Detail label="Created" value={deal.deal_created_date} />
          <Detail label="Original Close" value={deal.original_close_date} />
          <Detail label="Current Close" value={deal.expected_close_date} highlight={deal.close_date_changes > 0} />
          <Detail label="Close Date Changes" value={`${deal.close_date_changes}×`} highlight={deal.close_date_changes >= 2} />
          <Detail label="Days Since Activity" value={`${deal.days_since_last_activity}d (${deal.last_activity_type})`} highlight={deal.days_since_last_activity >= 14} />
          <Detail label="Activities (30d)" value={`${deal.total_activities_last_30d}`} />
          <Detail label="Stakeholders" value={`${deal.stakeholder_count}`} highlight={deal.stakeholder_count === 1} />
          <Detail label="Next Step" value={deal.next_step_defined ? "Defined" : "Missing"} highlight={!deal.next_step_defined} />
        </div>
      </div>

      {/* Risk Signals */}
      {deal.signals.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Risk Signals & Recommended Actions</p>
          {deal.signals.map(signal => (
            <div key={signal.key} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3">
              <div className="shrink-0 mt-0.5">
                <AlertTriangle size={16} style={{ color: signal.color }} />
              </div>
              <div>
                <span
                  className="signal-badge text-white mb-2 inline-flex"
                  style={{ backgroundColor: signal.color }}
                >
                  {signal.label}
                </span>
                <p className="text-sm text-slate-600 mt-1">{signal.description}</p>
                <p className="text-sm font-medium text-slate-800 mt-2">{signal.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className={`font-medium mt-0.5 ${highlight ? "text-red-600" : "text-slate-700"}`}>{value}</p>
    </div>
  );
}

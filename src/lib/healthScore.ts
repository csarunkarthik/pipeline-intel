import { Deal, STAGE_BENCHMARKS } from "@/data/deals";

function daysInStage(stageEntryDate: string): number {
  const entry = new Date(stageEntryDate);
  const today = new Date();
  return Math.floor((today.getTime() - entry.getTime()) / 86400000);
}

function agePenalty(deal: Deal): number {
  const ratio = deal.total_deal_age_days / deal.avg_cycle_length_days;
  if (ratio < 0.75) return 0;
  if (ratio < 1.0) return 5;
  if (ratio < 1.25) return 12;
  if (ratio < 1.5) return 20;
  return 25;
}

function activityPenalty(deal: Deal): number {
  const days = deal.days_since_last_activity;
  const thresholds: Record<string, [number, number, number]> = {
    Qualifying:  [14, 21, 30],
    Discovery:   [10, 18, 25],
    Demo:        [7,  14, 21],
    Proposal:    [5,  10, 18],
    Negotiation: [3,   7, 14],
  };
  const [low, mid, high] = thresholds[deal.stage] ?? [10, 18, 25];
  if (days <= low) return 0;
  if (days <= mid) return 10;
  if (days <= high) return 20;
  return 30;
}

function slippagePenalty(deal: Deal): number {
  const c = deal.close_date_changes;
  if (c === 0) return 0;
  if (c === 1) return 5;
  if (c === 2) return 12;
  return 20;
}

function stageVelocityPenalty(deal: Deal): number {
  const benchmark = STAGE_BENCHMARKS[deal.stage] ?? 21;
  const days = daysInStage(deal.stage_entry_date);
  const ratio = days / benchmark;
  if (ratio < 1.0) return 0;
  if (ratio < 1.5) return 8;
  if (ratio < 2.0) return 14;
  return 20;
}

function singleThreadPenalty(deal: Deal): number {
  const late = deal.stage === "Proposal" || deal.stage === "Negotiation";
  if (deal.stakeholder_count === 1 && late) return 15;
  if (deal.stakeholder_count === 1) return 8;
  if (deal.stakeholder_count === 2) return 3;
  return 0;
}

function sizeAnomalyPenalty(deal: Deal): number {
  if (deal.median_deal_size === 0) return 0;
  const ratio = deal.arr_value / deal.median_deal_size;
  if (ratio > 3.0) return 10;
  if (ratio > 2.0) return 5;
  return 0;
}

function nextStepPenalty(deal: Deal): number {
  if (deal.next_step_defined) return 0;
  const late = deal.stage === "Proposal" || deal.stage === "Negotiation";
  return late ? 10 : 5;
}

export function computeHealthScore(deal: Deal): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    "Deal Age":       agePenalty(deal),
    "Activity Gap":   activityPenalty(deal),
    "Slippage":       slippagePenalty(deal),
    "Stage Velocity": stageVelocityPenalty(deal),
    "Single-Thread":  singleThreadPenalty(deal),
    "Size Anomaly":   sizeAnomalyPenalty(deal),
    "No Next Step":   nextStepPenalty(deal),
  };
  const totalPenalty = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score: Math.max(0, 100 - totalPenalty), breakdown };
}

export function scoreBand(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Monitor";
  if (score >= 40) return "At Risk";
  return "Critical";
}

export const BAND_COLORS: Record<string, string> = {
  Healthy:  "#22c55e",
  Monitor:  "#f59e0b",
  "At Risk": "#f97316",
  Critical: "#ef4444",
};

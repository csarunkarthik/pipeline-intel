import { Deal, STAGE_BENCHMARKS } from "@/data/deals";

const SIGNAL_META: Record<string, [string, string]> = {
  DARK:            ["No Activity",     "#7c3aed"],
  STAGNANT:        ["Stage Stagnant",  "#dc2626"],
  SLIPPING:        ["Date Slipping",   "#ea580c"],
  SINGLE_THREAD:   ["Single-Threaded", "#d97706"],
  OVERDUE:         ["Overdue",         "#b45309"],
  NO_NEXT_STEP:    ["No Next Step",    "#6b7280"],
  LARGE_ANOMALY:   ["Size Anomaly",    "#0891b2"],
  COMMIT_MISMATCH: ["Commit Risk",     "#be123c"],
};

const ACTION_SUGGESTIONS: Record<string, string> = {
  DARK:            "No activity logged in 14+ days. Recommend: immediate outreach to re-engage the champion.",
  STAGNANT:        "Deal has been in this stage more than 2× the expected duration. Recommend: qualify whether the deal is still active or should be marked lost.",
  SLIPPING:        "Close date has changed 2+ times. Recommend: re-qualify timeline and confirm decision process in next call.",
  SINGLE_THREAD:   "Only 1 contact engaged at a late stage. Recommend: request introduction to economic buyer before next steps.",
  NO_NEXT_STEP:    "No next step defined at Proposal or Negotiation stage. Recommend: agree on a specific action with a date before leaving the call.",
  OVERDUE:         "Deal age exceeds expected cycle by 25%+. Recommend: internal review to assess if deal should be re-staged or deprioritized.",
  LARGE_ANOMALY:   "Deal is 3× larger than rep's recent median. Recommend: assign additional support and validate the buying process is understood.",
  COMMIT_MISMATCH: "Deal is in Commit category but health score is below 50. Recommend: de-commit this deal until signals improve.",
};

export interface Signal {
  key: string;
  label: string;
  color: string;
  description: string;
  action: string;
}

function daysInStage(stageEntryDate: string): number {
  const entry = new Date(stageEntryDate);
  const today = new Date();
  return Math.floor((today.getTime() - entry.getTime()) / 86400000);
}

export function detectSignals(deal: Deal, healthScore: number): Signal[] {
  const signals: Signal[] = [];

  function add(key: string, description: string) {
    const [label, color] = SIGNAL_META[key];
    signals.push({ key, label, color, description, action: ACTION_SUGGESTIONS[key] });
  }

  if (deal.days_since_last_activity >= 14) {
    add("DARK", `Last activity: ${deal.days_since_last_activity} days ago (${deal.last_activity_type}).`);
  }

  const benchmark = STAGE_BENCHMARKS[deal.stage] ?? 21;
  const days = daysInStage(deal.stage_entry_date);
  if (days > benchmark * 2) {
    add("STAGNANT", `In ${deal.stage} stage for ${days} days (benchmark: ${benchmark} days).`);
  }

  if (deal.close_date_changes >= 2) {
    add("SLIPPING", `Close date changed ${deal.close_date_changes} times (originally ${deal.original_close_date}).`);
  }

  if (deal.stakeholder_count === 1 && (deal.stage === "Proposal" || deal.stage === "Negotiation")) {
    add("SINGLE_THREAD", `Only 1 stakeholder engaged at ${deal.stage} stage.`);
  }

  if (deal.total_deal_age_days > deal.avg_cycle_length_days * 1.25) {
    add("OVERDUE", `Deal is ${deal.total_deal_age_days} days old vs ${deal.avg_cycle_length_days}-day benchmark.`);
  }

  if (!deal.next_step_defined && (deal.stage === "Proposal" || deal.stage === "Negotiation")) {
    add("NO_NEXT_STEP", "No next step defined at a late deal stage.");
  }

  if (deal.median_deal_size > 0 && deal.arr_value > deal.median_deal_size * 3.0) {
    const ratio = deal.arr_value / deal.median_deal_size;
    add("LARGE_ANOMALY", `Deal is ${ratio.toFixed(1)}× this rep's median deal size ($${deal.median_deal_size.toLocaleString()}).`);
  }

  if (deal.forecast_category === "Commit" && healthScore < 50) {
    add("COMMIT_MISMATCH", `Forecast category is Commit but health score is only ${healthScore}.`);
  }

  return signals;
}

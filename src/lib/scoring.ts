import { Deal, DEALS } from "@/data/deals";
import { computeHealthScore, scoreBand, BAND_COLORS } from "./healthScore";
import { detectSignals, Signal } from "./riskSignals";

export interface ScoredDeal extends Deal {
  health_score: number;
  score_breakdown: Record<string, number>;
  band: string;
  band_color: string;
  signals: Signal[];
  projected_value: number;
}

const STAGE_BASE_RATES: Record<string, number> = {
  Qualifying:  0.10,
  Discovery:   0.20,
  Demo:        0.35,
  Proposal:    0.50,
  Negotiation: 0.65,
};

const HEALTH_MULTIPLIERS: Record<string, number> = {
  Healthy:   1.1,
  Monitor:   1.0,
  "At Risk": 0.7,
  Critical:  0.4,
};

const REP_MULTIPLIERS: Record<string, number> = {
  "Jordan Lee":    1.05,
  "Priya Sharma":  0.95,
  "Marcus Webb":   0.85,
  "Elena Vasquez": 0.90,
  "David Kim":     1.15,
};

export const TEAM_QUOTA = 1_200_000;

function scoreOneDeal(deal: Deal): ScoredDeal {
  const { score, breakdown } = computeHealthScore(deal);
  const band = scoreBand(score);
  const signals = detectSignals(deal, score);

  const baseRate = STAGE_BASE_RATES[deal.stage] ?? 0.25;
  const healthMult = HEALTH_MULTIPLIERS[band] ?? 1.0;
  const repMult = REP_MULTIPLIERS[deal.rep_name] ?? 1.0;
  const projected_value = Math.round(deal.arr_value * baseRate * healthMult * repMult);

  return {
    ...deal,
    health_score: score,
    score_breakdown: breakdown,
    band,
    band_color: BAND_COLORS[band],
    signals,
    projected_value,
  };
}

export const SCORED_DEALS: ScoredDeal[] = DEALS.map(scoreOneDeal);

export function fmt(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

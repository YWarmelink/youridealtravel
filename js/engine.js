import { EUROPE_TRIPS, EUROPE_TRIP_COST } from "../data/destinations.js";

export function tripCost(dest) {
  return dest.flight + dest.dailyCost * dest.tripDays;
}

export function seasonScore(dest, month) {
  if (dest.bestMonths.includes(month)) return 40;
  const prev = month === 1 ? 12 : month - 1;
  const next = month === 12 ? 1 : month + 1;
  if (dest.bestMonths.includes(prev) || dest.bestMonths.includes(next)) return 15;
  return 0;
}

// Best possible season score for a destination across the whole year
function bestSeasonScore(dest) {
  return Math.max(...[1,2,3,4,5,6,7,8,9,10,11,12].map(m => seasonScore(dest, m)));
}

// Score a single destination independent of month (for pre-sorting)
export function scoreDestination(dest, state) {
  const cost = tripCost(dest);
  const perTripShare = (state.budget - EUROPE_TRIPS * EUROPE_TRIP_COST) / 3;

  // Budget fit (0–30)
  const ratio = cost / perTripShare;
  const budgetScore =
    ratio <= 0.80 ? 30 :
    ratio <= 1.00 ? 22 :
    ratio <= 1.20 ? 10 :
    ratio <= 1.40 ? 2 : -15;

  // Class value (Class 1 = most rewarded for value efficiency)
  const classScore = dest.class === 1 ? 20 : dest.class === 2 ? 12 : 8;

  return bestSeasonScore(dest) + budgetScore + classScore;
}

// Score a fully assembled plan
export function scorePlan(plan, state) {
  const { trips, totalCost } = plan;
  if (!trips.length) return -999;

  let s = 0;

  // Budget efficiency: prefer 80–95% of budget used
  const eff = totalCost / state.budget;
  if      (eff >= 0.80 && eff <= 0.95) s += 40;
  else if (eff >= 0.70 && eff <= 1.05) s += 20;
  else if (eff < 0.60)                 s -= 30; // way under — wasted budget
  else if (eff > 1.10)                 s -= 20; // over budget

  // Season fit (average across trips, max 40/trip)
  const avgSeason = trips.reduce((sum, t) => sum + seasonScore(t, t.startMonth), 0) / trips.length;
  s += avgSeason;

  // Region diversity (each unique region +10)
  const regions = new Set(trips.map(t => t.region));
  s += regions.size * 10;

  // Class 3 penalty if more than 1 in same year
  const class3 = trips.filter(t => t.class === 3).length;
  if (class3 > 1) s -= 30;

  // Fatigue: penalize if average fatigue is high (>2)
  const avgFatigue = trips.reduce((sum, t) => sum + t.fatigue, 0) / trips.length;
  if (avgFatigue > 2) s -= 15;

  return s;
}

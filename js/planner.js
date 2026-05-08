import { destinations, YEAR_BUDGETS, EUROPE_TRIPS, EUROPE_TRIP_COST, EUROPE_TRIP_DAYS } from "../data/destinations.js";
import { tripCost, scoreDestination, seasonScore, scorePlan, calcVacationDays } from "./engine.js";

function hasSpacingConflict(trips, candidateMonth, candidateDays) {
  const candEnd = candidateMonth + Math.ceil(candidateDays / 30);
  for (const t of trips) {
    const tEnd = t.startMonth + Math.ceil(t.tripDays / 30);
    const gap = Math.max(candidateMonth - tEnd, t.startMonth - candEnd);
    if (gap < 2) return true;
  }
  return false;
}

function findMonth(dest, existingTrips) {
  const all = [1,2,3,4,5,6,7,8,9,10,11,12];
  const preferred = [...dest.bestMonths, ...all.filter(m => !dest.bestMonths.includes(m))];
  for (const m of preferred) {
    if (!hasSpacingConflict(existingTrips, m, dest.tripDays)) return m;
  }
  return null;
}

function insertSorted(trips, newTrip) {
  const idx = trips.findIndex(t => t.startMonth > newTrip.startMonth);
  if (idx === -1) trips.push(newTrip);
  else trips.splice(idx, 0, newTrip);
}

function violatesConstraints(trips) {
  if (trips.length < 3) return false;
  const continents = trips.map(t => t.continent);
  const fatigue    = trips.map(t => t.fatigue);
  for (let i = 2; i < trips.length; i++) {
    if (continents[i] === continents[i-1] && continents[i] === continents[i-2]) return true;
    if (fatigue[i] >= 2 && fatigue[i-1] >= 2 && fatigue[i-2] >= 2) return true;
  }
  return false;
}

function buildPlan(state, excludeIds = []) {
  const budget = state.budget;
  const reservedBudget = EUROPE_TRIPS * EUROPE_TRIP_COST;
  const availableBudget = budget - reservedBudget;

  // ── 1. Place locked trips first ─────────────────────
  const locks = state.locks || {};
  const trips = [];
  let budgetUsed = 0;

  for (const [id, month] of Object.entries(locks)) {
    const dest = destinations.find(d => d.id === id);
    if (!dest) continue;
    const cost = tripCost(dest);
    const lockedTrip = { ...dest, startMonth: +month, cost, locked: true };
    insertSorted(trips, lockedTrip);
    budgetUsed += cost;
  }

  // ── 2. Score and sort remaining candidates ───────────
  const lockedIds = Object.keys(locks);
  const scored = destinations
    .filter(d => !excludeIds.includes(d.id) && !lockedIds.includes(d.id))
    .map(d => ({ ...d, _score: scoreDestination(d, state) }))
    .sort((a, b) => b._score - a._score);

  const sampleCosts = scored.slice(0, Math.min(8, scored.length)).map(tripCost);
  const avgCost = sampleCosts.length
    ? sampleCosts.reduce((s, c) => s + c, 0) / sampleCosts.length
    : 1500;
  const numTrips = Math.min(4, Math.max(2, Math.floor(availableBudget / avgCost)));

  // ── 3. Greedy fill ───────────────────────────────────
  for (const dest of scored) {
    if (trips.length >= numTrips) break;

    const cost = tripCost(dest);
    if (budgetUsed + cost > availableBudget * 1.05) continue;

    const month = findMonth(dest, trips);
    if (!month) continue;

    const newTrip = { ...dest, startMonth: month, cost };
    insertSorted(trips, newTrip);

    if (violatesConstraints(trips)) {
      trips.splice(trips.indexOf(newTrip), 1);
      continue;
    }

    budgetUsed += cost;
  }

  const totalCost = budgetUsed + reservedBudget;
  const vacationDays =
    trips.reduce((s, t) => s + calcVacationDays(t.tripDays), 0) +
    EUROPE_TRIPS * 3; // ~3 weekdays per Europe trip (Thu–Mon)

  const avgFatigue = trips.length
    ? trips.reduce((s, t) => s + t.fatigue, 0) / trips.length
    : 0;

  const plan = {
    trips,
    europeTrips: EUROPE_TRIPS,
    totalCost,
    budgetUsed,
    vacationDays,
    fatigueScore: Math.round(avgFatigue * 10) / 10,
    regionCount: new Set(trips.map(t => t.region)).size,
    budgetEfficiency: Math.round(totalCost / budget * 100),
  };

  plan.score = scorePlan(plan, state);
  return plan;
}

export function generatePlans(state) {
  const lockedIds = Object.keys(state.locks || {});

  // Score non-locked destinations to determine exclusion candidates for alternatives
  const allScored = destinations
    .filter(d => !lockedIds.includes(d.id))
    .map(d => ({ ...d, _score: scoreDestination(d, state) }))
    .sort((a, b) => b._score - a._score);

  const best = buildPlan(state, []);

  const alts = [];
  for (let i = 0; i < 5; i++) {
    const excludeId = allScored[i]?.id;
    alts.push(buildPlan(state, excludeId ? [excludeId] : []));
  }

  return [best, ...alts];
}

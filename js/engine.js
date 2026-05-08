import { EUROPE_TRIPS, EUROPE_TRIP_COST } from "../data/destinations.js";

const MONTHS = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];

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

function bestSeasonScore(dest) {
  return Math.max(...[1,2,3,4,5,6,7,8,9,10,11,12].map(m => seasonScore(dest, m)));
}

export function scoreDestination(dest, state) {
  const cost = tripCost(dest);
  const perTripShare = (state.budget - EUROPE_TRIPS * EUROPE_TRIP_COST) / 3;

  const ratio = cost / perTripShare;
  const budgetScore =
    ratio <= 0.80 ? 30 :
    ratio <= 1.00 ? 22 :
    ratio <= 1.20 ? 10 :
    ratio <= 1.40 ? 2 : -15;

  const classScore = dest.class === 1 ? 20 : dest.class === 2 ? 12 : 8;

  return bestSeasonScore(dest) + budgetScore + classScore;
}

export function scorePlan(plan, state) {
  const { trips, totalCost } = plan;
  if (!trips.length) return -999;

  let s = 0;

  const eff = totalCost / state.budget;
  if      (eff >= 0.80 && eff <= 0.95) s += 40;
  else if (eff >= 0.70 && eff <= 1.05) s += 20;
  else if (eff < 0.60)                 s -= 30;
  else if (eff > 1.10)                 s -= 20;

  const avgSeason = trips.reduce((sum, t) => sum + seasonScore(t, t.startMonth), 0) / trips.length;
  s += avgSeason;

  const regions = new Set(trips.map(t => t.region));
  s += regions.size * 10;

  const class3 = trips.filter(t => t.class === 3).length;
  if (class3 > 1) s -= 30;

  const avgFatigue = trips.reduce((sum, t) => sum + t.fatigue, 0) / trips.length;
  if (avgFatigue > 2) s -= 15;

  return s;
}

// ── Vacation day calculator ──────────────────────────────
// Smart: start Thursday to capture weekend days "for free"
export function calcVacationDays(tripDays) {
  let weekday = 4; // Thursday (Mon=1 … Sun=7)
  let vac = 0;
  for (let i = 0; i < tripDays; i++) {
    if (weekday <= 5) vac++;
    weekday = weekday % 7 + 1;
  }
  return vac;
}

// Worst-case (Monday start) for comparison
export function calcVacationDaysWorstCase(tripDays) {
  let weekday = 1; // Monday
  let vac = 0;
  for (let i = 0; i < tripDays; i++) {
    if (weekday <= 5) vac++;
    weekday = weekday % 7 + 1;
  }
  return vac;
}

// ── Constraint warnings ──────────────────────────────────
export function getWarnings(plan, state) {
  const warnings = [];
  const { trips, budgetEfficiency, fatigueScore } = plan;

  if (budgetEfficiency > 105) {
    warnings.push({ type: "error", msg: `Budget overschreden: ${budgetEfficiency}% van €${state.budget.toLocaleString("nl-NL")}` });
  }
  if (budgetEfficiency < 70) {
    warnings.push({ type: "warn", msg: `Budget sterk onderbenut (${budgetEfficiency}%) — je laat geld liggen` });
  }
  if (fatigueScore > 2.2) {
    warnings.push({ type: "warn", msg: `Hoog vermoeidheidsniveau (${fatigueScore.toFixed(1)}/3) — overweeg een rustiger bestemming` });
  }

  const class3 = trips.filter(t => t.class === 3).length;
  if (class3 > 1) {
    warnings.push({ type: "warn", msg: `${class3} Bucket List-bestemmingen in één jaar — budget staat onder druk` });
  }

  for (const t of trips) {
    const ss = seasonScore(t, t.startMonth);
    if (ss === 0) {
      warnings.push({ type: "warn", msg: `${t.name} in ${MONTHS[t.startMonth - 1]}: off-season — overweeg andere maand` });
    }
  }

  if (trips.length >= 2) {
    const regions = trips.map(t => t.region);
    const allSame = regions.every(r => r === regions[0]);
    if (allSame) {
      warnings.push({ type: "info", msg: "Alle reizen in dezelfde regio — meer spreiding vergroot de ervaring" });
    }
  }

  // Check locked trips for spacing violations
  const locked = trips.filter(t => t.locked);
  for (let i = 0; i < locked.length - 1; i++) {
    const a = locked[i], b = locked[i + 1];
    const aEnd = a.startMonth + Math.ceil(a.tripDays / 30);
    const gap = b.startMonth - aEnd;
    if (gap < 2) {
      warnings.push({ type: "error", msg: `Slots conflict: ${a.name} en ${b.name} zitten te dicht op elkaar (< 2 maanden gap)` });
    }
  }

  return warnings;
}

// ── Explanations ─────────────────────────────────────────
export function explainPlan(plan, state) {
  const reasons = [];
  const { trips, budgetEfficiency, fatigueScore, regionCount } = plan;

  const eff = budgetEfficiency;
  if (eff >= 80 && eff <= 100) {
    reasons.push(`${eff}% van budget benut — efficiënt gebruik van €${state.budget.toLocaleString("nl-NL")}`);
  } else if (eff >= 70) {
    reasons.push(`${eff}% van budget benut — iets ruimer dan ideaal`);
  }

  const avgSeason = trips.reduce((s, t) => s + seasonScore(t, t.startMonth), 0) / trips.length;
  if (avgSeason >= 35) reasons.push("Alle reizen vallen in of vlak bij het ideale seizoen");
  else if (avgSeason >= 20) reasons.push("Seizoensfit gemiddeld goed");

  if (regionCount >= 3) reasons.push(`${regionCount} regio's in één jaar — optimale diversiteit`);
  else if (regionCount === 2) reasons.push("2 verschillende regio's — goede spreiding");

  const class3 = trips.filter(t => t.class === 3).length;
  if (class3 === 0) reasons.push("Geen Bucket List-reizen — maximale waarde per euro");
  if (class3 === 1) reasons.push("Eén Bucket List-bestemming — gebalanceerd met budget");

  if (fatigueScore <= 1.5) reasons.push(`Lage vermoeidheid (${fatigueScore.toFixed(1)}/3) — comfortabel jaarplan`);
  else if (fatigueScore <= 2.0) reasons.push(`Gemiddelde vermoeidheid (${fatigueScore.toFixed(1)}/3) — haalbaar schema`);

  const class1count = trips.filter(t => t.class === 1).length;
  if (class1count === trips.length) reasons.push("Puur Class 1 — maximale belevingswaarde voor de prijs");

  return reasons;
}

export function explainTrip(trip, state) {
  const reasons = [];

  if (trip.locked) reasons.push("Handmatig vastgezet");

  const cost = tripCost(trip);
  const perTripShare = (state.budget - EUROPE_TRIPS * EUROPE_TRIP_COST) / 3;
  const ratio = cost / perTripShare;
  if (ratio < 0.7)       reasons.push("Uitzonderlijk goede prijs-kwaliteitsverhouding");
  else if (ratio < 0.9)  reasons.push("Past uitstekend binnen budget");
  else if (ratio <= 1.1) reasons.push("Past binnen budget");

  const ss = seasonScore(trip, trip.startMonth);
  if (ss >= 40)      reasons.push(`Perfect seizoen in ${MONTHS[trip.startMonth - 1]}`);
  else if (ss >= 15) reasons.push(`Aanvaardbaar seizoen in ${MONTHS[trip.startMonth - 1]}`);
  else               reasons.push(`Off-season — overweeg andere maand`);

  if (trip.class === 1) reasons.push("Class 1: hoge belevingswaarde, lage dagkosten");
  else if (trip.class === 2) reasons.push("Class 2: mid-premium ervaring");
  else reasons.push("Class 3: bucket list — eenmalige ervaring");

  if (trip.fatigue === 1) reasons.push("Rustig reisschema — geen vermoeidheidsrisico");
  if (trip.fatigue === 3) reasons.push("Intensief: plan hersteltijd na thuiskomst");

  return reasons;
}

import { countries } from "../data/countries.js";
import { score } from "./engine.js";

export function generatePlan(state) {

  const scored = countries
    .map(c => ({ ...c, score: score(c, state) }))
    .sort((a, b) => b.score - a.score);

  const plan = [];
  const usedRegions = new Set();

  for (const c of scored) {
    if (plan.length >= 3) break;
    if (usedRegions.has(c.region)) continue;

    const tripMonth = ((state.travelMonth - 1 + plan.length * 3) % 12) + 1;

    plan.push({ ...c, month: tripMonth });
    usedRegions.add(c.region);
  }

  return plan;
}

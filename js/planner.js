import { countries } from "../data/countries.js";
import { score } from "./engine.js";

export function generatePlan(state) {

  let plan = [];

  for (let i = 0; i < 2; i++) {

    let best = null;
    let bestScore = -999;

    for (let c of countries) {

      const s = score(c, state);

      if (s > bestScore) {
        best = c;
        bestScore = s;
      }
    }

    plan.push({
      ...best,
      month: 2 + i * 3
    });
  }

  return plan;
}

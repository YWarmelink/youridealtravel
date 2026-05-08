import { YEAR_BUDGETS } from "../data/destinations.js";

export { YEAR_BUDGETS };

export const state = {
  year: 2027,
  locks: {}, // { [destinationId]: month (1–12) }
  get budget() {
    const b = YEAR_BUDGETS[this.year];
    return Math.round((b.min + b.max) / 2);
  },
};

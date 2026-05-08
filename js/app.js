import { state } from "./state.js";
import { initMap, updateMapUI } from "./map.js";
import { generatePlan } from "./planner.js";
import { renderTimeline } from "./timeline.js";

export function updateApp(reason) {
  state.activePlan = generatePlan(state);
  renderTimeline(state);
  updateMapUI(state);

  document.getElementById("budgetValue").textContent =
    `€${state.budget.toLocaleString("nl-NL")}`;
}

initMap();

const budgetEl = document.getElementById("budget");
const monthEl  = document.getElementById("month");

budgetEl.value = state.budget;
monthEl.value  = state.travelMonth;

budgetEl.oninput = e => {
  state.budget = +e.target.value;
  updateApp("budget");
};

monthEl.onchange = e => {
  state.travelMonth = +e.target.value;
  updateApp("month");
};

document.getElementById("generate").onclick = () => updateApp("manual");

updateApp("init");

import { state, YEAR_BUDGETS } from "./state.js";
import { initMap, updateMapUI } from "./map.js";
import { generatePlans } from "./planner.js";
import { renderPlans } from "./timeline.js";

let currentPlans = [];

export function updateApp(reason) {
  currentPlans = generatePlans(state);
  renderPlans(currentPlans, state);
  updateMapUI(currentPlans);
  renderBudgetBar(state);
}

function renderBudgetBar(state) {
  const b = YEAR_BUDGETS[state.year];
  document.getElementById("budgetRange").textContent =
    `€${b.min.toLocaleString("nl-NL")} – €${b.max.toLocaleString("nl-NL")}`;
  document.getElementById("budgetTarget").textContent =
    `€${state.budget.toLocaleString("nl-NL")} doel`;
}

initMap();

// Year selector
const yearBtns = document.querySelectorAll(".year-btn");
yearBtns.forEach(btn => {
  if (+btn.dataset.year === state.year) btn.classList.add("active");
  btn.onclick = () => {
    state.year = +btn.dataset.year;
    yearBtns.forEach(b => b.classList.toggle("active", b === btn));
    updateApp("year");
  };
});

document.getElementById("generate").onclick = () => updateApp("manual");

updateApp("init");

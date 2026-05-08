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

// Lock selects — event delegation so it works after re-renders
document.getElementById("timeline").addEventListener("change", e => {
  if (!e.target.classList.contains("lock-select")) return;
  const { id } = e.target.dataset;
  const month = e.target.value;
  if (month) {
    state.locks[id] = +month;
  } else {
    delete state.locks[id];
  }
  updateApp("lock");
});

document.getElementById("generate").onclick = () => updateApp("manual");

initMap();
updateApp("init");

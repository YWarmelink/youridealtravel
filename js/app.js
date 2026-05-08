import { state } from "./state.js";
import { initMap, updateMapUI } from "./map.js";
import { generatePlan } from "./planner.js";
import { renderTimeline } from "./timeline.js";

export function updateApp(reason) {

  console.log("update:", reason);

  state.activePlan = generatePlan(state);

  renderTimeline(state);
  updateMapUI(state);
}

window.state = state;

initMap();

updateApp("init");

document.getElementById("generate").onclick = () => {
  updateApp("manual-generate");
};

document.getElementById("budget").oninput = (e) => {
  state.budget = +e.target.value;
  updateApp("budget-change");
};

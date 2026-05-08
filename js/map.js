import { destinations } from "../data/destinations.js";
import { state } from "./state.js";
import { updateApp } from "./app.js";

export function initMap() {
  const map = document.getElementById("map");

  const dots = destinations.map(d => `
    <circle class="dest class-dot-${d.class}" data-id="${d.id}"
      cx="${d.coords[0]}" cy="${d.coords[1]}" r="7">
      <title>${d.name} (Class ${d.class})</title>
    </circle>
    <text class="dest-label" x="${d.coords[0]}" y="${d.coords[1] - 11}"
      text-anchor="middle">${d.name}</text>
  `).join("");

  map.innerHTML = `<svg viewBox="0 0 1000 500">${dots}</svg>`;

  document.querySelectorAll(".dest").forEach(el => {
    el.onclick = () => {
      const id = el.dataset.id;
      const exists = state.selectedDestinations?.find(d => d.id === id);
      if (exists) {
        state.selectedDestinations = state.selectedDestinations.filter(d => d.id !== id);
      } else {
        if (!state.selectedDestinations) state.selectedDestinations = [];
        state.selectedDestinations.push({ id });
      }
      updateApp("map-click");
    };
  });
}

export function updateMapUI(plans) {
  if (!plans?.length) return;

  const plannedIds = new Set(plans[0].trips.map(t => t.id));
  const altIds = new Set(plans.slice(1).flatMap(p => p.trips.map(t => t.id)));

  document.querySelectorAll(".dest").forEach(el => {
    const id = el.dataset.id;
    if (plannedIds.has(id))       el.style.fill = "#22c55e";  // best plan — green
    else if (altIds.has(id))      el.style.fill = "#f59e0b";  // in alternatives — amber
    else                          el.style.fill = null;        // default class color
  });
}

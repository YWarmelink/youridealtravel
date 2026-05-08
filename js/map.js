import { countries } from "../data/countries.js";
import { state } from "./state.js";
import { updateApp } from "./app.js";

export function initMap() {

  const map = document.getElementById("map");

  const dots = countries.map(c => `
    <circle class="country" data-id="${c.id}"
      cx="${c.coords[0]}" cy="${c.coords[1]}" r="8">
      <title>${c.name}</title>
    </circle>
    <text class="country-label" x="${c.coords[0]}" y="${c.coords[1] - 12}"
      text-anchor="middle">${c.name}</text>
  `).join("");

  map.innerHTML = `<svg viewBox="0 0 1000 500">${dots}</svg>`;

  document.querySelectorAll(".country").forEach(el => {
    el.onclick = () => {
      const id = el.dataset.id;
      const exists = state.selectedCountries.find(c => c.id === id);
      if (exists) {
        state.selectedCountries = state.selectedCountries.filter(c => c.id !== id);
      } else {
        state.selectedCountries.push({ id });
      }
      updateApp("map-click");
    };
  });
}

export function updateMapUI(state) {

  const plannedIds = new Set(state.activePlan.map(c => c.id));
  const selectedIds = new Set(state.selectedCountries.map(c => c.id));

  document.querySelectorAll(".country").forEach(el => {
    const id = el.dataset.id;
    if (plannedIds.has(id))   el.style.fill = "#22c55e";
    else if (selectedIds.has(id)) el.style.fill = "#3b82f6";
    else                          el.style.fill = "#334155";
  });
}

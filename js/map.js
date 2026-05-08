import { state } from "./state.js";
import { updateApp } from "./app.js";

export function initMap() {

  const map = document.getElementById("map");

  map.innerHTML = `
    <svg viewBox="0 0 1000 500">
      <circle class="country" data-id="japan" cx="800" cy="200" r="10"></circle>
      <circle class="country" data-id="georgia" cx="520" cy="220" r="10"></circle>
      <circle class="country" data-id="colombia" cx="300" cy="300" r="10"></circle>
    </svg>
  `;

  document.querySelectorAll(".country").forEach(el => {

    el.onclick = () => {

      const id = el.dataset.id;

      const exists = state.selectedCountries.find(c => c.id === id);

      if (exists) {
        state.selectedCountries =
          state.selectedCountries.filter(c => c.id !== id);
      } else {
        state.selectedCountries.push({ id });
      }

      updateApp("map-click");
    };
  });
}

export function updateMapUI(state) {

  document.querySelectorAll(".country").forEach(el => {

    const id = el.dataset.id;

    const active = state.selectedCountries.find(c => c.id === id);

    el.style.fill = active ? "#22c55e" : "#334155";
  });
}

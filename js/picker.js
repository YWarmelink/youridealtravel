import { destinations, EUROPE_TRIPS, EUROPE_TRIP_COST } from "../data/destinations.js";
import { seasonScore, tripCost } from "./engine.js";
import { state } from "./state.js";

const MONTHS = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];

const REGION_LABELS = {
  "southeast-asia": "Zuidoost-Azië",
  "central-asia":   "Centraal-Azië",
  "east-asia":      "Oost-Azië",
  "caucasus":       "Kaukasus",
  "mediterranean":  "Mediterraan",
  "balkans":        "Balkan",
  "north-europe":   "Noord-Europa",
  "south-america":  "Zuid-Amerika",
  "north-america":  "Noord-Amerika",
  "north-africa":   "Noord-Afrika",
};

function monthQuality(avg) {
  if (avg >= 35) return "top";
  if (avg >= 20) return "ok";
  if (avg >= 5)  return "low";
  return "off";
}

function buildCheckboxes() {
  const grouped = {};
  for (const d of destinations) {
    if (!grouped[d.region]) grouped[d.region] = [];
    grouped[d.region].push(d);
  }

  const regionOrder = [
    "southeast-asia","central-asia","east-asia","caucasus",
    "mediterranean","balkans","north-europe",
    "south-america","north-america","north-africa",
  ];
  const ordered = [...new Set([...regionOrder, ...Object.keys(grouped)])].filter(r => grouped[r]);

  return ordered.map(region => {
    const label = REGION_LABELS[region] || region;
    const items = grouped[region].map(d => `
      <label class="picker-item">
        <input type="checkbox" class="picker-check" value="${d.id}">
        <span class="picker-name">${d.name}</span>
        ${d.combo ? `<span class="badge badge-combo">Combo</span>` : ""}
      </label>`).join("");
    return `<div class="picker-group"><div class="picker-region">${label}</div>${items}</div>`;
  }).join("");
}

function renderResult(selectedIds) {
  const el = document.getElementById("picker-result");
  if (!selectedIds.length) { el.innerHTML = ""; return; }

  const selected = selectedIds.map(id => destinations.find(d => d.id === id)).filter(Boolean);

  // Month scores
  const monthData = Array.from({length: 12}, (_, i) => {
    const month = i + 1;
    const perDest = selected.map(d => seasonScore(d, month));
    const avg = perDest.reduce((s, x) => s + x, 0) / perDest.length;
    return { month, avg, perDest };
  });

  const sorted = [...monthData].sort((a, b) => b.avg - a.avg);
  const bestMonth = sorted[0];

  // Month bar
  const monthBar = monthData.map(({ month, avg }) => {
    const q = monthQuality(avg);
    const pct = Math.round(avg);
    return `<div class="pm-cell pm-${q}" title="${MONTHS[month-1]}: ${pct}pt">
      <div class="pm-fill" style="height:${Math.round(avg / 40 * 100)}%"></div>
      <span class="pm-label">${MONTHS[month-1]}</span>
    </div>`;
  }).join("");

  // Top 3 months
  const top3 = sorted.slice(0, 3).map(({ month, avg }) =>
    `<span class="pm-chip pm-chip-${monthQuality(avg)}">${MONTHS[month-1]}</span>`
  ).join(" ");

  // Budget
  const totalCost = selected.reduce((s, d) => s + tripCost(d), 0);
  const totalFlights = selected.reduce((s, d) => s + d.flight, 0);
  const availBudget = state.budget - EUROPE_TRIPS * EUROPE_TRIP_COST;
  const pct = Math.round(totalCost / availBudget * 100);
  const budgetCls = pct <= 100 ? "good" : pct <= 110 ? "warn" : "over";
  const budgetMsg =
    pct <= 95  ? `✓ Past comfortabel binnen budget` :
    pct <= 105 ? `⚠ Krap aan budget` :
                 `⛔ Boven budget`;

  // Per-dest season for best month
  const destRows = selected.map((d) => {
    const s = seasonScore(d, bestMonth.month);
    const lbl = s >= 40 ? "Top seizoen" : s >= 15 ? "Nabij seizoen" : "Off-season";
    const cls = s >= 40 ? "season-top" : s >= 15 ? "season-ok" : "season-off";
    return `<div class="pr-dest-row">
      <span class="pr-dest-name">${d.name}</span>
      <span class="badge ${cls}">${lbl}</span>
      <span class="pr-dest-cost">€${tripCost(d).toLocaleString("nl-NL")}</span>
    </div>`;
  }).join("");

  el.innerHTML = `
    <div class="picker-result">
      <div class="pr-title">${selected.map(d => d.name).join(" + ")}</div>

      <div class="pr-cols">
        <div class="pr-block pr-block-wide">
          <div class="pr-label">Seizoen per maand</div>
          <div class="picker-month-bar">${monthBar}</div>
          <div class="pr-best">Beste maanden: ${top3}</div>
        </div>

        <div class="pr-block">
          <div class="pr-label">Budget (excl. Europese trips)</div>
          <div class="pr-budget-track">
            <div class="pr-budget-fill pr-budget-${budgetCls}" style="width:${Math.min(pct, 100)}%"></div>
          </div>
          <div class="pr-budget-msg ${budgetCls}">
            ${budgetMsg} — €${totalCost.toLocaleString("nl-NL")} / €${availBudget.toLocaleString("nl-NL")} (${pct}%)
          </div>
          <div class="pr-budget-breakdown">
            ✈ Vluchten: €${totalFlights.toLocaleString("nl-NL")} ·
            🏨 Verblijf: €${(totalCost - totalFlights).toLocaleString("nl-NL")}
          </div>
        </div>

        <div class="pr-block">
          <div class="pr-label">Seizoen in ${MONTHS[bestMonth.month - 1]} (beste maand)</div>
          ${destRows}
        </div>
      </div>
    </div>`;
}

export function initPicker() {
  const el = document.getElementById("picker");
  el.innerHTML = `
    <section class="picker-section">
      <h3>Analyseer je eigen combinatie</h3>
      <p class="picker-hint">Selecteer bestemmingen — zie direct het beste seizoen en budgetfit</p>
      <div class="picker-grid">${buildCheckboxes()}</div>
      <div id="picker-result"></div>
    </section>`;

  el.addEventListener("change", () => {
    const checked = [...el.querySelectorAll(".picker-check:checked")].map(c => c.value);
    renderResult(checked);
  });
}

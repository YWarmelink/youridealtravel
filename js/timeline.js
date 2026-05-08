import { YEAR_BUDGETS } from "../data/destinations.js";
import { seasonScore } from "./engine.js";

const MONTHS = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
const CLASS_LABEL = { 1: "High Value", 2: "Mid Premium", 3: "Bucket List" };
const FATIGUE_LABEL = { 1: "Rustig", 2: "Gemiddeld", 3: "Intensief" };

function seasonLabel(dest, month) {
  const s = seasonScore(dest, month);
  if (s >= 40) return ["Top seizoen", "season-top"];
  if (s >= 15) return ["Nabij seizoen", "season-ok"];
  return ["Off-season", "season-off"];
}

function buildTripCard(t) {
  const [sLabel, sCls] = seasonLabel(t, t.startMonth);
  const classCls = `class-${t.class}`;
  const fatigueCls = `fatigue-${t.fatigue}`;
  const endMonth = t.startMonth + Math.ceil(t.tripDays / 30);
  const monthRange = endMonth > t.startMonth
    ? `${MONTHS[t.startMonth - 1]}–${MONTHS[Math.min(endMonth - 1, 11)]}`
    : MONTHS[t.startMonth - 1];

  // Grid column: startMonth to startMonth + ceil(days/30), clamped to 1-13
  const colStart = t.startMonth;
  const colEnd   = Math.min(13, t.startMonth + Math.ceil(t.tripDays / 30) + 1);

  return `
    <div class="trip-card" style="grid-column: ${colStart} / ${colEnd}">
      <div class="trip-name">${t.name}</div>
      <div class="trip-sub">${monthRange} · ${t.tripDays}d · €${t.cost.toLocaleString("nl-NL")}</div>
      <div class="trip-badges">
        <span class="badge ${classCls}">${CLASS_LABEL[t.class]}</span>
        <span class="badge ${sCls}">${sLabel}</span>
        <span class="badge ${fatigueCls}">${FATIGUE_LABEL[t.fatigue]}</span>
      </div>
    </div>`;
}

function buildMonthGrid(trips) {
  const labels = MONTHS.map(m => `<div class="month-label">${m}</div>`).join("");
  const cards  = trips.map(buildTripCard).join("");
  return `
    <div class="year-grid">
      <div class="month-row">${labels}</div>
      <div class="trip-row">${cards}</div>
    </div>`;
}

function buildMetrics(plan, budget) {
  const budgetRange = YEAR_BUDGETS ? `` : "";
  const eff = plan.budgetEfficiency;
  const effCls = eff >= 80 && eff <= 100 ? "good" : eff < 70 ? "low" : "over";
  return `
    <div class="plan-metrics">
      <div class="metric">
        <span class="metric-val">€${plan.totalCost.toLocaleString("nl-NL")}</span>
        <span class="metric-label ${effCls}">${eff}% van budget</span>
      </div>
      <div class="metric">
        <span class="metric-val">${plan.vacationDays}</span>
        <span class="metric-label">vakantiedagen</span>
      </div>
      <div class="metric">
        <span class="metric-val">${plan.fatigueScore.toFixed(1)}<span class="metric-unit">/3</span></span>
        <span class="metric-label">vermoeidheid</span>
      </div>
      <div class="metric">
        <span class="metric-val">${plan.regionCount}</span>
        <span class="metric-label">regio's</span>
      </div>
    </div>`;
}

function buildEuropeNote(plan) {
  return `<div class="europe-note">
    + ${plan.europeTrips}× Europese stedentrip — gereserveerd in budget & vrije dagen
  </div>`;
}

function buildAltCard(plan, idx) {
  const destNames = plan.trips.map(t => t.name).join(", ");
  const eff = plan.budgetEfficiency;
  const effCls = eff >= 80 && eff <= 100 ? "good" : eff < 70 ? "low" : "over";
  return `
    <div class="alt-card">
      <div class="alt-label">Alt ${idx}</div>
      <div class="alt-dests">${destNames}</div>
      <div class="alt-stats">
        <span class="${effCls}">€${plan.totalCost.toLocaleString("nl-NL")} (${eff}%)</span>
        <span>${plan.vacationDays}d</span>
        <span>😴 ${plan.fatigueScore.toFixed(1)}</span>
        <span>${plan.regionCount} regio's</span>
      </div>
    </div>`;
}

export function renderPlans(plans, state) {
  const el = document.getElementById("timeline");
  el.innerHTML = "";

  if (!plans || !plans[0]?.trips.length) {
    el.innerHTML = `<p class="empty">Geen plan mogelijk met dit budget.</p>`;
    return;
  }

  const [best, ...alts] = plans;

  el.innerHTML = `
    <section class="best-plan">
      <h2>Beste plan ${state.year}
        <span class="plan-score">Score ${best.score}</span>
      </h2>
      ${buildMetrics(best, state.budget)}
      ${buildMonthGrid(best.trips)}
      ${buildEuropeNote(best)}
    </section>

    <section class="alternatives">
      <h3>5 alternatieven</h3>
      <div class="alts-grid">
        ${alts.map((p, i) => buildAltCard(p, i + 1)).join("")}
      </div>
    </section>
  `;
}

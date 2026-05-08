import { YEAR_BUDGETS } from "../data/destinations.js";
import {
  seasonScore, calcVacationDays, calcVacationDaysWorstCase,
  getWarnings, explainPlan, explainTrip,
} from "./engine.js";

const MONTHS     = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];
const MONTHS_FULL = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];
const CLASS_LABEL = { 1: "High Value", 2: "Mid Premium", 3: "Bucket List" };
const FATIGUE_LABEL = { 1: "Rustig", 2: "Gemiddeld", 3: "Intensief" };

function seasonBadge(dest, month) {
  const s = seasonScore(dest, month);
  if (s >= 40) return `<span class="badge season-top">Top seizoen</span>`;
  if (s >= 15) return `<span class="badge season-ok">Nabij seizoen</span>`;
  return `<span class="badge season-off">Off-season</span>`;
}

function lockSelect(trip, locks) {
  const lockedMonth = locks?.[trip.id];
  const options = [
    `<option value="">🔓 Niet vastgezet</option>`,
    ...MONTHS_FULL.map((name, i) => {
      const m = i + 1;
      return `<option value="${m}" ${lockedMonth == m ? "selected" : ""}>${MONTHS[i]}</option>`;
    }),
  ].join("");
  return `
    <div class="lock-wrap">
      <span class="lock-label">${lockedMonth ? `🔒 Slot: ${MONTHS[lockedMonth - 1]}` : "🔓 Vastleggen"}</span>
      <select class="lock-select" data-id="${trip.id}">${options}</select>
    </div>`;
}

function tripCard(trip, state) {
  const endMonth   = trip.startMonth + Math.ceil(trip.tripDays / 30);
  const monthRange = endMonth > trip.startMonth
    ? `${MONTHS[trip.startMonth - 1]}–${MONTHS[Math.min(endMonth - 1, 11)]}`
    : MONTHS[trip.startMonth - 1];

  const colStart = trip.startMonth;
  const colEnd   = Math.min(13, trip.startMonth + Math.ceil(trip.tripDays / 30) + 1);

  const smart = calcVacationDays(trip.tripDays);
  const worst = calcVacationDaysWorstCase(trip.tripDays);
  const vacText = smart < worst
    ? `${smart}–${worst} vakantiedagen`
    : `${smart} vakantiedagen`;
  const vacTip = smart < worst ? ` title="Slim: ${smart}d (vertrek donderdag) · Normaal: ${worst}d"` : "";

  const reasons = explainTrip(trip, state);

  return `
    <div class="trip-card ${trip.locked ? "trip-locked" : ""}" style="grid-column: ${colStart} / ${colEnd}">
      <div class="trip-top">
        <div>
          <div class="trip-name">${trip.locked ? "🔒 " : ""}${trip.name}</div>
          <div class="trip-sub">${monthRange} · ${trip.tripDays} reisdagen</div>
        </div>
        <div class="trip-cost">€${trip.cost.toLocaleString("nl-NL")}</div>
      </div>
      <div class="trip-badges">
        <span class="badge class-${trip.class}">${CLASS_LABEL[trip.class]}</span>
        ${seasonBadge(trip, trip.startMonth)}
        <span class="badge fatigue-${trip.fatigue}">${FATIGUE_LABEL[trip.fatigue]}</span>
        <span class="badge vac-badge"${vacTip}>🗓 ${vacText}</span>
      </div>
      <div class="trip-explain">${reasons.map(r => `<span class="reason">✓ ${r}</span>`).join("")}</div>
      <div class="trip-detail">✈ €${trip.flight} vlucht · €${trip.dailyCost}/dag</div>
      ${lockSelect(trip, state.locks)}
    </div>`;
}

function warningsHTML(warnings) {
  if (!warnings.length) return "";
  return `
    <div class="warnings">
      ${warnings.map(w => `
        <div class="warning-item warning-${w.type}">
          ${w.type === "error" ? "⛔" : w.type === "warn" ? "⚠️" : "ℹ️"} ${w.msg}
        </div>`).join("")}
    </div>`;
}

function explanationHTML(plan, state) {
  const reasons = explainPlan(plan, state);
  if (!reasons.length) return "";
  return `
    <div class="explanation-box">
      <div class="explanation-title">Waarom scoort dit plan goed?</div>
      ${reasons.map(r => `<div class="explanation-reason">✓ ${r}</div>`).join("")}
    </div>`;
}

function metricsHTML(plan, state) {
  const eff = plan.budgetEfficiency;
  const effCls = eff >= 80 && eff <= 100 ? "good" : eff < 70 ? "low" : "over";
  const budgetRange = YEAR_BUDGETS[state.year];
  return `
    <div class="plan-metrics">
      <div class="metric">
        <span class="metric-val">€${plan.totalCost.toLocaleString("nl-NL")}</span>
        <span class="metric-label ${effCls}">${eff}% van budget · range €${budgetRange.min.toLocaleString("nl-NL")}–€${budgetRange.max.toLocaleString("nl-NL")}</span>
      </div>
      <div class="metric">
        <span class="metric-val">${plan.vacationDays}</span>
        <span class="metric-label">vakantiedagen (slim gepland)</span>
      </div>
      <div class="metric">
        <span class="metric-val">${plan.fatigueScore.toFixed(1)}<span class="metric-unit">/3</span></span>
        <span class="metric-label">vermoeidheid</span>
      </div>
      <div class="metric">
        <span class="metric-val">${plan.regionCount}</span>
        <span class="metric-label">regio's</span>
      </div>
      <div class="metric">
        <span class="metric-val">${plan.score}</span>
        <span class="metric-label">planscore</span>
      </div>
    </div>`;
}

function bestPlanHTML(plan, state) {
  const warnings = getWarnings(plan, state);
  const monthLabels = MONTHS.map(m => `<div class="month-label">${m}</div>`).join("");
  const tripCards = plan.trips.map(t => tripCard(t, state)).join("");

  return `
    <section class="best-plan">
      <h2>Beste plan ${state.year}</h2>
      ${metricsHTML(plan, state)}
      ${warningsHTML(warnings)}
      <div class="year-grid">
        <div class="month-row">${monthLabels}</div>
        <div class="trip-row">${tripCards}</div>
      </div>
      ${explanationHTML(plan, state)}
      <div class="europe-note">
        + ${plan.europeTrips}× Europese stedentrip — ~€${(plan.europeTrips * 600).toLocaleString("nl-NL")} · ~6 vakantiedagen gereserveerd
      </div>
    </section>`;
}

function altCardHTML(plan, idx) {
  const eff = plan.budgetEfficiency;
  const effCls = eff >= 80 && eff <= 100 ? "good" : eff < 70 ? "low" : "over";
  const dests = plan.trips.map(t =>
    `<span class="alt-dest class-dot-${t.class}">${t.name}</span>`
  ).join("");
  return `
    <div class="alt-card">
      <div class="alt-label">Alternatief ${idx}</div>
      <div class="alt-dests">${dests}</div>
      <div class="alt-stats">
        <span class="${effCls}">€${plan.totalCost.toLocaleString("nl-NL")} (${eff}%)</span>
        <span>${plan.vacationDays}d vakantie</span>
        <span>😴 ${plan.fatigueScore.toFixed(1)}</span>
        <span>${plan.regionCount} regio's</span>
        <span class="alt-score">Score ${plan.score}</span>
      </div>
      <div class="alt-months">${plan.trips.map(t =>
        `${MONTHS[t.startMonth - 1]}: ${t.name}`
      ).join(" · ")}</div>
    </div>`;
}

export function renderPlans(plans, state) {
  const el = document.getElementById("timeline");
  el.innerHTML = "";

  if (!plans?.length || !plans[0].trips.length) {
    el.innerHTML = `<p class="empty">Geen plan mogelijk. Controleer de slots of vergroot het budget.</p>`;
    return;
  }

  const [best, ...alts] = plans;

  el.innerHTML = `
    ${bestPlanHTML(best, state)}
    <section class="alternatives">
      <h3>5 alternatieven</h3>
      <div class="alts-grid">${alts.map((p, i) => altCardHTML(p, i + 1)).join("")}</div>
    </section>
  `;
}

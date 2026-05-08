const MONTHS = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];

export function renderTimeline(state) {

  const el = document.getElementById("timeline");
  el.innerHTML = "";

  if (!state.activePlan.length) {
    el.innerHTML = `<p class="empty">Geen reizen gepland.</p>`;
    return;
  }

  state.activePlan.forEach((c, i) => {

    const totalCost = c.flight + c.dailyCost * 18;
    const monthName = MONTHS[c.month - 1];
    const scoreLabel = c.score >= 50 ? "Top pick" : c.score >= 30 ? "Goed" : "Mogelijk";

    const div = document.createElement("div");
    div.className = "trip";
    div.innerHTML = `
      <div class="trip-header">
        <b>${c.name}</b>
        <span class="trip-badge">${scoreLabel}</span>
      </div>
      <div class="trip-meta">
        <span>✈ ${monthName} ${state.year}</span>
        <span>~€${totalCost.toLocaleString("nl-NL")}</span>
      </div>
      <div class="trip-detail">€${c.flight} vlucht · €${c.dailyCost}/dag</div>
    `;

    el.appendChild(div);
  });
}

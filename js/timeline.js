export function renderTimeline(state) {

  const el = document.getElementById("timeline");
  el.innerHTML = "";

  state.activePlan.forEach(c => {

    const div = document.createElement("div");

    div.className = "trip";

    div.innerHTML = `
      <b>${c.name}</b>
      <span>Month ${c.month}</span>
    `;

    el.appendChild(div);
  });
}

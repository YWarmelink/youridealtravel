export function score(country, state) {

  let s = 0;

  // Budget fit (0–50): graduated so cheaper trips score higher, not binary
  const totalCost = country.flight + country.dailyCost * 18;
  if (totalCost <= state.budget) {
    const headroom = (state.budget - totalCost) / state.budget;
    s += 20 + Math.round(headroom * 30);
  } else if (totalCost <= state.budget * 1.15) {
    s += 5; // slightly over budget, still showable
  } else {
    s -= 30;
  }

  // Season match (0–40): is the travel month a good time to visit?
  const month = state.travelMonth;
  if (country.bestMonths.includes(month)) {
    s += 40;
  } else {
    // Check adjacent months (±1) for a partial match
    const adjacent = [
      ((month - 2 + 12) % 12) + 1,
      (month % 12) + 1,
    ];
    if (adjacent.some(m => country.bestMonths.includes(m))) {
      s += 15;
    }
  }

  return s;
}

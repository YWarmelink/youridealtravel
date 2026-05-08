export function score(c, state) {

  let s = 50;

  const cost = c.flight + c.dailyCost * 18;

  if (cost > state.budget) s -= 50;

  return s;
}

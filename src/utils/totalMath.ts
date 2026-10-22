/** The math behind a total that includes a modifier: "(7+2)" for 9, "(7−2)" for 5. */
export function totalMath(total: number, modifier: number): string | null {
  if (!modifier) return null;
  const dice = total - modifier;
  return `(${dice}${modifier > 0 ? '+' : '−'}${Math.abs(modifier)})`;
}

/** What a screen reader hears: "Rolled 9: 7 plus 2", or "Rolled 9" with no modifier. */
export function spokenTotal(total: number, modifier: number): string {
  if (!modifier) return `Rolled ${total}`;
  return `Rolled ${total}: ${total - modifier} ${modifier > 0 ? 'plus' : 'minus'} ${Math.abs(modifier)}`;
}

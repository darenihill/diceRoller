/**
 * A fair whole number from 0 to n - 1, from the browser's secure random
 * numbers (the same source used for passwords). Draws that would favour the
 * low faces are thrown away and drawn again, so every face is equally likely.
 */
export function randomBelow(n: number): number {
  if (n <= 1) return 0;
  const source = globalThis.crypto;
  // Very old browsers only: fall back to everyday random numbers
  if (!source?.getRandomValues) return Math.floor(Math.random() * n);
  const bucket = Math.floor(2 ** 32 / n);
  const limit = bucket * n;
  const draw = new Uint32Array(1);
  do {
    source.getRandomValues(draw);
  } while (draw[0] >= limit);
  return Math.floor(draw[0] / bucket);
}

/** "Tap again to hold": the words show until someone has held dice this way three times. */
const KEY = 'tapHoldCount';
export const HOLD_HINT_WORDS_LIMIT = 3;

function readCount(): number {
  try {
    const n = parseInt(localStorage.getItem(KEY) || '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function holdHintShowsWords(): boolean {
  return readCount() < HOLD_HINT_WORDS_LIMIT;
}

export function recordTapHold(): void {
  try {
    localStorage.setItem(KEY, String(readCount() + 1));
  } catch {
    // Private mode: the words simply keep showing
  }
}

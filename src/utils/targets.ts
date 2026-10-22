/** Reads the Target Highlight box the same way a roll does, and names any part it skips. */
export function checkTargets(text: string): { counts: number[]; skipped: string[] } {
  const parts = text.split(',').map(s => s.trim()).filter(s => s !== '');
  // Same reading as the roll: parseInt, so the note always matches what celebrates
  const counts = parts.map(s => parseInt(s)).filter(n => !isNaN(n));
  const skipped = parts.filter(s => !/^-?\d+$/.test(s));
  return { counts, skipped };
}

/** One line for under the box, or null when every part is a whole number. */
export function targetNote(text: string): string | null {
  const { counts, skipped } = checkTargets(text);
  if (skipped.length === 0) return null;
  const names = skipped.map(s => `“${s}”`).join(', ');
  const verb = skipped.length === 1 ? "isn't a whole number" : "aren't whole numbers";
  const still = counts.length > 0 ? ` Still counting: ${counts.join(', ')}.` : ' Nothing counts yet.';
  return `${names} ${verb}.${still}`;
}

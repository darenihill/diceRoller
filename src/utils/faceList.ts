/** A comma list's pieces are names or short labels; a longer piece means the commas are part of a sentence */
const MAX_LIST_WORDS = 2;
const isShort = (piece: string) => piece.split(/\s+/).length <= MAX_LIST_WORDS;
const pieces = (text: string, on: RegExp) => text.split(on).map(p => p.trim()).filter(p => p.length > 0);

/**
 * Splits what's in the Add custom text box into faces: one per line, or one
 * per comma when every piece is short, so a pasted list or "Anna, Ben, Cleo"
 * fills a die in one tap while "Go back, then roll again" stays one face
 * (player feedback 2026-11-06). Blank pieces are skipped.
 */
export function splitFaceList(text: string): string[] {
  const lines = pieces(text, /[\r\n]+/);
  if (lines.length !== 1) return lines;
  const parts = pieces(lines[0], /,/);
  return parts.length > 1 && parts.every(isShort) ? parts : lines;
}

/** A pasted list can show in the one-line box only if its commas will split it back into the same lines */
export function listFitsBox(text: string): boolean {
  return pieces(text, /[\r\n]+/).every(line => !line.includes(',') && isShort(line));
}

/**
 * Line breaks can't show in a one-line box, so a pasted list is shown with
 * commas between its lines, the same form the box splits on.
 */
export function pastedListForBox(text: string): string {
  return splitFaceList(text).join(', ');
}

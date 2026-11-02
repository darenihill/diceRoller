/**
 * Splits what's in the Add custom text box into faces: one per line or per
 * comma, so a pasted list or "Anna, Ben, Cleo" fills a die in one tap.
 * Blank pieces are skipped.
 */
export function splitFaceList(text: string): string[] {
  return text
    .split(/[\r\n,]+/)
    .map(piece => piece.trim())
    .filter(piece => piece.length > 0);
}

/**
 * Line breaks can't show in a one-line box, so a pasted list is shown with
 * commas between its lines, the same form the box splits on.
 */
export function pastedListForBox(text: string): string {
  return splitFaceList(text).join(', ');
}

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

// Buttons drop the browser's ring for taps, so keyboard users need one of ours.
describe('keyboard focus', () => {
  it('every button shows a ring when reached by keyboard', () => {
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
    const start = css.indexOf('button:focus-visible {');
    expect(start).toBeGreaterThan(-1);
    expect(css.slice(start, css.indexOf('}', start))).toMatch(/outline: 2px solid var\(--md-sys-color-primary\)/);
  });
});

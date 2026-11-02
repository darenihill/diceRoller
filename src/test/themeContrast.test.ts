import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Every theme's text colours stay readable on the surfaces they sit on, so a
// theme that forgets a token (light once inherited the dark theme's pale error
// pink, and Clear All read at 1.3:1) fails here instead of on someone's phone.
const css = fs.readFileSync(path.resolve(__dirname, '../index.css'), 'utf-8');

function tokens(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
  const out: Record<string, string> = {};
  if (!block) return out;
  for (const m of block[1].matchAll(/(--md-sys-color-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const root = tokens(':root');
const themes = ['theme-dark', 'theme-light', 'theme-felt', 'theme-midnight'];
const pairs: [string, string][] = [
  ['on-background', 'background'],
  ['on-surface', 'surface'],
  ['on-surface', 'surface-variant'],
  ['on-primary', 'primary'],
  ['error', 'surface'], // the bin on a saved game, Remove in Dice settings
  ['error', 'surface-variant'], // Clear All in the menu
  ['on-error', 'error'], // the X on a die
];

describe('Theme colours stay readable', () => {
  for (const theme of themes) {
    const t = { ...root, ...tokens(`body.${theme}`) };
    for (const [fg, bg] of pairs) {
      it(`${theme}: ${fg} on ${bg} is at least 4.5:1`, () => {
        const ratio = contrast(t[`--md-sys-color-${fg}`], t[`--md-sys-color-${bg}`]);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

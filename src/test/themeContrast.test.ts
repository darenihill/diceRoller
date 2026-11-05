import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Every theme's text colors stay readable on the surfaces they sit on, so a
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
  ['on-error', 'error'], // the bin on a die
  ['on-primary-container', 'primary-container'], // the Roll one button on a die
];

describe('Theme colors stay readable', () => {
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

// Delete (red) and Roll one (blue) sit side by side on a die. They must stay
// clearly different for red-green color blindness too, not only by hue.
// Machado 2009 full-strength matrices; distance is CIE76 in Lab.
const CVD: Record<string, number[][]> = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
};
const toLinear = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  .map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
function lab([r, g, b]: number[]): number[] {
  const c = (v: number) => Math.min(1, Math.max(0, v));
  [r, g, b] = [c(r), c(g), c(b)];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const simulate = (hex: string, m: number[][]) => {
  const v = toLinear(hex);
  return m.map(row => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
};
const distance = (a: number[], b: number[]) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));

describe('Delete stays apart from Roll one with color blindness', () => {
  for (const theme of themes) {
    const t = { ...root, ...tokens(`body.${theme}`) };
    for (const [kind, m] of Object.entries(CVD)) {
      it(`${theme}: ${kind}`, () => {
        const d = distance(simulate(t['--md-sys-color-error'], m), simulate(t['--md-sys-color-primary-container'], m));
        // The old pale pink measured 11-14 against Felt's cream button
        expect(d).toBeGreaterThanOrEqual(30);
      });
    }
  }
});

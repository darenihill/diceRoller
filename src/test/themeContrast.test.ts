import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

// WCAG AA in every theme: text 4.5:1, icons 3:1, measured from the tokens in index.css.
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

const block = (selector: string): Record<string, string> => {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf('}', start));
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*(#[0-9A-Fa-f]{6})/g)) out[m[1]] = m[2];
  return out;
};

const root = block(':root');
const themes: Record<string, Record<string, string>> = {
  dark: root,
  light: { ...root, ...block('body.theme-light') },
  felt: { ...root, ...block('body.theme-felt') },
  midnight: { ...root, ...block('body.theme-midnight') },
};

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe.each(Object.entries(themes))('%s theme contrast', (_name, t) => {
  const gold = (x: Record<string, string>) => x['--color-gold-ink'] ?? x['--color-gold'];

  it('body text is readable on every surface', () => {
    for (const bg of ['--md-sys-color-background', '--md-sys-color-surface', '--md-sys-color-surface-variant']) {
      expect(ratio(t['--md-sys-color-on-surface'], t[bg])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('red warning text (Clear All, a typo note) is readable', () => {
    for (const bg of ['--md-sys-color-background', '--md-sys-color-surface-variant']) {
      expect(ratio(t['--md-sys-color-error'], t[bg])).toBeGreaterThanOrEqual(4.5);
    }
    expect(ratio(t['--md-sys-color-on-error'], t['--md-sys-color-error'])).toBeGreaterThanOrEqual(4.5);
  });

  it('the gold lock and HIT! stand out from their buttons', () => {
    expect(ratio(gold(t), t['--md-sys-color-surface-variant'])).toBeGreaterThanOrEqual(3);
  });

  it('primary buttons are readable', () => {
    expect(ratio(t['--md-sys-color-on-primary'], t['--md-sys-color-primary'])).toBeGreaterThanOrEqual(4.5);
  });
});

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

// Material 3 fit pass, 2026-11-10 (reviews/2026-11-10-ui-material.md).
// Every text box in the app is the same Material 3 outlined field: an edge in
// the theme's outline color, 2px primary while typing. Die settings had its
// own dark filled boxes with no edge, which barely showed on the dark themes
// and dropped their hint text under 4.5:1 on Clean Light.

const rule = (source: string, selector: string) => {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...css.matchAll(new RegExp(`(^|\\n)([^{}]*${escaped}[^{}]*)\\{([^}]*)\\}`, 'g'))]
    .filter(m => m[2].split(',').map(s => s.trim()).includes(selector))
    .map(m => m[3])
    .join('\n');
};

const dieSettings = readFileSync('src/components/DiceSettingsModal.module.css', 'utf8');
const modals = readFileSync('src/components/modals/Modals.module.css', 'utf8');
const typeRoll = readFileSync('src/components/TypeRollBox.module.css', 'utf8');
const index = readFileSync('src/index.css', 'utf8');

describe('one text field across the app', () => {
  for (const field of ['.inputField', '.stepperInput', '.faceValueInput']) {
    it(`Die settings ${field} has an outline-colored edge and no dark fill`, () => {
      const css = rule(dieSettings, field);
      expect(css).toMatch(/border:\s*1px solid var\(--md-sys-color-outline\)/);
      expect(css).not.toMatch(/rgba\(/);
      expect(css).not.toMatch(/border:\s*none/);
    });

    it(`Die settings ${field} shows a 2px primary edge while typing`, () => {
      const css = rule(dieSettings, `${field}:focus`);
      expect(css).toMatch(/border-color:\s*var\(--md-sys-color-primary\)/);
      expect(css).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--md-sys-color-primary\)/);
    });
  }

  it('Save, Customize and Share fields and the typed roll box show the same 2px edge while typing', () => {
    expect(rule(modals, '.formInput:focus')).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--md-sys-color-primary\)/);
    expect(rule(typeRoll, '.input:focus')).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--md-sys-color-primary\)/);
  });

  it('a field with a problem keeps its red edge while typing', () => {
    expect(rule(modals, '.formInputInvalid:focus')).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--md-sys-color-error\)/);
    expect(rule(typeRoll, '.inputInvalid:focus')).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--md-sys-color-error\)/);
  });
});

// The field's edge must show (3:1, WCAG 1.4.11) on the Die settings panel,
// which is surface-variant, on every theme.
function tokens(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = index.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
  const out: Record<string, string> = {};
  if (!block) return out;
  for (const m of block[1].matchAll(/(--md-sys-color-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('the field edge shows on every theme', () => {
  const root = tokens(':root');
  for (const theme of ['theme-dark', 'theme-light', 'theme-felt', 'theme-midnight']) {
    it(`${theme}: outline on surface-variant is at least 3:1`, () => {
      const t = { ...root, ...tokens(`body.${theme}`) };
      expect(contrast(t['--md-sys-color-outline'], t['--md-sys-color-surface-variant'])).toBeGreaterThanOrEqual(3);
    });
  }
});

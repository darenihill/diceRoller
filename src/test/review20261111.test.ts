import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

/*
 * Deep review, 2026-11-11 (stories walked at 390px). jsdom has no layout, so
 * these pin the CSS rules that fixed what the walk measured in Chromium;
 * reviews/2026-11-11-stories.md has the before and after numbers.
 */

const css = (f: string) => readFileSync(`src/components/${f}`, 'utf8');
const rule = (src: string, selector: string) => {
  const i = src.indexOf(`${selector} {`);
  expect(i, `${selector} rule`).toBeGreaterThanOrEqual(0);
  return src.slice(i, src.indexOf('}', i));
};

describe('Custom faces: two face cards never squeeze side by side', () => {
  it('a card column is at least 13.5rem (its row needs about 190px plus padding)', () => {
    const grid = rule(css('DiceSettingsModal.module.css'), '.facesGrid');
    expect(grid).toMatch(/grid-template-columns: repeat\(auto-fill, minmax\(min\(100%, 13\.5rem\), 1fr\)\)/);
    // The old 130px column let two 135px cards hold a 190px row each
    expect(grid).not.toMatch(/minmax\(130px/);
  });
});

describe('Color, Icons and Text fit their buttons at a large text size', () => {
  it('three to a row at most, fewer once the words need more room', () => {
    const row = rule(css('DiceSettingsModal.module.css'), '.panelButtons');
    expect(row).toMatch(/repeat\(auto-fill, minmax\(max\(calc\(2\.5rem \+ 44px\), calc\(33\.33% - 6px\)\), 1fr\)\)/);
  });
});

describe('Phone menu words stay whole at a large text size (standard 9)', () => {
  it('four tiles a row at normal size, three once "Customize" no longer fits', () => {
    const src = css('SidebarMenu.module.css');
    const phone = src.slice(src.indexOf('@media (max-width: 468px)'));
    const menu = rule(phone, '.menu');
    expect(menu).toMatch(/repeat\(auto-fill, minmax\(max\(calc\(2\.7rem \+ 14px\), calc\(25% - 6px\)\), 1fr\)\)/);
    expect(menu).not.toMatch(/repeat\(4,/);
  });
});

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

// Owner, 2026-11-10: on a phone the Remove, Copy and Done icons were tiny or gone.
// Three buttons share the row, so the icons must never shrink and the sides stay narrow.
const css = readFileSync('src/components/DiceSettingsModal.module.css', 'utf8');

describe('die settings footer icons on a phone', () => {
  it('the icons never shrink', () => {
    expect(css).toMatch(/\.footerBtnDone svg\s*\{[^}]*flex-shrink:\s*0/);
    for (const cls of ['footerBtnRemove', 'footerBtnClone', 'footerBtnDone']) {
      expect(css).toContain(`.${cls} svg`);
    }
  });

  it('the buttons use narrow sides instead of the usual 24px', () => {
    expect(css).toMatch(/\.footerBtnDone\s*\{[^}]*padding-left:\s*8px/);
  });
});

// Owner, 2026-11-10: holding a die flashed a yellow line at the bottom of a phone's screen.
// The gold Release chip now fades in rather than popping in, and stays still for reduced motion.
describe('Release chip appears smoothly', () => {
  const bar = readFileSync('src/components/ActionBar.module.css', 'utf8');
  it('fades in', () => {
    expect(bar).toMatch(/\.releaseChip\s*\{\s*animation:\s*releaseChipIn/);
    expect(bar).toMatch(/@keyframes releaseChipIn\s*\{\s*from\s*\{\s*opacity:\s*0/);
  });
  it('does not move for reduced motion', () => {
    expect(bar).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.releaseChip\s*\{\s*animation:\s*none/);
  });
});

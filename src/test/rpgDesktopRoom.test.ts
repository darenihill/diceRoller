import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../App.module.css'), 'utf8');

describe('RPG buttons never sit on the dice on a wide screen', () => {
  it('keeps room on the right for the two columns of RPG buttons', () => {
    // 2 buttons (144) + gap (12) + the bar's 24px edge = 180; less and they cover a die
    const rule = css.match(/@media \(min-width: 769px\)\s*\{\s*:global\(body\.rpg-mode\) \.diceContainer\s*\{([^}]*)\}/)?.[1] ?? '';
    const px = Number(rule.match(/padding-right:\s*(\d+)px/)?.[1] ?? 0);
    expect(px).toBeGreaterThanOrEqual(180);
  });
});

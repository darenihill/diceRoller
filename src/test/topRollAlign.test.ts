import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('RPG Type a roll box on the top line', () => {
  it('lines up with the Dice Roller name: its own top margin is overridden (owner, 2026-11-10)', () => {
    const css = readFileSync('src/App.module.css', 'utf8');
    expect(css).toMatch(/\.topRoll\.topRoll > \*\s*{\s*margin:\s*0;/);
  });
});

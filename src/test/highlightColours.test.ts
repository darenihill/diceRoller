import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// One highlight colour per meaning: the theme's accent marks what is selected or
// focused; gold marks only a held die, a target hit or a natural 20.
const root = join(__dirname, '..');
const css = readFileSync(join(root, 'index.css'), 'utf8');
const gold = /--color-gold:\s*(#[0-9A-Fa-f]{6})/.exec(css)?.[1]?.toUpperCase();

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(join(dir, e.name)) : /\.(tsx|css)$/.test(e.name) ? [join(dir, e.name)] : []);
}

describe('highlight colours', () => {
  it('no theme uses gold as its accent', () => {
    expect(gold).toBe('#FFD700');
    const accents = [...css.matchAll(/--md-sys-color-primary(?:-container)?:\s*(#[0-9A-Fa-f]{6})/g)].map(m => m[1].toUpperCase());
    expect(accents.length).toBe(8);
    expect(accents).not.toContain(gold);
  });

  it('components name gold and accents by token, not by hex', () => {
    const offenders = files(join(root, 'components'))
      // Face colours people pick (':bg:#FFD700') are colours, not highlights.
      .filter(f => /#FFD700|solid #8E99F3/i.test(readFileSync(f, 'utf8').replace(/:bg:#FFD700/gi, '')));
    expect(offenders).toEqual([]);
  });
});

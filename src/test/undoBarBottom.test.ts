import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../App.module.css'), 'utf8');
const rule = (sel: string) => css.match(new RegExp(`\\n${sel.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

describe('Undo bar and messages sit at the bottom, above the Roll button', () => {
  it('the bar is placed from the bottom, not the top', () => {
    expect(rule('.toast')).toMatch(/bottom:\s*calc\(108px/);
    expect(rule('.toast')).not.toMatch(/\btop:/);
  });

  it('in RPG mode it sits above the taller bottom bar', () => {
    expect(rule('.toastAboveRpgBar')).toMatch(/bottom:\s*calc\(270px/);
  });

  it('on a phone it lines up with Roll, clear of the menu button', () => {
    expect(css).toMatch(/@media \(max-width: 468px\)\s*\{\s*\.toast:not\(\.toastAboveRpgBar\)\s*\{[^}]*right:/);
  });
});

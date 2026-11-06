import { readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

// Feedback polish, 2026-11-06 (reviews/2026-11-06-ui-feedback.md)
const cssFiles = ['src/index.css', 'src/App.module.css', ...readdirSync('src/components').filter(f => f.endsWith('.module.css')).map(f => `src/components/${f}`)];

describe('every tap answers at once', () => {
  it('a pressed button dims until the finger lifts', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/button:not\(:disabled\):active\s*\{[^}]*opacity:\s*0\.72/);
  });

  it('iPhone Safari is told to show the pressed look', () => {
    expect(readFileSync('src/main.tsx', 'utf8')).toMatch(/addEventListener\('touchstart'/);
  });

  it('button hover colors apply only with a mouse, so a tapped button does not stay lit', () => {
    // Dice.module.css is left out: a die's buttons show on hover on purpose
    for (const f of cssFiles.filter(f => !f.endsWith('Dice.module.css'))) {
      const css = readFileSync(f, 'utf8');
      const outside = css.replace(/@media \(hover: hover\) \{[\s\S]*?\n\}/g, '');
      const stray = outside.split('\n').filter(l => /:hover/.test(l) && !/toggleBtnOpen:hover/.test(l));
      expect(stray, f).toEqual([]);
    }
  });
});

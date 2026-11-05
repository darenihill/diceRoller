import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../App.module.css'), 'utf8');

describe('The chip row above Roll never sits on the dice', () => {
  it('keeps the row above Roll clear on every width', () => {
    // 44px chip + 10px gap above Roll; the app already keeps Roll's own row clear
    for (const block of [/@media \(min-width: 769px\)\s*\{\s*:global\(body\.chip-row\) \.diceContainer\s*\{([^}]*)\}/, /:global\(body\.chip-row\) \.diceContainer\s*\{\s*padding-bottom:\s*(\d+)px !important/]) {
      const m = css.match(block);
      expect(m).not.toBeNull();
      const px = Number((m![1].match(/(\d+)px/) ?? m!)[1]);
      expect(px).toBeGreaterThanOrEqual(52);
    }
  });
});

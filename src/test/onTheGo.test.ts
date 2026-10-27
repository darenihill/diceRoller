import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

// Quick repeat taps with wet or gloved hands should roll again, never zoom the page.
const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');
const rule = (css: string, selector: string) => {
  const start = css.indexOf(`${selector} {`);
  return css.slice(start, css.indexOf('}', start));
};

describe('on the go', () => {
  it('buttons and dice ignore double-tap zoom', () => {
    expect(rule(read('../index.css'), '\nbutton')).toContain('touch-action: manipulation');
    expect(rule(read('../components/Dice.module.css'), '.dice')).toContain('touch-action: manipulation');
  });

  it('the offline fallback always answers with a response', () => {
    expect(read('../../public/sw.js')).toContain('return cachedResponse || Response.error();');
  });
});

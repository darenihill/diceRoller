import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const block = (file: string, selector: string) => {
  const css = readFileSync(file, 'utf8');
  const start = css.indexOf(`${selector} {`);
  return css.slice(start, css.indexOf('}', start));
};

describe('Roll one matches the Roll button, Delete stays red', () => {
  it('the die\'s Roll one button and the strip\'s Roll one use the Roll button\'s blue', () => {
    expect(block('src/index.css', '.md-button-filled')).toContain('var(--md-sys-color-primary-container)');
    expect(block('src/components/Dice.module.css', '.rollOneBtn')).toContain('background-color: var(--md-sys-color-primary-container)');
    expect(block('src/components/DieActionStrip.module.css', '.primary .circle')).toContain('background-color: var(--md-sys-color-primary-container)');
  });

  it('Delete on a die stays red', () => {
    expect(block('src/components/Dice.module.css', '.removeBtn')).toContain('var(--md-sys-color-error)');
  });
});

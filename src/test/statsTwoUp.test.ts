import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Usage Stats on phones', () => {
  it('sets two number cards per row up to 600 px wide', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../components/modals/Modals.module.css'), 'utf-8');
    const phone = css.match(/@media \(max-width: 600px\) \{\s*\.metricsGrid \{([^}]+)\}/);
    expect(phone).not.toBeNull();
    expect(phone![1]).toMatch(/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  });
});

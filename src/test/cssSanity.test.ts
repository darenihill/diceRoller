import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Adversarial CSS & Layout Guard Tests', () => {
  const diceModulePath = path.resolve(__dirname, '../components/Dice.module.css');
  const appTsxPath = path.resolve(__dirname, '../App.tsx');

  it('CRITICAL: .dice rule in Dice.module.css MUST NOT declare margin (prevents grid overflow bugs)', () => {
    const cssContent = fs.readFileSync(diceModulePath, 'utf-8');
    // Extract the .dice selector block
    const diceBlockMatch = cssContent.match(/\.dice\s*\{([^}]+)\}/);
    expect(diceBlockMatch).not.toBeNull();

    if (diceBlockMatch) {
      const diceBlockProps = diceBlockMatch[1];
      // Assert that margin property is NOT present inside .dice block
      expect(diceBlockProps).not.toMatch(/\bmargin\s*:/i);
    }
  });

  it('CRITICAL: App.tsx container paddingBottom MUST be constant to prevent grid height shifts', () => {
    const appContent = fs.readFileSync(appTsxPath, 'utf-8');
    // Check for dynamic paddingBottom ternary like `paddingBottom: rpgMode ? '360px' : '110px'`
    expect(appContent).not.toMatch(/paddingBottom:\s*rpgMode\s*\?/i);
  });
});

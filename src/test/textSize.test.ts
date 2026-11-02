import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Words in the menu, the dice settings, Help and the other windows follow the browser's text size
const files = [
  'src/components/SidebarMenu.module.css',
  'src/components/Modal.module.css',
  'src/components/modals/Modals.module.css',
  'src/components/DiceSettingsModal.module.css',
  'src/components/modals/HelpModal.tsx',
  'src/components/modals/HistoryModal.tsx',
];

describe('Text that follows the browser text size', () => {
  it.each(files)('%s has no fixed text sizes', (file) => {
    const text = readFileSync(file, 'utf8');
    expect(text).not.toMatch(/font-size:\s*\d+(\.\d+)?px/);
    expect(text).not.toMatch(/fontSize:\s*\d/);
  });
});

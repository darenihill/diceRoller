import React from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SetsModal } from '../components/modals/SetsModal';
import { HelpModal } from '../components/modals/HelpModal';
import { SidebarMenu } from '../components/SidebarMenu';
import { landingPages } from '../../landing/pages.mjs';

// Owner, 2026-11-07 (Build, way "Call saved dice games", comment "Popular Games"):
// one name for each thing, from the word list in DESIGN.md §7
const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const a = vi.fn();

const sourceFiles = (dir: string): string[] =>
  readdirSync(join(process.cwd(), dir), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? sourceFiles(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []);
const appCode = sourceFiles('src').filter(f => !f.startsWith('src/test/'));

describe('one name per thing', () => {
  it('the word list is in the design notes', () => {
    const design = read('DESIGN.md');
    expect(design).toMatch(/## 7\. Words/);
    for (const word of ['game', 'Popular games', 'die settings', 'History', 'Frequency', 'sentence case']) {
      expect(design).toContain(word);
    }
  });

  it('the Games dialog says Games, Your games and Popular games', () => {
    render(<SetsModal isOpen onClose={a} onLoadSet={a} onDeleteConfig={a} onExportBackup={a} onImportBackup={a}
      savedConfigs={{ Mine: { name: 'Mine', config: [] } as never }} />);
    expect(screen.getByRole('dialog', { name: 'Games' })).toBeInTheDocument();
    expect(screen.getByText('Your games')).toBeInTheDocument();
    expect(screen.getByText('Popular games')).toBeInTheDocument();
    expect(screen.queryByText(/Saves|Presets/)).toBeNull();
  });

  it('menu tiles read in sentence case', () => {
    render(<SidebarMenu isOpen onToggle={a} onDonate={a} onIdeas={a} onHelp={a} onHistory={a} onStats={a} onSets={a} onCustomize={a} onDeleteAll={a} onSave={a} onShare={a} onSetDefault={a} rpgMode={false} onToggleRpgMode={a} />);
    for (const label of ['Usage stats', 'Set default', 'RPG mode', 'Clear all']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('dialog titles are in sentence case and one die is "Die settings"', () => {
    const titles = appCode.flatMap(f => [...read(f).matchAll(/<Modal [^>]*title="([^"]+)"/g)].map(m => m[1]));
    expect(titles.length).toBeGreaterThan(8);
    // Only the first word is capitalized; the app's own name keeps its capitals
    for (const t of titles) expect(t.replace('Dice Roller', 'dice roller'), t).not.toMatch(/ [A-Z][a-z]+/);
    expect(titles).toContain('Die settings');
    expect(titles.some(t => /Dice Settings|Games & Saves|Customize App/.test(t))).toBe(false);
  });

  it('messages carry no "!"', () => {
    for (const f of appCode) {
      for (const m of read(f).matchAll(/(?:showToast|offerUndo)\(\s*([`'"])(.*?)\1/g)) {
        expect(m[2], `${f}: ${m[2]}`).not.toContain('!');
      }
    }
  });

  it('Help says tap, in short items', () => {
    render(<HelpModal isOpen onClose={a} />);
    const text = screen.getByRole('dialog').textContent ?? '';
    expect(text).not.toMatch(/click|e\.g\.|preset|configuration/i);
    for (const li of screen.getAllByRole('listitem')) {
      const sentences = (li.textContent ?? '').split(/(?<=\.)\s/).filter(Boolean);
      expect(sentences.length, li.textContent ?? '').toBeLessThanOrEqual(3);
    }
  });

  it('landing pages point at menu items that exist', () => {
    for (const page of landingPages) {
      const body = JSON.stringify(page);
      expect(body, page.slug).not.toMatch(/under Load|Saved sets|set from|Name the set|statistics/);
    }
  });
});

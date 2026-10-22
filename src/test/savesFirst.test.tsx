import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SetsModal } from '../components/modals/SetsModal';
import { SidebarMenu } from '../components/SidebarMenu';
import type { DiceConfig } from '../types';

const noop = () => {};
const props = { isOpen: true, onClose: noop, onLoadSet: noop, onDeleteConfig: noop, onExportBackup: noop, onImportBackup: noop };

describe('Games dialog lists your saves first', () => {
  it('shows Your Saves above Presets when there are saves', () => {
    const saved = { 'Friday game': { name: 'Friday game', config: [] } } as unknown as Record<string, DiceConfig>;
    render(<SetsModal {...props} savedConfigs={saved} />);
    const headings = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(headings.indexOf('Your Saves')).toBeGreaterThanOrEqual(0);
    expect(headings.indexOf('Your Saves')).toBeLessThan(headings.indexOf('Presets'));
  });

  it('starts with Presets for a first-time visitor with no saves', () => {
    render(<SetsModal {...props} savedConfigs={{}} />);
    const headings = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(headings[0]).toBe('Presets');
    expect(headings).not.toContain('Your Saves');
  });
});

describe('Menu keeps one Games entry', () => {
  it('has Games and no separate Load', () => {
    const fns = { a: vi.fn() };
    render(<SidebarMenu isOpen onToggle={fns.a} onDonate={fns.a} onIdeas={fns.a} onHelp={fns.a} onHistory={fns.a} onStats={fns.a} onSets={fns.a} onCustomize={fns.a} onDeleteAll={fns.a} onSave={fns.a} onShare={fns.a} onSetDefault={fns.a} rpgMode={false} onToggleRpgMode={fns.a} />);
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.queryByText('Load')).toBeNull();
  });
});

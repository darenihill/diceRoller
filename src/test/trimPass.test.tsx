/**
 * Trim pass (owner, 2026-11-24: "include them all"): six lines and one menu
 * item came out, each kept where something still needs it.
 */
import React from 'react';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { HistoryModal } from '../components/modals/HistoryModal';
import { CustomizeModal } from '../components/modals/CustomizeModal';
import { ShareModal } from '../components/modals/ShareModal';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(() => localStorage.clear());

describe('Usage stats move into History', () => {
  it('the menu has no Usage stats; History has a Stats tab with the numbers', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.queryByRole('button', { name: 'Usage stats' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    expect(screen.getAllByRole('tab').map(t => t.textContent)).toEqual(['History', 'Frequency', 'Stats']);
    fireEvent.click(screen.getByRole('tab', { name: 'Stats' }));
    expect(screen.getByRole('tab', { name: 'Stats' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Total rolls')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Erase everything' })).toBeInTheDocument();
  });

  it('Stats shows before any roll, where History says No rolls yet', () => {
    render(<HistoryModal isOpen onClose={() => {}} rollHistory={[]} onClearHistory={() => {}} />);
    expect(screen.getByText('No rolls yet. Each roll shows here.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Stats' }));
    expect(screen.queryByText('No rolls yet. Each roll shows here.')).toBeNull();
    expect(screen.getByText('Total rolls')).toBeInTheDocument();
  });

  it('opening again starts on History, and a half-asked erase is gone', () => {
    const props = { onClose: () => {}, rollHistory: [], onClearHistory: () => {}, onEraseEverything: () => {} };
    const { rerender } = render(<HistoryModal isOpen {...props} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Stats' }));
    fireEvent.click(screen.getByRole('button', { name: 'Erase everything' }));
    expect(screen.getByTestId('erase-ask')).toBeInTheDocument();
    rerender(<HistoryModal isOpen={false} {...props} />);
    rerender(<HistoryModal isOpen {...props} />);
    expect(screen.queryByTestId('erase-ask')).toBeNull();
    expect(screen.getByRole('tab', { name: 'History' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('Lines that came out', () => {
  const base = {
    isOpen: true, onClose: () => {}, theme: 'theme-dark', onSelectTheme: () => {},
    soundEnabled: false, onToggleSound: () => {}, targetHighlight: '', onChangeTargetHighlight: () => {},
    telemetryEnabled: true, onToggleTelemetry: () => {}, diceScale: 1, onChangeDiceScale: () => {},
    shakeEnabled: false, onToggleShake: () => {}, brightRings: false, onToggleBrightRings: () => {},
  };

  it('Customize: no Bright rings, Target hit or Page metrics sentences', () => {
    render(<CustomizeModal {...base} />);
    expect(screen.getByText('Bright rings')).toBeInTheDocument();
    expect(screen.queryByText(/easier to find in sunlight/)).toBeNull();
    expect(screen.queryByText(/Celebrate when the roll total/)).toBeNull();
    expect(screen.queryByText(/Sends page visits/)).toBeNull();
  });

  it('Share link: the heading is heard, not shown', () => {
    render(<ShareModal url="https://example.com/x" onClose={() => {}} />);
    const label = screen.getByText('Share with this link');
    expect(label.className).toMatch(/srOnly/);
    expect(screen.getByLabelText('Share with this link')).toBeInTheDocument();
  });
});

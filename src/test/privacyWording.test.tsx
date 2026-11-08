/**
 * Standard 15 (privacy): the app says plainly what leaves the phone and to
 * whom. The metrics switch names Google Analytics and what it never sends
 * (review 2026-11-07).
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomizeModal } from '../components/modals/CustomizeModal';

const base = {
  isOpen: true, onClose: () => {}, theme: 'theme-dark', onSelectTheme: () => {},
  soundEnabled: false, onToggleSound: () => {}, targetHighlight: '', onChangeTargetHighlight: () => {},
  telemetryEnabled: true, onToggleTelemetry: () => {}, diceScale: 1, onChangeDiceScale: () => {},
  shakeEnabled: false, onToggleShake: () => {},
};

describe('Metrics switch wording', () => {
  it('names Google Analytics and what is never sent', () => {
    render(<CustomizeModal {...base} />);
    expect(screen.getByText(/to Google Analytics/)).toBeInTheDocument();
    expect(screen.getByText(/Never your own face words, pictures or saved game names/)).toBeInTheDocument();
  });
});

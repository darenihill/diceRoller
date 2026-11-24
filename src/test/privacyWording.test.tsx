/**
 * Standard 15 (privacy): the app says plainly what leaves the phone and to
 * whom. The metrics switch names Google Analytics and links what it sends
 * (review 2026-11-07; one link, not a sentence, since the trim pass 2026-11-24).
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
  it('names Google Analytics and links what is sent', () => {
    render(<CustomizeModal {...base} />);
    const link = screen.getByRole('link', { name: "What's sent to Google Analytics" });
    expect(link.getAttribute('href')).toBe('/privacy/');
  });
});

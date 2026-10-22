import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomizeModal } from '../components/modals/CustomizeModal';

const base = {
  isOpen: true, onClose: () => {}, theme: 'theme-dark', onSelectTheme: () => {},
  soundEnabled: false, onToggleSound: () => {}, targetHighlight: '', onChangeTargetHighlight: () => {},
  telemetryEnabled: true, onToggleTelemetry: () => {}, diceScale: 1, onChangeDiceScale: () => {},
};

describe('Shake to roll switch in Customize', () => {
  it('shows off when off, and a tap asks to turn it on', () => {
    const onToggleShake = vi.fn();
    render(<CustomizeModal {...base} shakeEnabled={false} onToggleShake={onToggleShake} />);
    const toggle = screen.getByRole('button', { name: 'Shake to roll' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(onToggleShake).toHaveBeenCalledOnce();
  });
});

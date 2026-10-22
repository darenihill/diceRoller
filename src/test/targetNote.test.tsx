import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { checkTargets, targetNote } from '../utils/targets';
import { CustomizeModal } from '../components/modals/CustomizeModal';

describe('Target Highlight check', () => {
  it('says nothing when every part is a whole number', () => {
    expect(targetNote('7, 11')).toBeNull();
    expect(targetNote('')).toBeNull();
    expect(targetNote('7, ')).toBeNull();
  });

  it('names the skipped part and what still counts', () => {
    expect(targetNote('7, x, 11')).toBe('“x” isn\'t a whole number. Still counting: 7, 11.');
    expect(targetNote('a, b')).toBe('“a”, “b” aren\'t whole numbers. Nothing counts yet.');
  });

  it('counts exactly what a roll counts', () => {
    expect(checkTargets('7.5, 11').counts).toEqual([7, 11]);
    expect(checkTargets('7.5, 11').skipped).toEqual(['7.5']);
  });
});

const base = {
  isOpen: true, onClose: () => {}, theme: 'theme-dark', onSelectTheme: () => {},
  soundEnabled: false, onToggleSound: () => {}, onChangeTargetHighlight: () => {},
  telemetryEnabled: true, onToggleTelemetry: () => {}, diceScale: 1, onChangeDiceScale: () => {},
};

describe('Target Highlight box', () => {
  it('marks the box and shows the note when a part is not a number', () => {
    render(<CustomizeModal {...base} targetHighlight="7, x" />);
    expect(screen.getByLabelText(/Target totals/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/isn't a whole number/)).toBeInTheDocument();
  });

  it('stays plain when every part reads', () => {
    render(<CustomizeModal {...base} targetHighlight="7, 11" />);
    expect(screen.getByLabelText(/Target totals/)).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText(/whole number/)).toBeNull();
  });
});

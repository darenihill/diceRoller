import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../components/ColorPicker';
import { DiceSettingsModal } from '../components/DiceSettingsModal';
import { COLORS } from '../utils/diceUtils';
import type { DiceData } from '../types';

// One picker for die and face colours (owner, 2026-11-03)
function Harness({ start, sameAs }: { start: string; sameAs?: string }) {
  const [value, setValue] = useState(start);
  return (<><ColorPicker label="Die colour" value={value} onChange={setValue} sameAs={sameAs} /><output data-testid="value">{value}</output></>);
}

describe('Colour picker', () => {
  it('shows the eleven colours plus Custom, and ticks the current one', () => {
    render(<Harness start="#E32227" />);
    const group = screen.getByRole('group', { name: 'Die colour' });
    expect(group.querySelectorAll('button')).toHaveLength(COLORS.length + 1);
    expect(screen.getByRole('button', { name: 'Red' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Blue' }));
    expect(screen.getByTestId('value')).toHaveTextContent('#0000FF');
    expect(screen.getByRole('button', { name: 'Red' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('Custom opens sliders in place, no floating box and no phone colour tool', () => {
    const { container } = render(<Harness start="#E32227" />);
    expect(screen.queryByRole('slider')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Custom colour' }));
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(container.querySelector('input[type="color"]')).toBeNull();
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '120' } });
    expect(screen.getByTestId('value').textContent).toMatch(/^#[0-9A-F]{6}$/);
    expect(screen.getByRole('button', { name: 'Custom colour' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('a typed colour code is used once it is complete', () => {
    render(<Harness start="#E32227" />);
    fireEvent.click(screen.getByRole('button', { name: 'Custom colour' }));
    const code = screen.getByRole('textbox', { name: 'Colour code' });
    fireEvent.change(code, { target: { value: '#12' } });
    expect(screen.getByTestId('value')).toHaveTextContent('#E32227');
    fireEvent.change(code, { target: { value: '12ab34' } });
    expect(screen.getByTestId('value')).toHaveTextContent('#12AB34');
  });

  it('a die already in a custom colour opens with its sliders showing', () => {
    render(<Harness start="#12AB34" />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  it('face colours add "Same as the die"', () => {
    render(<Harness start="#E32227" sameAs="#6750A4" />);
    fireEvent.click(screen.getByRole('button', { name: 'Same as the die' }));
    expect(screen.getByTestId('value')).toHaveTextContent('transparent');
    expect(screen.getByRole('button', { name: 'Same as the die' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Dice settings use the same picker for die and face colours', () => {
  const d: DiceData = { id: 'd1', numberValue: 1, faces: 3, customFaces: ['A', 'B', 'C'], color: '#6750A4', held: false };
  const props = { isOpen: true, onClose: () => {}, onRemove: () => {}, onClone: () => {}, allDice: [d] };

  it('die colour sits in the page and sets the die colour', () => {
    const onUpdate = vi.fn();
    render(<DiceSettingsModal dice={{ ...d, customFaces: [] }} onUpdate={onUpdate} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Green' }));
    expect(onUpdate).toHaveBeenCalledWith('d1', { color: '#228B22' });
  });

  it('face colour uses the same twelve dots', () => {
    render(<DiceSettingsModal dice={d} onUpdate={() => {}} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Colour' }));
    const face = screen.getByRole('group', { name: 'Colour for face 1' });
    expect(face.querySelectorAll('[aria-label="Custom colour"]')).toHaveLength(1);
    expect(face.querySelectorAll('button')).toHaveLength(COLORS.length + 2);
  });
});

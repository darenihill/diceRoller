import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../components/ColorPicker';
import { DiceSettingsModal } from '../components/DiceSettingsModal';
import { COLORS, colorName } from '../utils/diceUtils';
import type { DiceData } from '../types';

// One picker for die and face colors (owner, 2026-11-03)
function Harness({ start, sameAs }: { start: string; sameAs?: string }) {
  const [value, setValue] = useState(start);
  return (<><ColorPicker label="Die color" value={value} onChange={setValue} sameAs={sameAs} /><output data-testid="value">{value}</output></>);
}

describe('Color picker', () => {
  it('shows the eleven colors plus Custom, and ticks the current one', () => {
    render(<Harness start="#E32227" />);
    const group = screen.getByRole('group', { name: 'Die color' });
    expect(group.querySelectorAll('button')).toHaveLength(COLORS.length + 1);
    expect(screen.getByRole('button', { name: 'Red' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Blue' }));
    expect(screen.getByTestId('value')).toHaveTextContent('#0000FF');
    expect(screen.getByRole('button', { name: 'Red' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('Custom opens sliders in place, no floating box and no phone color tool', () => {
    const { container } = render(<Harness start="#E32227" />);
    expect(screen.queryByRole('slider')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Custom color' }));
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(container.querySelector('input[type="color"]')).toBeNull();
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '120' } });
    expect(screen.getByTestId('value').textContent).toMatch(/^#[0-9A-F]{6}$/);
    expect(screen.getByRole('button', { name: 'Custom color' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('a typed color code is used once it is complete', () => {
    render(<Harness start="#E32227" />);
    fireEvent.click(screen.getByRole('button', { name: 'Custom color' }));
    const code = screen.getByRole('textbox', { name: 'Color code' });
    fireEvent.change(code, { target: { value: '#12' } });
    expect(screen.getByTestId('value')).toHaveTextContent('#E32227');
    fireEvent.change(code, { target: { value: '12ab34' } });
    expect(screen.getByTestId('value')).toHaveTextContent('#12AB34');
  });

  it('a die already in a custom color opens with its sliders showing', () => {
    render(<Harness start="#12AB34" />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  it('face colors add "Same as the die"', () => {
    render(<Harness start="#E32227" sameAs="#6750A4" />);
    fireEvent.click(screen.getByRole('button', { name: 'Same as the die' }));
    expect(screen.getByTestId('value')).toHaveTextContent('transparent');
    expect(screen.getByRole('button', { name: 'Same as the die' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Dice settings use the same picker for die and face colors', () => {
  const d: DiceData = { id: 'd1', numberValue: 1, faces: 3, customFaces: ['A', 'B', 'C'], color: '#6750A4', held: false };
  const props = { isOpen: true, onClose: () => {}, onRemove: () => {}, onClone: () => {}, allDice: [d] };

  it('die color sits in the page and sets the die color', () => {
    const onUpdate = vi.fn();
    render(<DiceSettingsModal dice={{ ...d, customFaces: [] }} onUpdate={onUpdate} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Green' }));
    expect(onUpdate).toHaveBeenCalledWith('d1', { color: '#228B22' });
  });

  it('face color uses the same twelve dots', () => {
    render(<DiceSettingsModal dice={d} onUpdate={() => {}} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Color' }));
    const face = screen.getByRole('group', { name: 'Color for face 1' });
    expect(face.querySelectorAll('[aria-label="Custom color"]')).toHaveLength(1);
    expect(face.querySelectorAll('button')).toHaveLength(COLORS.length + 2);
  });
});

// Daren is colorblind: the picked color is named in words (owner, 2026-11-06)
describe('The picked color is named in words', () => {
  it('names ready colors, custom colors and "Same as the die"', () => {
    expect(colorName('#E9EAEC')).toBe('White');
    expect(colorName('#e32227')).toBe('Red');
    expect(colorName('#12ab34')).toBe('Custom #12AB34');
    expect(colorName('transparent')).toBe('Same as the die');
  });

  it('Dice settings title reads "Die color · White" and follows a new pick', () => {
    const d: DiceData = { id: 'd1', numberValue: 1, faces: 6, customFaces: [], color: '#E9EAEC', held: false };
    function Live() {
      const [die, setDie] = useState(d);
      return <DiceSettingsModal dice={die} onUpdate={(_, u) => setDie(x => ({ ...x, ...u }))} isOpen onClose={() => {}} onRemove={() => {}} onClone={() => {}} allDice={[die]} />;
    }
    render(<Live />);
    expect(screen.getByText('Die color · White')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Blue' }));
    expect(screen.getByText('Die color · Blue')).toBeInTheDocument();
  });

  it('Custom faces color title names the face color', () => {
    const d: DiceData = { id: 'd1', numberValue: 1, faces: 3, customFaces: ['A', 'B', 'C'], color: '#6750A4', held: false };
    render(<DiceSettingsModal dice={d} onUpdate={() => {}} isOpen onClose={() => {}} onRemove={() => {}} onClone={() => {}} allDice={[d]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Color' }));
    expect(screen.getByText('Color for face 1 · Same as the die')).toBeInTheDocument();
  });
});

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiceSettingsModal } from '../components/DiceSettingsModal';
import type { DiceData } from '../types';

const die = (customFaces: string[]): DiceData => ({ id: 'd1', numberValue: 1, faces: 6, customFaces, color: '#6750A4', held: false });
const open = (d: DiceData) => render(<DiceSettingsModal dice={d} isOpen onClose={() => {}} onUpdate={() => {}} onRemove={() => {}} onClone={() => {}} allDice={[d]} />);

describe('Dice settings tabs', () => {
  it('two tabs sit in the title bar beside the close button', () => {
    open(die([]));
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(t => t.textContent)).toEqual(['Die settings', 'Custom faces']);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Die settings' })).toBeNull();
  });

  it('a plain die opens on Die settings; a die with its own faces opens on them', () => {
    const { unmount } = open(die([]));
    expect(screen.getByRole('tab', { name: 'Die settings' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    unmount();
    open(die(['Cat', 'Dog']));
    expect(screen.getByRole('tab', { name: 'Custom faces' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/^Face 1: Cat/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Die settings' }));
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('the quick templates are gone', () => {
    open(die([]));
    fireEvent.click(screen.getByRole('tab', { name: 'Custom faces' }));
    expect(screen.queryByText(/Quick Templates/)).toBeNull();
    expect(screen.queryByText(/Decision Maker/)).toBeNull();
    expect(screen.queryByText(/Compass/)).toBeNull();
  });

  it('removing the last face keeps you on Custom faces', () => {
    const Harness = () => {
      const [d, setD] = React.useState(die(['Cat']));
      return <DiceSettingsModal dice={d} isOpen onClose={() => {}} onUpdate={(_id, u) => setD(prev => ({ ...prev, ...u }))} onRemove={() => {}} onClone={() => {}} allDice={[d]} />;
    };
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove face 1' }));
    expect(screen.queryByLabelText(/^Face 1: Cat/)).toBeNull();
    expect(screen.getByRole('tab', { name: 'Custom faces' })).toHaveAttribute('aria-selected', 'true');
  });
});

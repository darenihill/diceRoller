import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveDialog } from '../components/modals/SaveDialog';
import { nextFreeSaveName } from '../utils/setName';

const base = { isOpen: true, onClose: () => {}, onChangeSaveName: () => {} };

describe('Save Game when the name is taken', () => {
  it('says so and offers Keep both and Replace it', () => {
    const onSave = vi.fn();
    render(<SaveDialog {...base} saveName="Catan" existingNames={['Catan']} onSave={onSave} />);
    expect(screen.getByText(/already have a save called/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Keep both' }));
    expect(onSave).toHaveBeenLastCalledWith('keepBoth');
    fireEvent.click(screen.getByRole('button', { name: 'Replace it' }));
    expect(onSave).toHaveBeenLastCalledWith('replace');
  });

  it('shows plain Save for a new name', () => {
    render(<SaveDialog {...base} saveName="Yahtzee" existingNames={['Catan']} onSave={() => {}} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.queryByText(/already have a save called/)).toBeNull();
  });

  it('Enter never overwrites a taken name', () => {
    const onSave = vi.fn();
    render(<SaveDialog {...base} saveName="Catan" existingNames={['Catan']} onSave={onSave} />);
    fireEvent.keyDown(screen.getByLabelText(/name for this game/), { key: 'Enter' });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('Done on a taken name puts the keyboard away so the choices show', () => {
    render(<SaveDialog {...base} saveName="Catan" existingNames={['Catan']} onSave={() => {}} />);
    const input = screen.getByLabelText(/name for this game/);
    input.focus();
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).not.toHaveFocus();
  });
});

describe('Keep both names', () => {
  it('adds (2), or the next free number', () => {
    expect(nextFreeSaveName('Catan', ['Catan'])).toBe('Catan (2)');
    expect(nextFreeSaveName('Catan', ['Catan', 'Catan (2)'])).toBe('Catan (3)');
    expect(nextFreeSaveName('Catan (2)', ['Catan', 'Catan (2)'])).toBe('Catan (3)');
  });
});

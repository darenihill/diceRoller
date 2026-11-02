import { describe, it, expect } from 'vitest';
import React, { useState, useEffect } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiceSettingsModal } from '../components/DiceSettingsModal';
import { splitFaceList, pastedListForBox } from '../utils/faceList';
import type { DiceData } from '../types';

const seen: { dice: DiceData | null } = { dice: null };
const latest = { get customFaces() { return seen.dice!.customFaces; } };

function Harness({ faces = [] as string[] }) {
  const [dice, setDice] = useState<DiceData>({
    id: 'd1', numberValue: 1, faces: 6, customFaces: faces, color: '#E9EAEC', held: false,
  });
  useEffect(() => { seen.dice = dice; }, [dice]);
  return (
    <DiceSettingsModal
      dice={dice}
      isOpen
      onClose={() => {}}
      onUpdate={(_, updates) => setDice(d => ({ ...d, ...updates }))}
      onRemove={() => {}}
      onClone={() => {}}
      allDice={[dice]}
    />
  );
}

const box = () => screen.getByLabelText('Custom face text') as HTMLInputElement;
const add = () => fireEvent.click(screen.getByRole('button', { name: 'Add face' }));

function paste(text: string) {
  fireEvent.paste(box(), { clipboardData: { getData: () => text } });
}

describe('splitting a list into faces', () => {
  it('splits on lines and commas and skips blanks', () => {
    expect(splitFaceList('Anna\nBen\r\n\nCleo')).toEqual(['Anna', 'Ben', 'Cleo']);
    expect(splitFaceList('Anna, Ben,,Cleo ,')).toEqual(['Anna', 'Ben', 'Cleo']);
    expect(splitFaceList('  Dev  ')).toEqual(['Dev']);
    expect(pastedListForBox('Anna\nBen\n')).toBe('Anna, Ben');
  });
});

describe('Add custom text takes a list', () => {
  it('a pasted list of lines becomes one face per line', () => {
    render(<Harness />);
    paste('Anna\nBen\nCleo\n\nDev\nEli\nFay');
    expect(box().value).toBe('Anna, Ben, Cleo, Dev, Eli, Fay');
    add();
    expect(latest.customFaces).toEqual(['Anna', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fay']);
    expect(screen.getByRole('status')).toHaveTextContent('Added 6 faces.');
  });

  it('a comma list on one line becomes one face per name', () => {
    render(<Harness />);
    fireEvent.change(box(), { target: { value: 'Mop, Dishes, Bins' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(latest.customFaces).toEqual(['Mop', 'Dishes', 'Bins']);
  });

  it('adds to the faces already there, and Undo puts them back', () => {
    render(<Harness faces={['Old']} />);
    paste('A\nB');
    add();
    expect(latest.customFaces).toEqual(['Old', 'A', 'B']);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(latest.customFaces).toEqual(['Old']);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('Undo after a later edit does not wipe that edit', () => {
    render(<Harness faces={['Old']} />);
    paste('A\nB');
    add();
    fireEvent.click(screen.getByRole('button', { name: 'Remove face 1' }));
    expect(latest.customFaces).toEqual(['A', 'B']);
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it('stops at 100 faces and says how many were left out', () => {
    const ninetyEight = Array.from({ length: 98 }, (_, i) => `F${i + 1}`);
    render(<Harness faces={ninetyEight} />);
    paste('X\nY\nZ\nW');
    add();
    expect(latest.customFaces).toHaveLength(100);
    expect(latest.customFaces.slice(-2)).toEqual(['X', 'Y']);
    expect(screen.getByRole('status')).toHaveTextContent('Added 2 faces; 2 left out, a die holds 100.');
  });

  it('one typed face works as before, with no note', () => {
    render(<Harness />);
    fireEvent.change(box(), { target: { value: '  Crit  ' } });
    add();
    expect(latest.customFaces).toEqual(['Crit']);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('pasting a single word is left to the browser', () => {
    render(<Harness />);
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.assign(event, { clipboardData: { getData: () => 'Hello' } });
    box().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});

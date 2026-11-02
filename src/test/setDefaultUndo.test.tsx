import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const die = (id: string, faces: number) => ({ id, numberValue: 1, faces, currentFaceIndex: 0, customFaces: [], color: '#ff0000', held: false });

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [die('a', 20)] } }));
});
afterEach(() => { localStorage.clear(); });

const setDefault = () => {
  fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
  fireEvent.click(screen.getByText('Set Default'));
};

describe('Undo after Set Default', () => {
  it('shows "Startup dice set" with Undo', () => {
    render(<App />);
    setDefault();
    expect(screen.getByText('Startup dice set')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('defaultDiceSet')!)[0].faces).toBe(20);
  });

  it('Undo brings back the previous startup dice', () => {
    const before = JSON.stringify([die('b', 6), die('c', 6)]);
    localStorage.setItem('defaultDiceSet', before);
    render(<App />);
    setDefault();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(localStorage.getItem('defaultDiceSet')).toBe(before);
  });

  it('Undo leaves no startup dice when there were none', () => {
    render(<App />);
    setDefault();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(localStorage.getItem('defaultDiceSet')).toBeNull();
  });
});

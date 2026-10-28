import React from 'react';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const pets = { id: 'p1', numberValue: 1, faces: 3, customFaces: ['Cat', 'Dog', 'Fish'], color: '#E9EAEC', held: false };

beforeEach(() => {
  localStorage.clear();
});

function openSettings() {
  fireEvent.click(screen.getAllByTitle('Dice Settings')[0]);
}

describe('Undo inside a die\'s settings', () => {
  it('the faces count + wipes custom faces, and Undo brings them back', () => {
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [pets] } }));
    render(<App />);
    openSettings();
    expect(screen.getByLabelText(/^Face 1: Cat/)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Increase faces'));
    expect(screen.queryByLabelText(/^Face 1: Cat/)).toBeNull();
    expect(screen.getByText('Replaced 3 faces')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText(/^Face 1: Cat/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Face 3: Fish/)).toBeInTheDocument();
  });

  it('removing one face offers Undo for that face', () => {
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [pets] } }));
    render(<App />);
    openSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Remove face 2' }));
    expect(screen.getByText('Removed face Dog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText(/^Face 2: Dog/)).toBeInTheDocument();
  });

  it('adding a face offers no Undo', () => {
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [pets] } }));
    render(<App />);
    openSettings();
    fireEvent.change(screen.getByLabelText('Custom face text'), { target: { value: 'Bird' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add face' }));
    expect(screen.getByLabelText(/^Face 4: Bird/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });
});

describe('Clear History', () => {
  const rolls = [1, 2, 3, 4].map(n => ({ id: `r${n}`, timestamp: n, total: n, details: [String(n)] }));

  it('says how many rolls went and Undo brings them back', () => {
    localStorage.setItem('rollHistory', JSON.stringify(rolls));
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText('Roll Log (4)')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Clear History'));
    expect(screen.getByText('No rolls yet. Each roll shows here.')).toBeInTheDocument();
    expect(screen.getByText('Cleared 4 rolls')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText('Roll Log (4)')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('rollHistory')!)).toHaveLength(4);
  });
});

describe('Dice size − and +', () => {
  it('step the size by 10% and stop at the ends', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('Customize'));
    const slider = screen.getByRole('slider', { name: 'Dice Size' });
    const start = Number((slider as HTMLInputElement).value);
    fireEvent.click(screen.getByRole('button', { name: 'Bigger dice' }));
    expect(Number((slider as HTMLInputElement).value)).toBeCloseTo(start + 0.1);
    fireEvent.click(screen.getByRole('button', { name: 'Smaller dice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Smaller dice' }));
    expect(Number((slider as HTMLInputElement).value)).toBeCloseTo(start - 0.1);
    for (let i = 0; i < 30; i++) {
      const smaller = screen.getByRole('button', { name: 'Smaller dice' }) as HTMLButtonElement;
      if (smaller.disabled) break;
      fireEvent.click(smaller);
    }
    expect((screen.getByRole('button', { name: 'Smaller dice' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

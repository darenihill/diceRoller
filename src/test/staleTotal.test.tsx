import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const rollButton = () => screen.getByRole('button', { name: 'Roll dice' });
const isFaint = () => rollButton().querySelector('[data-stale]') !== null;

async function roll() {
  fireEvent.click(rollButton());
  await act(async () => { await new Promise(r => setTimeout(r, 1500)); });
}

describe("The Roll button's old total fades once you change the dice", () => {
  it('fades after adding a die, and the next roll brings it back', async () => {
    localStorage.clear();
    render(<App />);
    await roll();
    expect(isFaint()).toBe(false);

    fireEvent.click(screen.getByTitle('Add Dice'));
    expect(isFaint()).toBe(true);

    await roll();
    expect(isFaint()).toBe(false);
  });

  it('holding dice leaves the total bright', async () => {
    localStorage.clear();
    render(<App />);
    await roll();
    fireEvent.click(screen.getByTitle('Toggle Hold All'));
    expect(isFaint()).toBe(false);
  });
});

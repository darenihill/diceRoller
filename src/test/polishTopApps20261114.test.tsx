import React from 'react';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { ROLL_DURATION_MS } from '../utils/constants';

/*
 * Polish against top apps, 2026-11-14: while the dice tumble, the Roll button
 * kept showing the previous total at full strength over dice that hadn't
 * landed. It now fades like a stale total until they land.
 */

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(() => { localStorage.clear(); });

const rollButton = () => screen.getByRole('button', { name: /^Roll dice|roll again$/ });
const isFaint = () => rollButton().querySelector('[data-stale]') !== null;
const wait = (ms: number) => act(async () => { await new Promise(r => setTimeout(r, ms)); });

describe('The last total fades while the dice tumble', () => {
  it('is faint mid-roll and bright again once the dice land', async () => {
    localStorage.clear();
    render(<App />);
    fireEvent.click(rollButton());
    await wait(ROLL_DURATION_MS + 700);
    expect(isFaint()).toBe(false);

    fireEvent.click(rollButton());
    await wait(50);
    expect(isFaint()).toBe(true);

    await wait(ROLL_DURATION_MS + 700);
    expect(isFaint()).toBe(false);
  });

  it('a die rolled on its own leaves the big total bright', async () => {
    localStorage.clear();
    render(<App />);
    fireEvent.click(rollButton());
    await wait(ROLL_DURATION_MS + 700);
    fireEvent.click(screen.getAllByRole('button', { name: /^Roll only / })[0]);
    await wait(50);
    expect(isFaint()).toBe(false);
  });
});

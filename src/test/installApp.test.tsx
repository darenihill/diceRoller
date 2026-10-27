import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import * as analytics from '../utils/analytics';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const standalone = (on: boolean) => {
  window.matchMedia = ((q: string) => ({
    matches: on && q.includes('standalone'), media: q, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

describe('Install app tile', () => {
  beforeEach(() => { localStorage.clear(); standalone(false); vi.restoreAllMocks(); });

  it('opens the browser install box when the browser offers one', async () => {
    render(<App />);
    const prompt = vi.fn().mockResolvedValue(undefined);
    const offer = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt, userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });
    act(() => { window.dispatchEvent(offer); });
    expect(offer.defaultPrevented).toBe(true); // no banner on its own
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: /Install app/ }));
    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the two-step how-to where there is no install box (iPhone Safari)', async () => {
    render(<App />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: /Install app/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Install Dice Roller' });
    expect(dialog).toHaveTextContent('Share');
    expect(dialog).toHaveTextContent('Add to Home Screen');
  });

  it('counts install_clicked with no personal data', async () => {
    const spy = vi.spyOn(analytics, 'trackEvent');
    render(<App />);
    openMenu();
    fireEvent.click(screen.getByRole('button', { name: /Install app/ }));
    await screen.findByRole('dialog', { name: 'Install Dice Roller' });
    expect(spy).toHaveBeenCalledWith('install_clicked');
  });

  it('hides once the app runs from the home screen', () => {
    standalone(true);
    render(<App />);
    openMenu();
    expect(screen.queryByRole('button', { name: /Install app/ })).toBeNull();
    expect(screen.getByRole('button', { name: /RPG Mode/ })).toBeInTheDocument();
  });
});

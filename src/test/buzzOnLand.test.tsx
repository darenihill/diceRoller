import React from 'react';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { CustomizeModal } from '../components/modals/CustomizeModal';
import { scheduleLandingBuzz } from '../utils/soundEffects';
import { ROLL_DURATION_MS } from '../utils/constants';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const base = {
  isOpen: true, onClose: () => {}, theme: 'theme-dark', onSelectTheme: () => {},
  soundEnabled: false, onToggleSound: () => {}, targetHighlight: '', onChangeTargetHighlight: () => {},
  telemetryEnabled: true, onToggleTelemetry: () => {}, diceScale: 1, onChangeDiceScale: () => {},
  shakeEnabled: false, onToggleShake: () => {},
};

const stubVibrate = () => {
  const vibrate = vi.fn(() => true);
  Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true, writable: true });
  return vibrate;
};

afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
});

describe('Buzz when dice land', () => {
  it('keeps the switch hidden in Customize until its link was opened', () => {
    const { rerender } = render(<CustomizeModal {...base} onToggleBuzz={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Buzz when dice land' })).toBeNull();
    rerender(<CustomizeModal {...base} buzzShown buzzEnabled onToggleBuzz={() => {}} />);
    expect(screen.getByRole('button', { name: 'Buzz when dice land' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('buzzes once, when the dice land', () => {
    vi.useFakeTimers();
    const vibrate = stubVibrate();
    const timers = { current: [] as number[] };
    scheduleLandingBuzz(timers);
    vi.advanceTimersByTime(ROLL_DURATION_MS - 1);
    expect(vibrate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(vibrate).toHaveBeenCalledOnce();
  });

  it('stays off for everyone without the link: sound off, no buzz', () => {
    localStorage.clear();
    vi.useFakeTimers();
    const vibrate = stubVibrate();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('the link turns it on for this phone, clears itself, and a roll with sound off buzzes', () => {
    localStorage.clear();
    window.history.replaceState(null, '', '/#try-buzz');
    vi.useFakeTimers();
    const vibrate = stubVibrate();
    render(<App />);
    expect(window.location.hash).toBe('');
    expect(screen.getByText(/Buzz when dice land is on for this phone/)).toBeInTheDocument();
    expect(localStorage.getItem('buzzOnLand')).toBe('true');
    expect(localStorage.getItem('buzzSwitchShown')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));
    act(() => { vi.advanceTimersByTime(ROLL_DURATION_MS + 50); });
    expect(vibrate).toHaveBeenCalledOnce();
  });
});

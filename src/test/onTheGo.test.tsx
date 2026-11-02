import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import App from '../App';
import { useDiceState } from '../hooks/useDiceState';
import { TOAST_DURATION_MS } from '../utils/constants';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  // jsdom has no motion sensor; the app only checks that one exists
  (window as unknown as { DeviceMotionEvent: unknown }).DeviceMotionEvent ??= class extends Event {};
});

function shake() {
  const e = Object.assign(new Event('devicemotion'), { acceleration: { x: 30, y: 0, z: 0 } });
  act(() => { window.dispatchEvent(e); });
  act(() => { vi.advanceTimersByTime(2000); });
}

const rolls = () => JSON.parse(localStorage.getItem('rollHistory') || '[]').length;

describe('Shake to roll stays on the main screen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    localStorage.setItem('shakeToRoll', 'true');
  });
  afterEach(() => vi.useRealTimers());

  it('rolls from the main screen', () => {
    render(<App />);
    shake();
    expect(rolls()).toBe(1);
  });

  it('does not roll under the open menu or the Save dialog', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    shake();
    expect(rolls()).toBe(0);
    fireEvent.click(screen.getByText('Save'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    shake();
    expect(rolls()).toBe(0);
  });

  it('does not roll under a die\'s settings', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Dice Settings' })[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    shake();
    expect(rolls()).toBe(0);
  });
});

describe('Messages', () => {
  afterEach(() => vi.useRealTimers());

  it('are announced to screen readers', () => {
    localStorage.clear();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByText('Set Default'));
    expect(screen.getByRole('status')).toHaveTextContent('Saved as default');
  });

  it('a newer message gets its full time on screen', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDiceState());
    act(() => result.current.showToast('First'));
    act(() => { vi.advanceTimersByTime(TOAST_DURATION_MS - 500); });
    act(() => result.current.showToast('Second'));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.toast).toBe('Second');
    act(() => { vi.advanceTimersByTime(TOAST_DURATION_MS); });
    expect(result.current.toast).toBeNull();
  });
});

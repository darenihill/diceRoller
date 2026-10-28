import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from '../hooks/useWakeLock';

type Listener = () => void;

function fakeLock() {
  const listeners: Listener[] = [];
  return {
    release: vi.fn(() => Promise.resolve()),
    addEventListener: (_: 'release', fn: Listener) => { listeners.push(fn); },
    fireRelease: () => listeners.forEach(fn => fn()),
  };
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

function installWakeLock(request: () => Promise<unknown>) {
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: vi.fn(request) } });
  return (navigator as unknown as { wakeLock: { request: ReturnType<typeof vi.fn> } }).wakeLock.request;
}

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

afterEach(() => {
  delete (navigator as unknown as { wakeLock?: unknown }).wakeLock;
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
});

describe('screen stays on while Dice Roller is open', () => {
  it('asks for a screen wake lock when the app opens', async () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    const lock = fakeLock();
    const request = installWakeLock(() => Promise.resolve(lock));
    renderHook(() => useWakeLock());
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('screen');
  });

  it('asks again after you come back to the page', async () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    const first = fakeLock();
    const second = fakeLock();
    const locks = [first, second];
    const request = installWakeLock(() => Promise.resolve(locks.shift()));
    renderHook(() => useWakeLock());
    await flush();
    act(() => { setVisibility('hidden'); first.fireRelease(); });
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
    act(() => setVisibility('visible'));
    await flush();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('lets go of the lock when the app closes', async () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    const lock = fakeLock();
    installWakeLock(() => Promise.resolve(lock));
    const { unmount } = renderHook(() => useWakeLock());
    await flush();
    unmount();
    expect(lock.release).toHaveBeenCalledTimes(1);
  });

  it('carries on with no error in a browser without a wake lock', async () => {
    expect('wakeLock' in navigator).toBe(false);
    expect(() => renderHook(() => useWakeLock())).not.toThrow();
    await flush();
  });

  it('carries on with no error when the browser refuses', async () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    const request = installWakeLock(() => Promise.reject(new DOMException('Battery saver', 'NotAllowedError')));
    renderHook(() => useWakeLock());
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
  });
});

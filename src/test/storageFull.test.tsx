import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import App from '../App';
import { useStorage } from '../hooks/useStorage';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const fillStorage = () => vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
  throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
    { id: 'a', numberValue: 3, faces: 6, currentFaceIndex: 0, customFaces: [], color: '#ff0000', held: false }
  ] } }));
});
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe('Storage full', () => {
  it('saving a game with full storage does not break the app', () => {
    fillStorage();
    const { result } = renderHook(() => useStorage());
    expect(() => act(() => result.current.saveConfig('Catan night', []))).not.toThrow();
    expect(result.current.savedConfigs['Catan night']).toBeDefined();

    render(<App />);
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeInTheDocument();
  });

  it('says storage is full and Export backup starts a backup', () => {
    render(<App />);
    fillStorage();
    const makeUrl = vi.fn(() => 'blob:backup');
    Object.assign(URL, { createObjectURL: makeUrl, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    // Any save is now refused
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('Set Default'));
    const message = screen.getByRole('alert');
    expect(message).toHaveTextContent(/storage is full/);
    fireEvent.click(screen.getByRole('button', { name: 'Export backup' }));
    expect(makeUrl).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Set Default with full storage shows the storage message, not "Saved as default"', () => {
    render(<App />);
    fillStorage();
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('Set Default'));
    expect(screen.queryByText(/Saved as default/)).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent(/storage is full/);
  });

  it('the message can be closed', () => {
    render(<App />);
    fillStorage();
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('Set Default'));
    fireEvent.click(screen.getByRole('button', { name: 'Close storage message' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

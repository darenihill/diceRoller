import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import App from '../App';
import { SaveDialog } from '../components/modals/SaveDialog';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
beforeEach(() => localStorage.clear());

describe('Fresh eyes fixes (2026-11-05)', () => {
  it('Save puts the typing straight into the name box', () => {
    vi.useFakeTimers();
    render(<SaveDialog isOpen onClose={() => {}} onChangeSaveName={() => {}} saveName="" existingNames={[]} onSave={() => {}} />);
    act(() => { vi.runAllTimers(); });
    expect(screen.getByLabelText(/name this game/i)).toHaveFocus();
    vi.useRealTimers();
  });

  it('Escape closes the Add D&D die menu', async () => {
    localStorage.setItem('rpgMode', 'true');
    render(<App />);
    fireEvent.click(screen.getByTitle('Add a D&D die'));
    expect(screen.getByText('Add D&D die')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByText('Add D&D die')).toBeNull());
  });

  it('the Undo bar steps aside while the menu is open and comes back after', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Remove / })[0]);
    expect(screen.getByTestId('undo-bar')).toBeInTheDocument();
    const menu = screen.getAllByRole('button', { name: /menu/i })[0];
    fireEvent.click(menu);
    expect(screen.queryByTestId('undo-bar')).toBeNull();
    fireEvent.click(menu);
    expect(screen.getByTestId('undo-bar')).toBeInTheDocument();
  });
});

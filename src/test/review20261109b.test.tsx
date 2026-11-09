import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
// Closing things unmount at once, as they do once a phone's exit animation ends
vi.mock('framer-motion', async () => ({
  ...(await vi.importActual<object>('framer-motion')),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
import App from '../App';
import { UndoBar, UNDO_TAP_GUARD_MS } from '../components/UndoBar';
import { resetFaceImageCache } from '../utils/faceImages';

// Review 2026-11-09, second pass (stories, impaired, cognitive walk, top apps):
// mis-taps one-handed, tired or a bit tipsy.
beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const die = (id: string, name: string, extra: object = {}) => ({ id, numberValue: 1, faces: 6, customFaces: [], color: '#E9EAEC', name, held: false, ...extra });

beforeEach(() => {
  localStorage.clear();
  resetFaceImageCache();
  window.history.replaceState(null, '', '/');
});
afterEach(() => { vi.useRealTimers(); });

const gameNames = () => screen.queryAllByLabelText(/^Delete /).map(b => b.getAttribute('aria-label')!.replace(/^Delete /, ''));

function openGames() {
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Games' }));
}

describe('a double tap on a game\'s bin loses nothing', () => {
  beforeEach(() => {
    localStorage.setItem('diceConfigs', JSON.stringify({
      Friday: { name: 'Friday', config: [die('a', 'A')] },
      Saturday: { name: 'Saturday', config: [die('b', 'B')] },
      Sunday: { name: 'Sunday', config: [die('c', 'C')] },
    }));
  });

  it('one Undo brings back both games, each in its old place', () => {
    render(<App />);
    openGames();
    expect(gameNames()).toEqual(['Friday', 'Saturday', 'Sunday']);
    // The second tap lands where Friday's bin was, which is now Saturday's
    fireEvent.click(screen.getByLabelText('Delete Friday'));
    fireEvent.click(screen.getByLabelText('Delete Saturday'));
    expect(gameNames()).toEqual(['Sunday']);
    expect(screen.getByTestId('undo-bar')).toHaveTextContent('Deleted 2 games');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(gameNames()).toEqual(['Friday', 'Saturday', 'Sunday']);
    expect(screen.getByText('2 games are back')).toBeInTheDocument();
    expect(Object.keys(JSON.parse(localStorage.getItem('diceConfigs')!))).toEqual(['Friday', 'Saturday', 'Sunday']);
  });

  it('one game deleted comes back where it was, not at the end', () => {
    render(<App />);
    openGames();
    fireEvent.click(screen.getByLabelText('Delete Friday'));
    expect(screen.getByTestId('undo-bar')).toHaveTextContent('Deleted Friday');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(gameNames()).toEqual(['Friday', 'Saturday', 'Sunday']);
  });

  it('a delete after the bar has gone starts its own Undo', () => {
    vi.useFakeTimers();
    render(<App />);
    openGames();
    fireEvent.click(screen.getByLabelText('Delete Friday'));
    act(() => { vi.advanceTimersByTime(8000); });
    fireEvent.click(screen.getByLabelText('Delete Saturday'));
    expect(screen.getByTestId('undo-bar')).toHaveTextContent('Deleted Saturday');
  });
});

describe('two dice removed while the bar is up come back together', () => {
  it('Undo puts both back in their places', () => {
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [die('a', 'Red'), die('b', 'Blue'), die('c', 'Green')] } }));
    render(<App />);
    const names = () => screen.queryAllByLabelText(/^Settings for /).map(b => b.getAttribute('aria-label'));
    fireEvent.click(screen.getByLabelText('Remove Red'));
    fireEvent.click(screen.getByLabelText('Remove Blue'));
    expect(names()).toEqual(['Settings for Green']);
    expect(screen.getByTestId('undo-bar')).toHaveTextContent('Removed 2 dice');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(names()).toEqual(['Settings for Red', 'Settings for Blue', 'Settings for Green']);
  });
});

describe('the Undo bar ignores a tap meant for the button it opened over', () => {
  const offer = { message: 'Removed d6', undo: () => {}, back: 'd6 is back', big: false, key: 1 };
  const props = { windowMs: 7000, paused: false, onPause: () => {}, onResume: () => {} };

  it('a press that starts right as the bar shows does nothing; a later one works', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const onUndo = vi.fn();
    render(<UndoBar offer={offer} {...props} onUndo={onUndo} onDismiss={onDismiss} />);
    const bar = screen.getByTestId('undo-bar');
    const x = within(bar).getByRole('button', { name: 'Dismiss' });
    const undo = within(bar).getByRole('button', { name: 'Undo' });
    // The second half of a double tap on Remove
    fireEvent.pointerDown(x);
    fireEvent.click(x);
    fireEvent.pointerDown(undo);
    fireEvent.click(undo);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(onUndo).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(UNDO_TAP_GUARD_MS); });
    fireEvent.pointerDown(x);
    fireEvent.click(x);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('keyboard and screen reader presses work at once', () => {
    const onUndo = vi.fn();
    render(<UndoBar offer={offer} {...props} onUndo={onUndo} onDismiss={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledOnce();
  });
});

describe('removing a face\'s picture can be undone (standard 2)', () => {
  it('says what went, and Undo puts the picture back', () => {
    localStorage.setItem('diceFaceImages', JSON.stringify({ pic1: 'data:image/png;base64,AAAA' }));
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
      die('k', 'Kids', { faces: 2, customFaces: ['Mia:img:pic1', 'Leo'] }),
    ] } }));
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings for Kids'));
    fireEvent.click(screen.getByRole('tab', { name: 'Custom faces' }));
    fireEvent.click(screen.getByLabelText('Remove picture from face 1'));
    expect(screen.getByLabelText('Choose picture for face 1')).toBeInTheDocument();
    expect(screen.getByTestId('undo-bar')).toHaveTextContent('Removed picture');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText('Remove picture from face 1')).toBeInTheDocument();
    expect(screen.getByText('Picture is back')).toBeInTheDocument();
  });

  it('moving a face with a picture is not a removal', () => {
    localStorage.setItem('diceFaceImages', JSON.stringify({ pic1: 'data:image/png;base64,AAAA' }));
    localStorage.setItem('diceConfigs', JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
      die('k', 'Kids', { faces: 2, customFaces: ['Mia:img:pic1', 'Leo'] }),
    ] } }));
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings for Kids'));
    fireEvent.click(screen.getByRole('tab', { name: 'Custom faces' }));
    fireEvent.keyDown(screen.getByLabelText(/^Move face 1/), { key: 'ArrowDown' });
    expect(screen.queryByText(/Removed picture/)).toBeNull();
  });
});

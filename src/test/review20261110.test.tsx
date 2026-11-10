import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import LZString from 'lz-string';
import { vi } from 'vitest';
// Closing things unmount at once, as they do once a phone's exit animation ends
vi.mock('framer-motion', async () => ({
  ...(await vi.importActual<object>('framer-motion')),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
import App from '../App';
import { SaveDialog } from '../components/modals/SaveDialog';
import { readShareLink } from '../utils/setName';
import { dicePresets } from '../utils/presets';
import { resetFaceImageCache } from '../utils/faceImages';

// Review 2026-11-10: stories, security (STRIDE) and privacy.
beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  localStorage.clear();
  resetFaceImageCache();
  window.history.replaceState(null, '', '/');
});

describe('Enter in Save saves and nothing more', () => {
  it('the Enter that saves is kept from pressing the menu button that gets focus next', () => {
    const onSave = vi.fn();
    render(<SaveDialog isOpen onClose={() => {}} saveName="Friday" onChangeSaveName={() => {}} existingNames={[]} onSave={onSave} />);
    const box = screen.getByRole('textbox', { name: 'Name for this game' });
    // fireEvent returns false when the handler stopped the key's default action
    expect(fireEvent.keyDown(box, { key: 'Enter' })).toBe(false);
    expect(onSave).toHaveBeenCalledWith('new');
  });

  it('a taken name still just puts the keyboard away', () => {
    const onSave = vi.fn();
    render(<SaveDialog isOpen onClose={() => {}} saveName="Friday" onChangeSaveName={() => {}} existingNames={['Friday']} onSave={onSave} />);
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Name for this game' }), { key: 'Enter' });
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('the Undo bar never covers an open dialog\'s buttons', () => {
  const faces = () => JSON.stringify({ systemAutosave: { name: 'systemAutosave', config: [
    { id: 'a', numberValue: 1, faces: 3, customFaces: ['Mia', 'Leo', 'Ava'], color: '#E9EAEC', name: '', held: false },
  ] } });

  it('removing a face puts the bar at the screen\'s bottom edge, under the dialog', () => {
    localStorage.setItem('diceConfigs', faces());
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Settings for/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove face 2' }));
    const bar = screen.getByTestId('undo-bar');
    expect(bar).toHaveTextContent('Removed face Leo');
    expect(bar.className).toMatch(/toastBelowDialog/);
    // Done is still there to tap, and the face stays removed
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByTestId('undo-bar').className).not.toMatch(/toastBelowDialog/);
  });

  it('with no dialog open the bar stays just above the buttons', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Remove d6/ })[0]);
    expect(screen.getByTestId('undo-bar').className).not.toMatch(/toastBelowDialog/);
  });

  it('the bottom-edge place sits below a dialog of 80% screen height', () => {
    const css = readFileSync('src/App.module.css', 'utf8');
    expect(css).toMatch(/\.toastBelowDialog\s*\{\s*bottom:\s*calc\(12px/);
    expect(readFileSync('src/components/Modal.module.css', 'utf8')).toMatch(/max-height:\s*80vh/);
  });
});

describe('die settings tabs at a large text size', () => {
  it('the tab names wrap instead of running into each other', () => {
    const css = readFileSync('src/components/DiceSettingsModal.module.css', 'utf8');
    const tab = css.match(/\n\.tab\s*\{([^}]*)\}/)![1];
    expect(tab).toMatch(/white-space:\s*normal/);
    expect(tab).not.toMatch(/nowrap/);
  });
});

describe('a share link can\'t pass other dice off as a popular game', () => {
  const sixes = [{ faces: 6, customFaces: ['6', '6', '6', '6', '6', '6'] }, { faces: 6, customFaces: ['6', '6', '6', '6', '6', '6'] }];
  const link = (dice: object[], name: string) => `#share=${LZString.compressToEncodedURIComponent(JSON.stringify(dice))}&name=${encodeURIComponent(name)}`;

  it.each([
    ['a hidden zero-width space', 'Cat​an'],
    ['a hidden joiner', 'Cat⁠an'],
    ['wide letters', 'Ｃａｔａｎ'],
    ['an extra space', 'Cat an'],
  ])('%s', (_, name) => {
    expect(readShareLink(link(sixes, name)).name).toBeNull();
  });

  it('names that read backwards lose their direction marks', () => {
    expect(readShareLink(link(sixes, '‮natac')).name).toBe('natac');
  });

  it('Catan\'s own dice keep the name, and other names pass as typed', () => {
    const catan = dicePresets.find(p => p.name === 'Catan')!;
    expect(readShareLink(link(catan.dice, 'Catan')).name).toBe('Catan');
    expect(readShareLink(link(sixes, 'Family night 👨‍👩‍👧')).name).toBe('Family night 👨‍👩‍👧');
  });
});

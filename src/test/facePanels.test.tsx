import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiceSettingsModal } from '../components/DiceSettingsModal';
import type { DiceData } from '../types';

const withFaces: DiceData = { id: 'd1', numberValue: 1, faces: 3, customFaces: ['YES', 'NO', 'MAYBE'], color: '#6750A4', held: false };
const plain: DiceData = { id: 'd2', numberValue: 1, faces: 6, customFaces: [], color: '#6750A4', held: false };
const props = { isOpen: true, onClose: () => {}, onUpdate: () => {}, onRemove: () => {}, onClone: () => {} };

describe('Custom faces folds color, icons and text into three buttons', () => {
  it('opens with all three shut when the die has faces', () => {
    render(<DiceSettingsModal dice={withFaces} allDice={[withFaces]} {...props} />);
    for (const name of ['Color', 'Icons', 'Text']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.queryByLabelText('Custom face text')).toBeNull();
    expect(screen.queryByRole('group', { name: /Color for face/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'More icons' })).toBeNull();
  });

  it('opens one at a time, and a second tap shuts it', () => {
    render(<DiceSettingsModal dice={withFaces} allDice={[withFaces]} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Icons' }));
    expect(screen.getByRole('button', { name: 'More icons' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add a picture face/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Text' }));
    expect(screen.queryByRole('button', { name: 'More icons' })).toBeNull();
    expect(screen.getByLabelText('Custom face text')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Text' }));
    expect(screen.queryByLabelText('Custom face text')).toBeNull();
  });

  it('tapping a face opens its color', () => {
    render(<DiceSettingsModal dice={withFaces} allDice={[withFaces]} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /^Face 3:/ }));
    expect(screen.getByRole('button', { name: 'Color' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Color for face 3' })).toBeInTheDocument();
  });

  it('a die with no faces yet opens on Text, ready to type one', () => {
    render(<DiceSettingsModal dice={plain} allDice={[plain]} {...props} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Custom Faces' }));
    expect(screen.getByLabelText('Custom face text')).toBeInTheDocument();
  });
});

describe('Die settings puts Number of faces beside Name', () => {
  it('shares one row with the name box', () => {
    render(<DiceSettingsModal dice={plain} allDice={[plain]} {...props} />);
    const name = screen.getByLabelText('Name');
    const faces = screen.getByLabelText('Number of faces');
    expect(name.parentElement?.parentElement).toBe(faces.parentElement?.parentElement?.parentElement);
  });
});

describe('the face color row stays under Remove, Clone and Done until pinned', () => {
  it('the open panels are plain blocks, and the loose row has no stacking order of its own', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const css = readFileSync(resolve(__dirname, '../components/DiceSettingsModal.module.css'), 'utf8');
    const rule = (sel: string) => css.match(new RegExp(`\\n${sel.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    expect(rule('.panelBody')).toMatch(/display:\s*block/);
    expect(rule('.faceColourRowLoose')).toMatch(/z-index:\s*auto/);
  });
});

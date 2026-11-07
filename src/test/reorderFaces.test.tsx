import React, { useState } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiceSettingsModal } from '../components/DiceSettingsModal';
import type { DiceData } from '../types';

// jsdom has no PointerEvent, so pointer coordinates would be dropped
if (typeof window.PointerEvent === 'undefined') {
  class TestPointerEvent extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  (window as unknown as { PointerEvent: typeof TestPointerEvent }).PointerEvent = TestPointerEvent;
}

// Owner, 2026-11-05: drag a die's custom faces into a new order, arrow keys
// too, with Undo. Rolls don't change: the face showing stays the same face.
const start: DiceData = {
  id: 'd1', numberValue: 1, faces: 3, currentFaceIndex: 0,
  customFaces: ['YES:bg:#ff0000', 'NO', 'MAYBE'], color: '#6750A4', held: true,
};

let latest: DiceData = start;
const Harness: React.FC = () => {
  const [die, setDie] = useState<DiceData>(start);
  return (
    <DiceSettingsModal
      dice={die}
      allDice={[die]}
      isOpen
      onClose={() => {}}
      onUpdate={(_id, u) => setDie(d => { latest = { ...d, ...u }; return latest; })}
      onRemove={() => {}}
      onClone={() => {}}
    />
  );
};

const faceNames = () => screen.getAllByRole('button', { name: /^Face \d+:/ }).map(b => b.getAttribute('aria-label'));

describe('reordering custom faces', () => {
  beforeEach(() => { latest = start; });

  it('each face has a grip, explained in words', () => {
    render(<Harness />);
    expect(screen.getAllByRole('button', { name: /^Move face/ })).toHaveLength(3);
    expect(screen.getByText(/Drag a face by its grip/)).toBeInTheDocument();
  });

  it('arrow keys move a face with its color, and the shown face follows', () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole('button', { name: /^Move face 1,/ }), { key: 'ArrowDown' });
    expect(latest.customFaces).toEqual(['NO', 'YES:bg:#ff0000', 'MAYBE']);
    expect(latest.currentFaceIndex).toBe(1);
    expect(latest.held).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Move face 2,/ }));
    expect(faceNames()[1]).toBe('Face 2: YES');
    expect(screen.getByRole('status')).toHaveTextContent('"YES" moved to place 2 of 3.');
    // the ends stop the face
    fireEvent.keyDown(screen.getByRole('button', { name: /^Move face 1,/ }), { key: 'ArrowUp' });
    expect(latest.customFaces).toEqual(['NO', 'YES:bg:#ff0000', 'MAYBE']);
  });

  it('Undo puts back the order from before a run of moves', () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole('button', { name: /^Move face 1,/ }), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('button', { name: /^Move face 2,/ }), { key: 'ArrowRight' });
    expect(latest.customFaces).toEqual(['NO', 'MAYBE', 'YES:bg:#ff0000']);
    expect(latest.currentFaceIndex).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(latest.customFaces).toEqual(start.customFaces);
    expect(latest.currentFaceIndex).toBe(0);
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it('dragging a grip drops the face at the nearest place', () => {
    render(<Harness />);
    // lay the three cards out in a column, 60px apart
    screen.getAllByRole('button', { name: /^Move face/ }).forEach((grip, k) => {
      const card = grip.closest('div')!.parentElement!;
      card.getBoundingClientRect = () => ({ left: 0, top: k * 60, width: 100, height: 50, right: 100, bottom: k * 60 + 50, x: 0, y: k * 60, toJSON: () => ({}) });
    });
    const grip = screen.getByRole('button', { name: /^Move face 3,/ });
    fireEvent.pointerDown(grip, { button: 0, pointerId: 1, clientX: 10, clientY: 145 });
    fireEvent.pointerMove(grip, { pointerId: 1, clientX: 10, clientY: 20 });
    // the list shows where it would land before letting go
    expect(faceNames()[0]).toMatch(/MAYBE/);
    expect(latest.customFaces).toEqual(start.customFaces);
    fireEvent.pointerUp(grip, { pointerId: 1, clientX: 10, clientY: 20 });
    expect(latest.customFaces).toEqual(['MAYBE', 'YES:bg:#ff0000', 'NO']);
    expect(latest.currentFaceIndex).toBe(1);
  });

  it('a die with one face has nothing to reorder', () => {
    const one = { ...start, customFaces: ['YES'] };
    render(<DiceSettingsModal dice={one} allDice={[one]} isOpen onClose={() => {}} onUpdate={() => {}} onRemove={() => {}} onClone={() => {}} />);
    expect(screen.getByRole('button', { name: /^Move face 1,/ })).toBeDisabled();
  });
});

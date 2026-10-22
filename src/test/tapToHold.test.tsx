import React, { useState } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dice } from '../components/Dice';
import type { DiceData } from '../types';
import { holdHintShowsWords, recordTapHold, HOLD_HINT_WORDS_LIMIT } from '../utils/holdHint';

const die: DiceData = { id: 'a', numberValue: 3, faces: 6, currentFaceIndex: 2, name: '', customFaces: [], color: '#E9EAEC', held: false };

function Harness() {
  const [d, setD] = useState(die);
  const [revealed, setRevealed] = useState(false);
  return (
    <Dice dice={d} isRolling={false} isRevealed={revealed} onReveal={() => setRevealed(true)}
      onToggleHold={() => setD(x => ({ ...x, held: !x.held }))} onRemove={() => {}} onOpenSettings={() => {}} />
  );
}

const tap = (el: Element) => { fireEvent.pointerDown(el, { pointerType: 'touch' }); fireEvent.click(el); };

// jsdom has no PointerEvent, so pointerType would be lost
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventShim extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventShim;
}

beforeEach(() => localStorage.clear());

describe('Tapping a die on a phone', () => {
  it('selects on the first tap and holds on the second', () => {
    render(<Harness />);
    const el = screen.getByRole('button', { name: /d6 showing/ });
    tap(el);
    expect(el.getAttribute('aria-label')).not.toMatch(/held/);
    expect(screen.getByText('Tap again to hold')).toBeInTheDocument();
    tap(el);
    expect(el.getAttribute('aria-label')).toMatch(/, held/);
  });

  it('a mouse click still holds at once', () => {
    render(<Harness />);
    const el = screen.getByRole('button', { name: /d6 showing/ });
    fireEvent.pointerDown(el, { pointerType: 'mouse' });
    fireEvent.click(el);
    expect(el.getAttribute('aria-label')).toMatch(/, held/);
  });

  it('the corner lock holds directly', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Hold die' }));
    expect(screen.getByRole('button', { name: 'Release die' })).toBeInTheDocument();
  });

  it('drops the words after three tap-holds', () => {
    for (let i = 0; i < HOLD_HINT_WORDS_LIMIT; i++) {
      expect(holdHintShowsWords()).toBe(true);
      recordTapHold();
    }
    expect(holdHintShowsWords()).toBe(false);
  });
});

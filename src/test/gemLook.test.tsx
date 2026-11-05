import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Dice } from '../components/Dice';
import type { DiceData } from '../types';

const d20: DiceData = { id: 'g1', numberValue: 17, faces: 20, customFaces: [], color: '#5B6478', held: false, name: 'd20' };
const noop = () => {};
const show = (d: DiceData, rpgMode: boolean) => render(<Dice dice={d} isRolling={false} isRevealed={false} onReveal={noop} onToggleHold={noop} onRemove={noop} onOpenSettings={noop} onClone={noop} rpgMode={rpgMode} />);

describe('Gem look for D&D dice (owner, 2026-11-05)', () => {
  it('a shaped die puts its number on the front face and drops the plain "d20" name', () => {
    const { container } = show(d20, true);
    expect(container).not.toHaveTextContent('d20');
    const num = [...container.querySelectorAll('div')].find(el => el.textContent === '17' && el.style.top)!;
    expect(num.style.top).toBe('55%');
  });

  it('a die the owner named keeps its name, and a plain die keeps its number in the middle', () => {
    const { container } = show({ ...d20, name: 'Attack' }, true);
    expect(container).toHaveTextContent('Attack');
    const plain = show(d20, false).container;
    expect(plain).toHaveTextContent('d20');
  });
});

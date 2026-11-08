import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryModal } from '../components/modals/HistoryModal';
import { sanitizeRollHistory, type RollHistoryItem } from '../hooks/useDiceState';
import { historyTiles, historySubtitle } from '../utils/historyTiles';

// Owner, 2026-11-07: "History shows each roll as small dice, not 'd6 #1: 2, d6 #2: 4'"
const adv: RollHistoryItem = {
  id: 'a', total: 20, details: ['d20 #1: 17', 'd20 #2: 6 (dropped)', 'Modifier: +3'],
  modifier: 3, typed: 'd20 adv', colors: ['#B24BF3', '#B24BF3'],
};

describe('History rows as small dice', () => {
  it('one tile per die with its face and color; the left-out die is marked; the modifier is not a tile', () => {
    expect(historyTiles(adv)).toEqual([
      { face: '17', color: '#B24BF3', dropped: false },
      { face: '6', color: '#B24BF3', dropped: true },
    ]);
  });

  it('custom faces show their word, a counted face drops its number, and old rolls are plain white', () => {
    const t = historyTiles({ id: 'b', total: 6, details: ['Lunch die: Tacos', 'Stars: Star (6)'] });
    expect(t.map(x => x.face)).toEqual(['Tacos', 'Star']);
    expect(t.every(x => x.color === '#E9EAEC')).toBe(true);
  });

  it('a color that is not a plain hex never reaches the page', () => {
    const [bad] = sanitizeRollHistory([{ id: 'c', total: 1, details: ['d6 #1: 1'], colors: ['red;x:y'] }]);
    expect(historyTiles(bad)[0].color).toBe('#E9EAEC');
  });

  it('the name under the roll number: game, typed roll, or the one die', () => {
    expect(historySubtitle({ ...adv, game: 'Catan' })).toBe('Catan');
    expect(historySubtitle(adv)).toBe('d20 adv');
    expect(historySubtitle({ id: 'd', total: 3, details: ['Lunch die: Tacos'], single: true })).toBe('Lunch die');
    expect(historySubtitle({ id: 'e', total: 3, details: ['d6 #3: 3'], single: true })).toBe('One d6');
    expect(historySubtitle({ id: 'f', total: 3, details: ['d6 #1: 3'] })).toBe('');
  });

  it('the row shows tiles and the math, and a screen reader still hears the full lines', () => {
    render(<HistoryModal isOpen onClose={() => {}} rollHistory={[adv]} onClearHistory={() => {}} />);
    expect(screen.getByText('17 + 3')).toBeTruthy();
    expect(screen.getByText('d20 #1: 17, d20 #2: 6 (dropped), Modifier: +3')).toBeTruthy();
    const tiles = screen.getByText('17', { selector: 'span' }).parentElement!;
    expect(tiles.getAttribute('aria-hidden')).toBe('true');
    expect(tiles.children).toHaveLength(2);
  });
});

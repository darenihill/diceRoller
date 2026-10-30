import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { sanitizeRollHistory } from '../hooks/useDiceState';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

describe('Roll history from storage or a backup', () => {
  it('keeps good rolls and drops malformed ones', () => {
    const out = sanitizeRollHistory([
      { id: 'a', total: 7, details: ['d6: 3', 'd6: 4'], typed: '2d6', modifier: 0 },
      {},
      null,
      'x',
      { total: '7', details: [] },
      { total: 5, details: 'nope' },
      { total: 9, details: ['d8: 9', 42], isTargetHit: 'yes' },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ id: 'a', total: 7, typed: '2d6' });
    expect(out[1].details).toEqual(['d8: 9']);
    expect(out[1].isTargetHit).toBeUndefined();
    expect(out[1].id).toBeTruthy();
    expect(sanitizeRollHistory({ total: 1 })).toEqual([]);
  });

  it('a hand-edited history no longer breaks the History screen', () => {
    localStorage.clear();
    localStorage.setItem('rollHistory', JSON.stringify([{}, { total: 4, details: ['d4: 4'] }]));
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /menu/i })[0]);
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText('Roll Log (1)')).toBeInTheDocument();
  });
});

describe('Theme from storage or a backup', () => {
  it('an unknown theme falls back to dark', () => {
    localStorage.clear();
    localStorage.setItem('appTheme', 'theme-light evil" onload=x');
    render(<App />);
    expect(document.body.className).toContain('theme-dark');
    expect(document.body.className).not.toContain('evil');
  });
});

describe('Analytics never sees a share link', () => {
  it('every page sends GA only the address without the # part', () => {
    for (const page of ['index.html', 'catan-dice-roller/index.html', 'dnd-dice-roller/index.html', 'd20-roller/index.html', 'classroom-dice-roller/index.html']) {
      const html = readFileSync(page, 'utf8');
      expect(html, page).toContain("gtag('config', GA_ID, { page_location: location.origin + location.pathname });");
    }
  });
});

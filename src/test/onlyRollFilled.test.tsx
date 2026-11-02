import React from 'react';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(() => localStorage.clear());

describe('RPG Mode: only the big Roll button is filled blue', () => {
  it('leaves the typed-roll button and the roll types unfilled', () => {
    localStorage.setItem('rpgMode', 'true');
    const { container } = render(<App />);
    fireEvent.change(screen.getByRole('textbox', { name: /type a roll/i }), { target: { value: '2d6' } });
    const filled = [...container.querySelectorAll('.md-button-filled')];
    expect(filled).toHaveLength(1);
    expect(filled[0]).toHaveAttribute('aria-label', 'Roll dice');
  });

  it('tells screen readers which roll type is on', () => {
    localStorage.setItem('rpgMode', 'true');
    render(<App />);
    const normal = screen.getByTitle('Normal Roll');
    const adv = screen.getByTitle('Advantage: Keep Highest');
    expect(normal).toHaveAttribute('aria-pressed', 'true');
    expect(adv).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(adv);
    expect(adv).toHaveAttribute('aria-pressed', 'true');
    expect(normal).toHaveAttribute('aria-pressed', 'false');
  });
});

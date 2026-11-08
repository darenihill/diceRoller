import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidebarMenu } from '../components/SidebarMenu';

// Owner, 2026-11-07 (way A): on a phone each menu group shows a word, a shape and a tint
const a = vi.fn();
const menu = () => render(<SidebarMenu isOpen onToggle={a} onDonate={a} onIdeas={a} onHelp={a} onHistory={a} onStats={a} onSets={a} onCustomize={a} onDeleteAll={a} onSave={a} onShare={a} onSetDefault={a} rpgMode={false} onToggleRpgMode={a} />);

describe('menu groups on a phone', () => {
  it('each group has its heading word and a shape mark', () => {
    menu();
    for (const name of ['App', 'Settings', 'Saves']) {
      const heading = screen.getByText(name);
      expect(heading.querySelector('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('phones show the headings instead of hiding them, and tint each row', () => {
    const css = readFileSync('src/components/SidebarMenu.module.css', 'utf8');
    const phone = css.slice(css.indexOf('@media (max-width: 468px)'));
    expect(phone).not.toMatch(/\.menuColumnHeader\s*\{[^}]*display:\s*none/);
    expect(phone).toMatch(/\.menuColumnHeader\s*\{[^}]*grid-column:\s*1 \/ -1/);
    expect(phone).toMatch(/\.menuColumn \.menuItem\s*\{[^}]*var\(--group\)/);
  });

  it('the three colors are the colorblind-safe set, each with its own shape', () => {
    const css = readFileSync('src/components/SidebarMenu.module.css', 'utf8');
    expect(css).toMatch(/--group-settings:\s*#E69F00/);
    expect(css).toMatch(/--group-saves:\s*#CC79A7/);
    expect(css).toMatch(/\.groupApp \.groupMark\s*\{[^}]*border-radius:\s*50%/);
    expect(css).toMatch(/\.groupSaves \.groupMark\s*\{[^}]*border-bottom/);
  });
});

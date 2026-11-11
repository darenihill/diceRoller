import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { privacyPage } from '../../landing/privacy.mjs';
import { PRIVACY_CSP, renderPrivacy } from '../../scripts/landing-pages.mjs';
import { HelpModal } from '../components/modals/HelpModal';
import { CustomizeModal } from '../components/modals/CustomizeModal';

// Say plainly what goes to Google (owner, 2026-11-10, way "Privacy page plus
// a Help line"): a short Privacy page, a Help line and a switch called
// "Page metrics".

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const page = read('public/privacy/index.html');
const text = page.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('The Privacy page', () => {
  it('matches its generated file (run npm run landing)', () => {
    expect(page).toBe(renderPrivacy());
  });

  it('says what stays, what goes to Google, and how to turn it off', () => {
    for (const s of privacyPage.sections) {
      expect(text).toContain(s.heading);
      expect(text).toContain(s.body);
    }
    expect(text).toContain('Your dice, games, History and pictures. Nothing you type, name or photograph is ever sent.');
    expect(text).toContain('Customize, Page metrics, Off.');
    expect(text).toContain('its ID is deleted from this phone');
  });

  it('carries its own policy: no script at all, nothing from Google', () => {
    expect(page).toContain(`<meta http-equiv="Content-Security-Policy" content="${PRIVACY_CSP}" />`);
    expect(PRIVACY_CSP).toContain("script-src 'none'");
    expect(page).not.toMatch(/<script/);
    expect(page).not.toMatch(/googletagmanager|google-analytics|https?:\/\/(?!customdiceroller\.com\/)/);
    // Its font is the site's own copy
    expect(page).toContain("url('/fonts/roboto-latin.woff2')");
  });

  it('is in the sitemap and opens offline', () => {
    expect(read('public/sitemap.xml')).toContain('<loc>https://customdiceroller.com/privacy/</loc>');
    expect(read('public/sw.js')).toMatch(/ASSETS_TO_CACHE = \[[^\]]*'\/privacy\/'/);
  });

  it('reads on a small phone at a big text size: sizes in rem, a 16px gutter, long words wrap', () => {
    expect(page).toContain('width=device-width, initial-scale=1.0');
    expect(page).toMatch(/main \{ max-width: 40rem; margin: 0 auto; padding: 24px 16px 48px; \}/);
    expect(page).toContain('overflow-wrap: anywhere');
  });
});

describe('The page stays true to what the app sends', () => {
  // Every trackEvent payload field the app sends today. The page names each
  // kind (roll total and dice, RPG settings, the popular game, the theme, the
  // switches); a new field means the page needs a look first.
  it('the app sends only the fields the page describes', () => {
    const app = read('src/App.tsx');
    const fields = new Set<string>();
    for (const m of app.matchAll(/trackEvent\('[a-z_]+'(?:, \{([^}]*)\})?\)/g)) {
      for (const part of (m[1] ?? '').split(',')) {
        const key = part.split(':')[0].trim();
        if (key) fields.add(key);
      }
    }
    expect([...fields].sort()).toEqual(['diceCount', 'enabled', 'modifier', 'presetName', 'rollAdvantage', 'rpgMode', 'sum', 'theme', 'typed']);
    // A typed roll sends only that it was typed, never the words
    const typedValues = [...app.matchAll(/trackEvent\('[a-z_]+', \{[^}]*typed: ([^,}]+)/g)].map(m => m[1].trim());
    expect(typedValues.length).toBeGreaterThan(0);
    expect(new Set(typedValues)).toEqual(new Set(['true']));
  });
});

describe('Help', () => {
  it('has one Privacy line that links to the page', () => {
    render(<HelpModal isOpen onClose={() => {}} />);
    const lines = screen.getAllByRole('listitem').filter(li => /^Privacy:/.test(li.textContent ?? ''));
    expect(lines).toHaveLength(1);
    const link = screen.getByRole('link', { name: 'What goes to Google' });
    expect(link).toHaveAttribute('href', '/privacy/');
  });
});

describe('The switch is called Page metrics', () => {
  const base = {
    isOpen: true, onClose: () => {}, theme: 'theme-dark', onSelectTheme: () => {},
    soundEnabled: false, onToggleSound: () => {}, targetHighlight: '', onChangeTargetHighlight: () => {},
    telemetryEnabled: true, onToggleTelemetry: () => {}, diceScale: 1, onChangeDiceScale: () => {},
    shakeEnabled: false, onToggleShake: () => {},
  };

  it('its label and name say Page metrics, and its line ends in a What\'s sent link', () => {
    render(<CustomizeModal {...base} />);
    expect(screen.getByRole('button', { name: 'Page metrics' })).toHaveAttribute('title', 'Turn off page metrics');
    expect(screen.getByText('Page metrics')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: "What's sent" });
    expect(link).toHaveAttribute('href', '/privacy/');
    expect(link.parentElement?.lastElementChild).toBe(link);
    expect(document.body.textContent).not.toMatch(/anonymous page metrics/i);
  });

  it('the word list and the classroom page say Page metrics', () => {
    expect(read('DESIGN.md')).toMatch(/\| Page metrics \([^|]*\| anonymous page metrics, telemetry \|/);
    expect(read('classroom-dice-roller/index.html')).toContain('Page metrics can be turned off in Customize.');
    expect(read('classroom-dice-roller/index.html')).not.toMatch(/Anonymous page metrics/);
  });
});

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync, readdirSync } from 'node:fs';
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
  // Every event the app sends Google, with each field it carries, read from
  // the source (multi-line calls and any file too). Each pair must be one the
  // page names below, so a field added to an event fails here until the page
  // says it (second read, 2026-11-11: dice counts on save, share and add).
  const sourceFiles = (dir: string): string[] => readdirSync(join(process.cwd(), dir), { withFileTypes: true })
    .flatMap(e => e.isDirectory() ? (e.name === 'test' ? [] : sourceFiles(join(dir, e.name)))
      : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : []);

  /** The text between the "(" at `open` and its matching ")" */
  const argsAt = (src: string, open: number): string => {
    let depth = 0;
    for (let i = open; i < src.length; i++) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')' && --depth === 0) return src.slice(open + 1, i);
    }
    throw new Error('unclosed call');
  };
  /** Top-level keys of the first object literal in a call's arguments */
  const keysOf = (args: string): string[] => {
    const start = args.indexOf('{');
    if (start < 0) return [];
    const keys: string[] = [];
    let depth = 0;
    let part = '';
    for (const ch of args.slice(start + 1)) {
      if ('{[('.includes(ch)) depth++;
      if ('}])'.includes(ch)) { if (depth === 0) break; depth--; }
      if (ch === ',' && depth === 0) { keys.push(part); part = ''; } else part += ch;
    }
    keys.push(part);
    return keys.map(k => k.split(':')[0].trim()).filter(k => /^\w+$/.test(k));
  };
  const sent = (): Set<string> => {
    const pairs = new Set<string>();
    for (const file of sourceFiles('src')) {
      const src = readFileSync(join(process.cwd(), file), 'utf8');
      for (const m of src.matchAll(/\b(trackEvent|sendToGoogle|gtag)\(\s*'([a-z_]+)'/g)) {
        const args = argsAt(src, m.index! + m[1].length);
        pairs.add(m[2]);
        for (const key of keysOf(args.slice(args.indexOf(m[2]) + m[2].length + 1))) pairs.add(`${m[2]}.${key}`);
      }
    }
    return pairs;
  };

  // What the page says for each event and field
  const SAYS: Record<string, string> = {
    roll_dice: 'Your visits and taps',
    'roll_dice.rpgMode': 'whether each roll used RPG mode',
    'roll_dice.rollAdvantage': 'advantage or disadvantage',
    'roll_dice.diceCount': 'how many dice you roll',
    'roll_dice.typed': 'whether a roll was typed (never the words)',
    roll_one_die: 'taps',
    shake_roll: 'taps',
    preset_saved: 'save',
    'preset_saved.diceCount': 'how many dice you roll, save',
    share_link_copied: 'share',
    'share_link_copied.diceCount': 'how many dice you roll, save, share',
    dice_added: 'add',
    'dice_added.diceCount': 'how many dice you roll, save, share or add',
    'dice_added.typed': 'whether a roll was typed (never the words)',
    preset_loaded: 'the popular game you load',
    'preset_loaded.presetName': 'the popular game you load',
    theme_changed: 'the theme you pick',
    'theme_changed.theme': 'the theme you pick',
    table_view_toggled: 'the switches you turn on or off',
    'table_view_toggled.enabled': 'the switches you turn on or off',
    sound_toggled: 'the switches you turn on or off',
    'sound_toggled.enabled': 'the switches you turn on or off',
    shake_toggled: 'the switches you turn on or off',
    'shake_toggled.enabled': 'the switches you turn on or off',
    bright_rings_toggled: 'the switches you turn on or off',
    'bright_rings_toggled.enabled': 'the switches you turn on or off',
    sort_dice_toggled: 'the switches you turn on or off',
    'sort_dice_toggled.enabled': 'the switches you turn on or off',
    backup_exported: 'taps',
    backup_imported: 'taps',
    install_clicked: 'taps',
  };

  it('every event and field the app sends is one the page names', () => {
    const found = sent();
    expect(found.has('share_link_copied.diceCount')).toBe(true);
    expect(text).not.toMatch(/total/);
    expect([...found].filter(p => !(p in SAYS)), 'sent but not on the page').toEqual([]);
    for (const p of found) expect(text, p).toContain(SAYS[p]);
  });

  it('names what Google gathers by itself: the page you came from, screen size, rough city, device, browser, language, how far you scroll, its ID', () => {
    // GA4 reads the referrer and screen size with every page view, so the page
    // still says them now the app's own visit event is gone
    for (const words of ['the page you came from and your screen size', 'your rough city, device, browser and language', 'how far you scroll', 'a random ID Google keeps on this phone for up to 2 years after your last visit']) {
      expect(text).toContain(words);
    }
  });

  it('a typed roll sends only that it was typed, never the words', () => {
    const app = read('src/App.tsx');
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

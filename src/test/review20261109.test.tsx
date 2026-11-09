/**
 * @vitest-environment jsdom
 * @vitest-environment-options {"url": "https://customdiceroller.com/"}
 */
// Review 2026-11-09 (stories, laws of UX, privacy). Runs at the live site's
// address so Google's script and cookies behave as they do there.
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
// Closing things unmount at once, as they do once a phone's exit animation ends
vi.mock('framer-motion', async () => ({
  ...(await vi.importActual<object>('framer-motion')),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
import App from '../App';
import { restoreBackup } from '../utils/backup';
import { SAVED } from '../utils/savedValues';
import { setTelemetryEnabled, recordSessionStart } from '../utils/analytics';
import { landingPages } from '../../landing/pages.mjs';

beforeAll(() => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

const googleScripts = () => document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
const cookieNames = () => document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(Boolean);
const expireAll = () => {
  for (const name of cookieNames()) {
    for (const d of ['', '; domain=.customdiceroller.com']) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d}`;
  }
};

beforeEach(() => {
  localStorage.clear();
  googleScripts().forEach(s => s.remove());
  expireAll();
});
afterEach(() => {
  googleScripts().forEach(s => s.remove());
  expireAll();
});

describe('a backup can turn page metrics off, never back on', () => {
  it('keeps metrics off when the backup says on', () => {
    localStorage.setItem(SAVED.telemetry, 'false');
    expect(restoreBackup({ version: '1.1', configs: {}, telemetryEnabled: true })).toBe('ok');
    expect(localStorage.getItem(SAVED.telemetry)).toBe('false');
  });

  it('turns metrics off when the backup says off', () => {
    localStorage.setItem(SAVED.telemetry, 'true');
    restoreBackup({ version: '1.1', configs: {}, telemetryEnabled: false });
    expect(localStorage.getItem(SAVED.telemetry)).toBe('false');
  });
});

/** Runs the Google Analytics snippet from a page's <head> as a browser at the live site would. */
function runAnalyticsSnippet(html: string, metricsSetting: string | null) {
  const code = html.match(/<script>\s*(\(function \(\) \{\s*var GA_ID[\s\S]*?\}\)\(\);)\s*<\/script>/)?.[1];
  expect(code, 'the Google Analytics snippet').toBeTruthy();
  const fakeStorage = { getItem: (k: string) => (k === 'telemetryEnabled' ? metricsSetting : null) };
  new Function('location', 'localStorage', code!)({ hostname: 'customdiceroller.com', href: 'https://customdiceroller.com/' }, fakeStorage);
}

describe("with page metrics off, Google's script isn't fetched", () => {
  const pages = ['index.html', ...landingPages.map((p: { slug: string }) => `${p.slug}/index.html`)];

  it.each(pages)('%s skips the script when metrics are off, and fetches it when on', (page) => {
    const html = readFileSync(join(__dirname, '../..', page), 'utf8');
    runAnalyticsSnippet(html, 'false');
    expect(googleScripts()).toHaveLength(0);
    runAnalyticsSnippet(html, null);
    expect(googleScripts()).toHaveLength(1);
  });

  it('turning metrics on fetches the script once, without a reload', () => {
    setTelemetryEnabled(true);
    setTelemetryEnabled(true);
    expect(googleScripts()).toHaveLength(1);
  });
});

describe("turning page metrics off deletes Google's cookies", () => {
  function setGoogleCookies() {
    document.cookie = '_ga=GA1.1.315741284.1794238061; path=/; domain=.customdiceroller.com';
    document.cookie = '_ga_LF0JH7CVP6=GS2.1.s1794238060; path=/; domain=.customdiceroller.com';
    document.cookie = 'keepme=1; path=/';
    expect(cookieNames()).toEqual(expect.arrayContaining(['_ga', '_ga_LF0JH7CVP6', 'keepme']));
  }

  it('when the switch is turned off', () => {
    setGoogleCookies();
    setTelemetryEnabled(false);
    expect(cookieNames()).toEqual(['keepme']);
  });

  it('on each visit while metrics are off, so cookies left from before go too', () => {
    setGoogleCookies();
    localStorage.setItem(SAVED.telemetry, 'false');
    recordSessionStart();
    expect(cookieNames()).toEqual(['keepme']);
  });

  it('leaves them while metrics are on', () => {
    setGoogleCookies();
    recordSessionStart();
    expect(cookieNames()).toEqual(expect.arrayContaining(['_ga', '_ga_LF0JH7CVP6']));
  });
});

describe('closing a dialog opened from the menu', () => {
  it.each(['Customize', 'History', 'Games', 'Help', 'Usage stats', 'Save'])('puts focus back on the menu button after %s', (tile) => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Open menu'));
    const button = screen.getByRole('button', { name: tile });
    button.focus();
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => { fireEvent.keyDown(window, { key: 'Escape' }); });
    expect(document.activeElement).toBe(screen.getByLabelText('Open menu'));
  });
});

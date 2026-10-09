import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { landingPages } from '../../landing/pages.mjs';
import { renderPage, renderSitemap, sitemapLastmod } from '../../scripts/landing-pages.mjs';
import { parseLandingStart } from '../utils/landing';
import { currentSetName, diceSignature } from '../utils/setName';
import { dicePresets } from '../utils/presets';

// Vitest runs from the project root
const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('landing pages', () => {
  const template = read('index.html');

  it.each(landingPages.map(p => [p.slug, p] as const))('%s matches its generated file (run npm run landing)', (slug, page) => {
    expect(read(`${slug}/index.html`)).toBe(renderPage(template, page));
  });

  it('the sitemap lists the home page and every landing page', () => {
    const lastmod = sitemapLastmod();
    expect(read('public/sitemap.xml')).toBe(renderSitemap(lastmod));
    for (const page of landingPages) expect(read('public/sitemap.xml')).toContain(`/${page.slug}/`);
  });

  it.each(landingPages.map(p => [p.slug, p] as const))('%s opens with dice and a name for the chip', (_slug, page) => {
    const start = parseLandingStart(JSON.stringify({ heading: page.heading, ...page.start }));
    expect(start).not.toBeNull();
    expect(start!.dice.length).toBeGreaterThan(0);
    const loaded = start!.name ? { name: start!.name, signature: diceSignature(start!.dice) } : null;
    expect(currentSetName(start!.dice, loaded)).toBeTruthy();
    if (page.start.preset) expect(dicePresets.some(p => p.name === page.start.preset)).toBe(true);
  });

  it('each page has its own title, description and 150 to 300 words of writing', () => {
    const titles = new Set(landingPages.map(p => p.title));
    expect(titles.size).toBe(landingPages.length);
    for (const page of landingPages) {
      const words = page.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
      expect(words, page.slug).toBeGreaterThanOrEqual(150);
      expect(words, page.slug).toBeLessThanOrEqual(300);
      expect(page.description.length, page.slug).toBeLessThanOrEqual(160);
    }
  });

  it('a page without a start, or with an unreadable one, falls back to the usual dice', () => {
    expect(parseLandingStart(undefined)).toBeNull();
    expect(parseLandingStart('{not json')).toBeNull();
    expect(parseLandingStart('{"preset":"No such game"}')).toBeNull();
  });
});

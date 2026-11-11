// Builds one <slug>/index.html per entry in landing/pages.mjs from index.html,
// plus public/sitemap.xml. Run `npm run landing` after changing either file;
// src/test/landingPages.test.ts fails while the committed output is stale.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { landingPages } from '../landing/pages.mjs';
import { privacyPage } from '../landing/privacy.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://customdiceroller.com';

const escapeAttr = (s) => s
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');

function replaceOnce(html, from, to) {
  if (!html.includes(from)) throw new Error(`landing-pages: template no longer contains ${from}`);
  return html.replace(from, () => to);
}

const DEFAULT_TITLE = 'Custom Dice Roller — Build and Roll Any Dice Online';
const DEFAULT_DESCRIPTION = 'Free online dice roller for board games and tabletop RPGs. Build custom dice with any faces, colours and icons, then share your set with a link.';

export function renderPage(template, page) {
  const url = `${SITE}/${page.slug}/`;
  const title = escapeAttr(page.title);
  const description = escapeAttr(page.description);
  let html = template;
  html = html.replaceAll(`<title>${DEFAULT_TITLE}</title>`, `<title>${title}</title>`);
  html = html.replaceAll(`content="${DEFAULT_TITLE}"`, `content="${title}"`);
  html = html.replaceAll(`content="${DEFAULT_DESCRIPTION}"`, `content="${description}"`);
  html = replaceOnce(html, `<meta property="og:url" content="${SITE}/" />`, `<meta property="og:url" content="${url}" />`);
  html = replaceOnce(html, `<link rel="canonical" href="${SITE}/" />`, `<link rel="canonical" href="${url}" />`);
  html = html.replace(/\n\s*<!-- home-about:[\s\S]*?<!-- \/home-about -->/, '');
  if (html.includes('home-about')) throw new Error('landing-pages: could not strip the home page About');
  html = replaceOnce(html, '<body>', '<body class="landing">');
  const start = escapeAttr(JSON.stringify({ heading: page.heading, ...page.start }));
  html = replaceOnce(html, '<div id="root"></div>', `<div id="root" data-start="${start}"></div>`);

  const others = landingPages
    .filter(p => p.slug !== page.slug)
    .map(p => `<a href="/${p.slug}/">${p.heading}</a>`)
    .concat('<a href="/">Build your own dice</a>')
    .join(' · ');
  const article = [
    '<!-- Generated from landing/pages.mjs by scripts/landing-pages.mjs. Edit those, not this. -->',
    '<article class="landing-article">',
    `<h2 class="landing-title">${page.heading}</h2>`,
    page.body.trim(),
    `<nav class="landing-more" aria-label="More dice rollers">${others}</nav>`,
    '</article>',
    '<noscript><p class="landing-article">This app needs JavaScript enabled to roll dice.</p></noscript>',
  ].join('\n    ');
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, () => article);
  return html;
}

// Content-Security-Policy (owner, 2026-11-10: "the site refuses code from
// anywhere except itself and Google"). A <meta> because the host can't send
// headers, so frame-ancestors is left out (a meta policy ignores it). The two
// inline scripts (Google Analytics' start, the service worker sign-up) are
// allowed by their sha256, worked out here, so editing one and running
// `npm run landing` keeps the policy in step; src/test/picks20261110.test.tsx
// fails while it isn't. style-src keeps 'unsafe-inline': React and the
// animation library set style="" on elements.
const GOOGLE_ANALYTICS = {
  script: ['https://www.googletagmanager.com'],
  connect: ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'],
  img: ['https://*.google-analytics.com', 'https://*.googletagmanager.com'],
};

/** sha256 sources for each inline script that runs (not src=, not JSON-LD data) */
export function inlineScriptHashes(html) {
  const hashes = [];
  for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1] ?? '';
    if (/\bsrc=/.test(attrs) || /type="application\/ld\+json"/.test(attrs)) continue;
    hashes.push(`'sha256-${createHash('sha256').update(m[2], 'utf8').digest('base64')}'`);
  }
  return hashes;
}

export function contentSecurityPolicy(html) {
  return [
    "default-src 'self'",
    `script-src 'self' ${[...inlineScriptHashes(html), ...GOOGLE_ANALYTICS.script].join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    // Face pictures are data: URLs, and a chosen picture is read from a blob:
    `img-src 'self' data: blob: ${GOOGLE_ANALYTICS.img.join(' ')}`,
    `connect-src 'self' ${GOOGLE_ANALYTICS.connect.join(' ')}`,
    "font-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

const CSP_META = /<meta http-equiv="Content-Security-Policy" content="[^"]*" \/>/;

/** Writes the page's own policy into its Content-Security-Policy meta */
export function withCsp(html) {
  if (!CSP_META.test(html)) throw new Error('landing-pages: index.html has no Content-Security-Policy meta');
  return html.replace(CSP_META, () => `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(html)}" />`);
}

// The Privacy page: plain HTML in the site's look, with no script at all, so
// its policy allows none and nothing on it reaches Google (owner, 2026-11-10).
// It follows the phone's light or dark setting, since it can't read the app's
// own theme without a script.
export const PRIVACY_CSP = [
  "default-src 'self'",
  "script-src 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const ROBOTO = [400, 700].map(w => `@font-face { font-family: 'Roboto'; font-style: normal; font-weight: ${w}; font-display: swap; src: url('/fonts/roboto-latin.woff2') format('woff2'); }`).join('\n      ');

export function renderPrivacy(page = privacyPage) {
  const url = `${SITE}/${page.slug}/`;
  const sections = page.sections
    .map(s => `<section>\n        <h2>${s.heading}</h2>\n        <p>${s.body}</p>\n      </section>`)
    .join('\n      ');
  return `<!doctype html>
<!-- Generated from landing/privacy.mjs by scripts/landing-pages.mjs. Edit those, not this. -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="${PRIVACY_CSP}" />
    <title>${escapeAttr(page.title)}</title>
    <meta name="description" content="${escapeAttr(page.description)}" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#121212" />
    <style>
      ${ROBOTO}
      :root {
        color-scheme: dark light;
        --background: #121212; --surface: #2D2D2D; --text: #E3E3E3; --muted: #C4C7C5; --primary: #A8C7FA; --outline: #8E918F;
      }
      @media (prefers-color-scheme: light) {
        :root { --background: #FDFDFD; --surface: #E0E0E0; --text: #1A1A1A; --muted: #444746; --primary: #0056D2; --outline: #747775; }
      }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--background); color: var(--text); font-family: 'Roboto', system-ui, sans-serif; font-size: 1rem; line-height: 1.6; overflow-wrap: anywhere; }
      main { max-width: 40rem; margin: 0 auto; padding: 24px 16px 48px; }
      h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 8px; }
      h2 { font-size: 1.125rem; font-weight: 700; margin: 0 0 4px; }
      section { padding: 16px 0; border-top: 1px solid var(--outline); }
      p { margin: 0; color: var(--muted); }
      a { color: var(--primary); font-weight: 700; }
      a:focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; border-radius: 4px; }
      .back { display: inline-flex; align-items: center; min-height: 48px; margin-bottom: 8px; }
    </style>
  </head>
  <body>
    <main>
      <a class="back" href="/">← Dice Roller</a>
      <h1>Privacy</h1>
      ${sections}
    </main>
  </body>
</html>
`;
}

export function renderSitemap(lastmod) {
  const urls = [{ loc: `${SITE}/`, priority: '1.0' }]
    .concat(landingPages.map(p => ({ loc: `${SITE}/${p.slug}/`, priority: '0.8' })))
    .concat({ loc: `${SITE}/${privacyPage.slug}/`, priority: '0.3' });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- Generated by scripts/landing-pages.mjs from landing/pages.mjs. -->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`),
    '</urlset>',
    '',
  ].join('\n');
}

export function sitemapLastmod() {
  const current = readFileSync(join(ROOT, 'public/sitemap.xml'), 'utf8');
  return current.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const template = withCsp(readFileSync(join(ROOT, 'index.html'), 'utf8'));
  writeFileSync(join(ROOT, 'index.html'), template);
  for (const page of landingPages) {
    mkdirSync(join(ROOT, page.slug), { recursive: true });
    writeFileSync(join(ROOT, page.slug, 'index.html'), withCsp(renderPage(template, page)));
  }
  mkdirSync(join(ROOT, 'public', privacyPage.slug), { recursive: true });
  writeFileSync(join(ROOT, 'public', privacyPage.slug, 'index.html'), renderPrivacy());
  const lastmod = process.argv[2] || new Date().toISOString().slice(0, 10);
  writeFileSync(join(ROOT, 'public/sitemap.xml'), renderSitemap(lastmod));
  console.log(`landing-pages: wrote ${landingPages.length} pages, the Privacy page and the sitemap (lastmod ${lastmod})`);
}

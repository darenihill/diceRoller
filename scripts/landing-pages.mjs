// Builds one <slug>/index.html per entry in landing/pages.mjs from index.html,
// plus public/sitemap.xml. Run `npm run landing` after changing either file;
// src/test/landingPages.test.ts fails while the committed output is stale.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { landingPages } from '../landing/pages.mjs';

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

export function renderSitemap(lastmod) {
  const urls = [{ loc: `${SITE}/`, priority: '1.0' }]
    .concat(landingPages.map(p => ({ loc: `${SITE}/${p.slug}/`, priority: '0.8' })));
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
  const lastmod = process.argv[2] || new Date().toISOString().slice(0, 10);
  writeFileSync(join(ROOT, 'public/sitemap.xml'), renderSitemap(lastmod));
  console.log(`landing-pages: wrote ${landingPages.length} pages and the sitemap (lastmod ${lastmod})`);
}

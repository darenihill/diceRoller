Changed: yes

# Three Focus cards built as fixes (2026-11-10)

Daren's point on the Desk (2026-11-10): standards and fixes shouldn't be
cards. Three of the new Focus cards were plain fixes, so they were built as
fixes, with the same words and flows. Screenshots are in the project files
under dice-roller/2026-11-10/card-fixes/ (`before-*` and `after-*`).

## 1. Die settings face cards turn white on Clean Light

- **Before:** the face cards, the − and + buttons and the icon picker darkened
  the panel with a fixed black. On Clean Light each face card was a mid-gray
  block that read as switched off, and the "counts as" box edge was 2.45:1
  against it.
- **After:** they use a shade set by each theme. On Clean Light the face cards
  are white with a thin gray edge, and − and + and the icons are light gray.
  The "counts as" edge is 4.5:1 on Clean Light. Dark, Felt and Midnight keep
  exactly the shade they had (the same 15% and 20% darker than the panel).

## 2. Messages like "Saved" no longer cover the menu's Clear all

- **Before:** save a game, then open the menu within 3 seconds, and "Saved"
  sat on the right half of Clear all.
- **After:** while the menu (or the Add menu) is open, no message shows on it.
  A message that is still fresh when the menu closes shows then, as the Undo
  bar already did. One that ran out while the menu was open doesn't come back.

## 3. One offline copy per page, without ad IDs

- **Before:** the offline worker saved the page under its full link, so
  opening the site from a Facebook ad and a Google ad left two more copies,
  each with its tracking ID (checked in Chromium: `/`, `/?fbclid=…` and
  `/?gclid=…&utm_source=…` all saved).
- **After:** the page is saved under its plain address, so all three links
  share one copy and no ID is kept. Each landing page (Catan, D20 and so on)
  still has its own. The cache version moved from v5 to v6, so the old copies
  with IDs are cleared the first time the new version runs. Offline, an ad
  link and the plain address both still open the app (checked in Chromium
  with the network off). This is offline code on the public site, so check it
  again on the live site after it lands.

## Standards applied

- Accessibility (9) | Die settings, Custom Faces on Clean Light | Before: face cards were mid-gray blocks and the "counts as" box edge was 2.45:1 | After: white face cards with a gray edge; the box edge is 4.5:1, and the other themes look the same (`src/test/cardFixes.test.tsx`)
- Undo and messages | Menu | Before: "Saved" covered half of Clear all for up to 3 seconds | After: messages wait while the menu is open and show when it closes if still fresh (`src/test/cardFixes.test.tsx`)
- Privacy | Offline copy (whole app) | Before: one saved copy per ad link, each keeping its ad ID | After: one copy per page under its plain address; old copies cleared by the v6 cache (`src/test/cardFixes.test.tsx`)
- Can't come back (19) | All three | Before: no check | After: `src/test/cardFixes.test.tsx`, 15 checks; 14 failed on the old code (the 15th guards that a message that ran out stays gone)

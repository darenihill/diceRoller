Changed: yes

# Contrast and dark mode (polish-ui-contrast-11), 2026-10-26

Lens: does every screen pass WCAG AA contrast in light and dark mode, without
colour alone carrying meaning?

## How it was checked

- All four themes (dark, light, felt, midnight), at phone size (390×844).
- 13 screens each: the dice, after a roll, a selected and a held die, the menu,
  Help, History, Customize, Usage Stats, Games, About, Dice Settings, and in RPG
  mode the dice plus a typo in the Type a roll box. 52 scans in all.
- axe-core 4.10 colour-contrast rule on each screen, plus a measure of every
  visible icon against its own button (WCAG 1.4.11 asks 3:1).
- Compared against the Material 3 light baseline colour roles (the scheme
  Google's own light apps use for delete and error text) and Apple's HIG
  rule that a state shown by colour also needs a shape or a word.

## Before

Dark, felt and midnight passed everywhere. The light theme had three misses:

| Where | What | Contrast |
|---|---|---|
| Menu, Clear All (seen under every dialog opened from the menu) | pink red text on light grey | 1.29:1 (needs 4.5) |
| RPG mode, Type a roll note after a typo | same pink red on near white | 1.67:1 (needs 4.5) |
| A held die's lock icon | bright gold on light grey | 1.06:1 (needs 3) |

The light theme never set its own error colours, so it used the dark theme's
pink, which is made for dark backgrounds. The lock used bright gold, also made
for dark backgrounds.

A selected but not held die drew its unlock icon in fixed white, overriding the
theme colour its CSS already asked for; on light grey that is 1.3:1.

## What was done (fixes, nothing added)

- Light theme sets the Material 3 light error roles: red #B3261E with white on
  it. Clear All, the typo note and Dice Settings warnings are now 4.9:1 or more;
  the remove (X) button on a die is solid red with a white X instead of pink
  with a dark red X.
- New token `--color-gold-ink` for gold used as an icon or text colour: the
  same bright gold on dark themes, deep gold #7A5C00 on light (4.7:1 on the
  button). Used by the held lock, Hold all and History's HIT!. Glows and
  borders for a natural 20 keep the bright gold.
- The unlock icon uses the theme's on-surface colour instead of fixed white.
- `src/test/themeContrast.test.ts` checks every theme's tokens (text 4.5:1,
  icons 3:1); it fails on the old light theme.

## After

All 52 scans pass with no contrast findings; every visible icon is 3:1 or more.
Tests 136 pass; lint, build and the CSS guard pass (`npm run precommit`).

## Colour alone

- Held dice: the icon changes shape (lock vs open lock) as well as colour, and
  the die's label says "held". Fine.
- Target hit in History: gold border plus the words "HIT!". Fine.
- Natural 20 and natural 1 glow gold and red, but the number on the die is the
  meaning; the glow only celebrates it. Fine.
- Disabled buttons (reset modifier) are faded; WCAG exempts disabled controls.

## ui-check

Changed files only. Raw colours added only in `src/index.css`, the token
source. No new components or inline layout styles. DESIGN.md §2 now records
the light error roles, `--color-gold-ink` and the contrast test.

## Suggested next goals

None. Everything found was a fix.

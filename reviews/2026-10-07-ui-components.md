# Polish: standard components (2026-10-07)

Lens: which screens hand-build something a standard component already does,
or bend the design spec's colors, type or spacing?

The app had no DESIGN.md, so this pass first drafted one from what the code
uses (DESIGN.md, Status DRAFT, Material Design 3). Screens checked at phone
width (390 x 844) in Chromium: Customize, Games & Saves, History, Clear All
confirm, Dice Settings. Compared against the Android Settings app and Google
Keep (on/off settings, small chips, confirm dialogs) and Material 3's own
component specs.

## Found

| Screen | Hand-built | Standard it should use |
|---|---|---|
| Clear All confirm | red "Delete All" button painted inline | one danger button style |
| History | "Clear History" sized inline | one compact button style |
| Dice Settings | four template chips each sized inline (same values, 4 copies) | the same compact button style |
| Customize | sound and metrics toggles: icon buttons recolored inline, no on/off state for screen readers | M3 icon toggle: one style keyed on `aria-pressed` |
| Customize | theme cards say nothing about which is selected except a border | `aria-pressed` on the selected theme |
| Games & Saves | Export and Import Backup cards laid out inline | one card-with-icon class |
| History | roll log row has fixed 80px and 100px columns, so on a phone the details squeeze into one word per line ("d6 / #1: / 2,") | M3 list item: label, supporting text, trailing total |

## Done

- Added three shared styles: compact button, danger button, icon toggle
  (on state uses the primary container, set by `aria-pressed`), and an
  icon-card class. Ten inline style blocks replaced with them.
- Sound, metrics and theme buttons now tell screen readers whether they are on.
- History rows size to their content: the details read on one or two lines
  instead of five.
- Looks the same everywhere else (before/after screenshots below). Nothing
  the app does changed.

Checked: lint, 34 tests, type check, build and the CSS guard pass.

Before/after (left/right) in the project's dice-roller folder:
`ui-cmp-history.png` (the visible fix), `ui-cmp-customize.png`,
`ui-cmp-confirm.png`, `ui-cmp-dice-settings.png`, `ui-cmp-games-backup.png`.

## Left for later

- About 40 inline layout styles remain (listed as Known drift in DESIGN.md);
  moving them is safe but slow, and best done screen by screen.
- DESIGN.md is a draft; it becomes the rule once ratified.

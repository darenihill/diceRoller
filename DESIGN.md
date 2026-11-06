# Dice Roller — design spec

Drafted 2026-10-07 by the ui-check retrofit pass (standard-components polish,
reviews/2026-10-07-ui-components.md). Not ratified: every value below records
what the code uses today, so checks have something true to compare against.

**Base system:** Material Design 3
**Platform:** web (React 19 + Vite, CSS modules)
**Status:** DRAFT

> The base system wins where this spec is silent. Departures belong in §9.

## 1. Tokens

| Family | Code location | Notes |
|---|---|---|
| Colors | `src/index.css` `:root` and `body.theme-*` (`--md-sys-color-*`, `--color-*`) | four themes: dark (default), light, felt, midnight |
| Typography | Roboto 400/500/700 from Google Fonts (`src/index.css`) | no named type-style classes yet (Known drift) |
| Spacing | none; raw px in CSS modules | Known drift |
| Radius | `--shape-small` 8, `--shape-medium` 12, `--shape-large` 16; buttons fully rounded | |
| Elevation | `--elevation-1..3` | |

## 2. Color roles

M3 dark-theme roles: background, surface, surface-variant, surface-hover,
on-background, on-surface, primary, on-primary, primary-container,
on-primary-container, error, on-error. Accent tokens (`--color-gold`,
`--color-crit-red`, `--color-success`, `--color-accent-blue`, `--color-orange`,
`--color-purple`) are dice and celebration colors, not UI roles.

Contrast (2026-10-26, reviews/2026-10-26-ui-contrast.md): every theme keeps
text at 4.5:1 and icons at 3:1, checked by `src/test/themeContrast.test.ts`.
The light theme sets its own M3 light `error`/`on-error`. Gold used as an icon
or text colour (the held lock, Hold all, HIT!) is `--color-gold-ink`, which is
bright gold on dark themes and deep gold on light; glows and borders keep
`--color-gold`.

## 5. Component vocabulary

| Need | Use | Maps to (M3) |
|---|---|---|
| Primary action | `.md-button.md-button-filled` | filled tonal button |
| Secondary action | `.md-button.md-button-surface` | tonal button |
| Small in-dialog action or template chip | add `.md-button-compact` | small button / assist chip |
| Destructive confirm | `.md-button.md-button-danger` | error-colored button |
| Icon action | `.md-icon-button` | icon button |
| On/off setting | `.md-icon-button` with `aria-pressed` | icon toggle button |
| Card / tile | `.md-card` | card |
| Card with icon over label | `.md-card` + `Modals.module.css` `.iconCard` | card |
| Dialog | `components/Modal.tsx` (title, close, Esc, focus trap) | dialog |
| Feedback | the app toast (`showToast`) | snackbar |

## 6. States

Icon-only controls carry `aria-label` (or `title` at minimum). Toggles say
their state with `aria-pressed`. Dialogs trap focus and close on Esc.

## 9. Deviations

| What | M3 says | This project does | Why |
|---|---|---|---|
| Theme picker cards | surface colors from tokens | each card is painted in its own theme's colors (raw hex in `CustomizeModal.tsx`) | the card is a preview of that theme |

## 10. Known drift (2026-10-07)

- 53 inline `style={{}}` objects before this pass; 43 remain, mostly
  layout (flex/grid gaps) in modals. Biggest pockets: `DiceSettingsModal.tsx`,
  `HistoryModal.tsx`, `HelpModal.tsx`.
- No spacing scale or named type styles; font sizes are raw px in CSS modules.
- 2026-10-19: text colors in Dice Settings and the Dropped badge moved from
  raw white/grey to on-surface and on-error tokens (reviews/2026-10-19-ui-components.md).

## 11. Verification

`npm run precommit` (lint, tests, type check and build, CSS guard).

## 12. Words (2026-11-06)

One word per thing, from reviews/2026-11-06-copy.md. Sentence case for every
label and title; no "successfully", "simply" or "failed to"; no exclamation
marks in messages; "and", not "&", in titles; "…" not "..."; US spelling.

| Use | Not | Note |
|---|---|---|
| game | save (noun), preset, set, configuration | "Save" is the verb. Landing prose may say "dice set" |
| ready-made game | preset, predefined | Built-in games |
| die (one), dice (more) | dice for one | Die settings, Remove die, Add a die |
| hold, held / release | lock, keep, unheld | The lock icon is fine. "Keep" is only advantage keeping the highest |
| RPG mode | D&D mode | D&D only for the Dungeons & Dragons game and page |
| Customize | Settings (for the app) | App options |
| die settings | dice settings, gear menu | One die's options |
| History, Frequency | roll log, Luck Meter | Menu item and tabs |
| clear | wipe, delete all | Emptying a list |
| delete | remove (for games) | A saved game; Undo brings it back |
| remove | delete, clear | One die, face, picture or saved roll |
| default dice | startup dice, usual dice | What opens each time |
| faces | sides (in the app) | Landing may say "six-sided" |
| copy | clone, duplicate | Copy a die. Share uses "Copy link" |
| tap | click, click/tap | "Press Space or R" stays for keyboards |
| Usage stats | telemetry | Counts kept on the device |
| anonymous page metrics | telemetry, usage stats | The analytics setting |
| like 7, 11 | e.g. | Hints and placeholders |

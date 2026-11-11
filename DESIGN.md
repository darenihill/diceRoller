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
| Typography | Roboto 400/500/700, served from this site (`public/fonts/`, `@font-face` in `src/index.css`) | no named type-style classes yet (Known drift) |
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
| Text field | `Modals.module.css` `.formInput` look: 1px `outline` edge, no fill, 2px `primary` edge while typing (Die settings, Save, Customize, Share and the typed roll box all match; `src/test/materialFit.test.ts`) | outlined text field |
| Card / tile | `.md-card` | card |
| Card with icon over label | `.md-card` + `Modals.module.css` `.iconCard` | card |
| Dialog | `components/Modal.tsx` (title, close, Esc, focus trap) | dialog |
| Feedback | the app toast (`showToast`) | snackbar |

## 6. States

Icon-only controls carry `aria-label` (or `title` at minimum). Toggles say
their state with `aria-pressed`. Dialogs trap focus and close on Esc.

## 7. Words

One name for each thing, written the same way everywhere (owner, 2026-11-07:
Build "Use one name for each thing in the app, from a short word list", way
"Call saved dice games", name "Popular games"). New labels and messages use
these words; `src/test/oneName.test.tsx` checks the main ones.

| Use | Not |
|---|---|
| game (saved dice); Games dialog with "Your games" and "Popular games" | save (as a noun), preset, set, configuration, ready-made game |
| die (one), dice (more) | "dice" for one die |
| hold / release | lock, unheld |
| RPG mode | RPG Mode, D&D mode |
| Customize (the app) | Settings, Customize App |
| die settings (one die) | Dice Settings, gear menu |
| History (past rolls) | Roll History & Frequency, roll log |
| Frequency (how often each total came up) | Luck Meter, chart |
| clear (empty a list) | delete all, wipe |
| delete (a saved game) | remove |
| remove (one die, face or picture) | delete, clear |
| erase (everything on this phone: Erase everything, Erase all; owner, 2026-11-10) | wipe, reset, delete all |
| default dice | startup dice, usual dice |
| faces | sides |
| Copy link (share) | Copy |
| tap | click, click/tap, simply |
| anonymous page metrics | telemetry |
| target hit | HIT!, Target Highlight |
| like 7, 11 | e.g. |
| sentence case: "Usage stats", "Set default" | Title Case |
| except the two die settings tabs: "Die Settings", "Custom Faces" (owner, 2026-11-10) | |

Messages are short and plain, with no "!": "Backup exported", "Link copied".
The menu's group heading "Saves" stays: it names the group of saving
actions (owner's pick, 2026-11-07), not saved dice.

### Menu budget (hub plan Move 2, 2026-11-09)

About seven entries a menu, three words a label, one name per thing, and no
sentence under a switch unless the switch can lose data. Lists of content
(popular games, your games, faces, history rows) don't count. Daren sets the
numbers after the first take-things-out page. A change that breaks the budget
is a bug (standard 11).

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

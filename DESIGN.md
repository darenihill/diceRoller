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

## 11. Verification

`npm run precommit` (lint, tests, type check and build, CSS guard).

Changed: yes

# Polish: standard components (2026-10-19)

Lens: which screens hand-build something a standard component already does,
or bend DESIGN.md's colors, type or spacing? This is the second pass; the
first (2026-10-07) added the shared button, toggle and card styles.

Screens checked at phone width (390 x 844) in Chromium, in the Clean Light
theme, which the first pass did not cover: Dice Settings and the main screen.
Compared against Material 3's text field and icon button specs, Google Keep's
light settings sheets and the Android Settings app: text in a field or on an
icon button always uses the surface's own on-color, so it reads on every
theme.

## Found

| Screen | Off-spec | Standard |
|---|---|---|
| Dice Settings | name field, faces stepper (- / number / +), custom text field and icon buttons paint their text pure white (`#fff`); on Clean Light that is white on light grey, so the face count and anything typed are hard to read | M3 on-surface text color (`--md-sys-color-on-surface`) |
| Dice Settings | "No custom faces added" in fixed grey `#888`, about 2.9:1 on the light surface | on-surface at reduced emphasis |
| Main screen | "Dropped" badge (Advantage) puts white text on the light pink error color, about 1.8:1 | M3 on-error (`--md-sys-color-on-error`) |

## Done

- The six rules above now use theme tokens, so the text matches each theme.
  Dark, Felt and Midnight look the same as before (on-surface is near white
  there); Clean Light becomes readable.
- Nothing added, removed or moved.

Before / after: `before-light-settings.png` and `after-light-settings.png`
(the "6" in the stepper goes from white to near black). Computed colours:
stepper text `rgb(255,255,255)` before, `rgb(26,26,26)` after.

Checks: `npm run precommit` (lint, tests, type check and build, CSS guard).

Changed: yes

# Material 3 fit (2026-11-10)

Polish lens ui-material. Where does the app drift from Material 3
(components, elevation, color roles, shapes) without a good reason?

Screens checked at phone size (390 × 844), in Default Dark and Clean Light,
with demo dice and nothing private: the main screen, a rolled screen, a tapped
die, the menu, Die settings (both tabs, with three custom faces), Games,
History, Save, Customize, Help, Usage stats and the Undo bar. Field contrast
was also measured on Casino Felt and Midnight. Screenshots are in the project
files under dice-roller/2026-11-10/material12/ (`before-*` and `after-*`, plus
side-by-side `cmp-light-diesettings.png`, `cmp-light-faces-added.png` and
`cmp-dark-faces-added.png`).

## Compared with

One flow: filling in a short form (a name, a number, a few words).

| App | What it does |
|---|---|
| Google Calendar (event editor) | Every box has a visible edge or underline. The box being typed in gets a thicker colored edge. |
| Google Keep (label and list editing) | Same box style on every screen. Hint text stays readable on every theme. |
| Material 3 text field guidance | Outlined field: a 1px edge in the outline color, 2px in primary while typing. No dark fill. |

Dice Roller already did this in Save, Customize, Share and the typed roll
box. Die settings was the one place that didn't.

## Found

| Screen | What was off | Material 3 |
|---|---|---|
| Die settings: name, number of faces, custom face text, "counts as" box | Their own dark filled boxes with no edge, painted with a fixed 20% black instead of a color role. On the dark themes a box barely stood out from the panel (1.1:1). On Clean Light the box turned mid-grey, like a disabled control, and its hint text ("Like Player 1", "Add custom text") fell to 4.4:1, under the 4.5:1 DESIGN.md promises. The "counts as" edge was white at 15%, which is invisible on Clean Light (1.1:1) and faint on dark (1.6:1). | Outlined text field, the same one the rest of the app uses (standard 3, Built once). |
| All text boxes, while typing | The edge turned primary but stayed 1px. Die settings fell back to the browser's own black or white ring. | Focused outlined field: 2px primary. |

## Done

- **Die settings boxes now match every other text box in the app.** They
  have no fill, a 1px edge in the theme's outline color, and a 2px edge in
  the theme's main color while you type. What a person sees: the name box,
  the faces number, the custom text box and each "counts as" box now have a
  clear outline on every theme. On Clean Light they are no longer dark grey
  blocks.
  - Hint text on Clean Light: 4.37 → 5.61:1. Dark: 6.66 → 6.09:1 (still above 4.5).
  - Box against the panel (fill before, edge after): dark 1.13 → 4.33:1,
    Clean Light 1.58 → 3.43:1, Felt 1.11 → 5.75:1, Midnight 1.08 → 5.1:1.
  - "Counts as" edge: dark 1.62 → 4.74:1. Felt 1.60 → 6.22:1. Midnight
    1.59 → 5.41:1. Clean Light 1.11 → 2.45:1 (see Left as is).
- **Every text box shows a 2px edge while you type** (Save, Customize's
  target number, Share's link, the typed roll box, Die settings). A box with
  a problem keeps its red edge at 2px.
- DESIGN.md §5 now lists the text field.
- `src/test/materialFit.test.ts` checks that the Die settings boxes use the
  outlined field and the 2px focus edge, and that the outline color reaches
  3:1 on the Die settings panel in all four themes (standard 19). Before the
  fix, 8 of its 12 checks failed.

Nothing was added, removed or moved. No flow or saved data changed.

## Standards applied

- Standard 3, Built once: one text field look instead of two.
- Standard 9, Accessibility: hint text at 4.5:1 or more, and box edges at 3:1
  or more, except the one case below.
- Standard 19, Can't come back: the test above.

## Left as is

- **The Undo bar uses the main color, not Material 3's dark snackbar.**
  Daren built it this way (bar moved to the bottom, 2026-10-25; filled Undo
  button with a countdown). It is meant to stand out.
- **Dialogs have a title bar with × and a divider.** Material 3's basic
  dialog has neither. These dialogs are long and scroll, closer to Material
  3's full-screen dialog, which does have them.
- **The "counts as" box on Clean Light is at 2.45:1 against its face card.**
  The face card's own grey fill causes it. The number inside the box still
  shows where the box is. Fixing it means repainting the face cards, so it
  is an idea below.
  (Built as a fix later the same day: reviews/2026-11-10-card-fixes.md.)
- **The theme picker cards** paint each theme's own colors. This is already
  in DESIGN.md §9.

## Ideas for the Focus tab

1. **Buttons sit flat, as Material 3's filled and tonal buttons do**
   - Why: every filled and grey button carries a shadow. Material 3 keeps
     shadows for floating things. Popular games and Done/Copy in dialogs read
     as raised, older Material 2 buttons.
   - Before: `.md-button-filled` and `.md-button-surface` have shadow level 1,
     and level 2 on hover.
   - After: no shadow at rest. The bottom bar's buttons keep theirs, since
     they float over the dice.
   - Spread: across the app. Effort S.
2. **Dialog corners at Material 3's 28px**
   - Why: Material 3 dialogs use extra-large corners (28px). Ours use 16px,
     the same as cards, so a dialog reads like a card.
   - Before: 16px corners on every dialog.
   - After: 28px corners on dialogs. Cards and tiles stay at 16px or less.
   - Spread: across the app (one shared dialog). Effort S.
3. **Face cards and Die settings round buttons use theme colors on Clean
   Light**
   - Why: face cards, the − / + buttons and the icon picker darken the panel
     with a fixed black (15–20%). On Clean Light that makes mid-grey blocks
     that look disabled, and it puts the "counts as" edge at 2.45:1.
   - Before: fixed black overlays. They look right on dark themes and muddy
     on Clean Light.
   - After: Material 3 tonal colors (surface container for cards, tonal icon
     buttons), so each theme gets its own matching shade.
   - Spread: one screen (Die settings). Effort S.

## Checks

`npx vitest run`, `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint src`,
`npm run precommit`, and
`python3 tools/done_mark.py check --repo <clone> --base origin/master` from the hub.

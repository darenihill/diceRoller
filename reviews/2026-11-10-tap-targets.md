Changed: yes

# Dialog buttons at 48px (2026-11-10)

Daren's note on the Desk idea "Save, Cancel and other dialog buttons grow to
48 px tall": "This shouldn't be a card if it's matching a standard". The hub's
standard 9 (Accessibility) and standard 20 item 14 ("tap targets are 48dp")
cover it, so it was built as a fix.

Measured on a built copy at phone size (390 × 844), every button and box
inside Save (new name and a taken name), Games, History (both tabs), Customize,
Die settings (both tabs, with faces added and Icons open), Share, Help, Usage
stats and Install. Then checked again at 200% text, on a 320px-wide screen,
and both together. Backup import has no confirm dialog (it imports and
reloads), and Clear all has no dialog (Undo brings the dice back), so there
was nothing more to measure there. Screenshots are in the project files under
dice-roller/2026-11-10/tap48/ (`before-390-*`, `after-390-*`,
`after-320-*`, `after-390-200pct-*`, `after-320-200pct-*`).

## Sizes (height, px; width where it was also short)

| Dialog | Control | Before | After |
|---|---|---|---|
| Save | Cancel, Save | 36 | 48 |
| Save, taken name | Cancel, Keep both, Replace it | 36 | 48 |
| Save, Share | Name box, link box | 44, 42 | 48 |
| Share | Done, Copy link | 36 | 48 |
| Install | Done | 36 | 48 |
| History | Clear History, Clear this game | 32 | 48 |
| History, Frequency | Game chips | 36 | 48 |
| Customize | Reset size | 32 | 48 |
| Customize | Dice size slider, target box | 44 | 48 |
| Die settings | Remove, Copy, Done | 40 | 48 |
| Die settings | Name box, number of faces | 44 | 48 |
| Die settings | − and + | 44 × 44 | 48 × 48 |
| Custom Faces | "Same as the die" color button | 44 | 48 |
| Custom Faces | Color, Icons, Text | 44 | 48 |
| Custom Faces | New face text box, Add | 40 | 48 |
| Custom Faces | Add a picture face, Color every face differently | 32 | 48 |
| Custom Faces | Undo, "Add a new face instead" | 44 | 48 |
| Custom Faces | Face tile | 44 × 40 | 48 × 48 |
| Custom Faces | Grip | 24 × 44 | 24 × 48 |
| Custom Faces | Picture button (tap area) | 28 × 28 | 30 × 48, looks the same |
| Custom Faces | Remove face × (tap area) | 22 × 22 | 36 × 48, looks the same |

Already 48 or more: every dialog's ×, History and Die settings tabs,
Customize's switches and size buttons, theme cards, Games rows and game
cards, the bin, History rows.

## Done

- **One shared rule: every button inside a dialog is at least 48px tall.**
  The compact button (Clear History, Reset size, Add a picture face) no
  longer fixes its height at 32px, so it follows the same rule. Words,
  order and colors stay, and buttons in a row keep 8px between them.
- **Boxes, steppers and small buttons inside dialogs** went from 40–44px to
  48px (table above).
- **The face row's picture and × buttons** keep their look and take taps
  from a 48px-tall area around them; the row has no room for 48px buttons.
- Nothing wraps or runs off at 390px, at 320px, or at 200% text on either.
  At 200% text Clear History used to be cut in half (fixed 32px); it now
  grows onto two lines.
- `src/test/tapTargets.test.ts` reads the dialog stylesheets and checks
  each of these sizes (20 checks). Before the fix all 20 failed.

## Standards applied

- Accessibility (9, and 20 item 14: tap targets are 48dp) | Save, Share, Install | Before: Cancel, Save, Keep both, Replace it, Done and Copy link were 36px tall | After: 48px, through one shared rule for every dialog button
- Accessibility (9, and 20 item 14) | History, Customize, Custom Faces | Before: Clear History, Clear this game, Reset size and Add a picture face were 32px | After: 48px; at 200% text Clear History grows instead of being cut in half
- Accessibility (9, and 20 item 14) | Die settings | Before: Remove, Copy, Done and Add were 40px; − and + 44 × 44 | After: 48px; − and + 48 × 48
- Accessibility (9, and 20 item 14) | Save, Share, Customize, Die settings | Before: text boxes and the size slider were 40–44px | After: 48px
- Accessibility (9, and 20 item 14) | History Frequency, Custom Faces | Before: game chips 36px; Color / Icons / Text, Undo and "Same as the die" 44px; face tile 40px | After: 48px
- Accessibility (9, and 20 item 14) | Custom Faces face row | Before: picture button 28 × 28, remove × 22 × 22 | After: same look, tap areas 30 × 48 and 36 × 48
- Can't come back (19) | All dialogs | Before: no check on tap size | After: `src/test/tapTargets.test.ts` fails if a dialog control drops under 48px

## Left as is

- **Die color dots (35 × 35 at 390px).** Twelve colors in two rows of six
  fill the panel's width with 4px between them, so a 48px tap area would
  overlap the next color. They are above the 24px minimum (WCAG 2.5.8).
  Reaching 48 means fewer per row (three rows) or a wider panel: a design
  call, not a fix.
- **Custom Faces icon grid (33 × 33).** Same reason: six to a row with 6px
  between.
- **"Counts as" number box (52 × 28) and the picture and × widths (30, 36).**
  They sit beside the face tile in about 110px. Their tap areas are 48 tall;
  wider needs the row laid out differently.
- **Grip (24 wide).** A drag handle at the card's edge; arrow keys move a
  face too.
- Seen while checking, not changed (they were the same before): on a 320px
  screen at 200% text, Customize's theme cards and Die settings' Remove,
  Copy, Done run past the dialog's edge.

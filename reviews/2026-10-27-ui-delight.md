Changed: yes

# Small touches (polish-ui-delight-5), 2026-10-27

Question: what one small detail would make the app feel finished?

Checked at 390 px on master: the dice screen, the bottom bar, the menu and
the dialogs, by touch and by keyboard. Compared one flow at a time:
- Keyboard focus against Material 3's focus indicator guidance (a visible
  ring on the focused control).
- The browser bar against web apps that set `theme-color` to their current
  theme.
- Button press feedback against Material 3's pressed state.

## Found

| Detail | Today | Verdict |
|---|---|---|
| Keyboard focus on buttons | All buttons set `outline: none` with no replacement. Tabbing through Roll, Add, Hold all and the die buttons shows nothing (checked: outline `none` on 6 of 8 stops; only dice had a ring). | **Broken (WCAG 2.4.7). Fixed.** |
| Browser bar colour | `theme-color` is fixed at #121212, so Light, Felt and Midnight keep a dark grey bar. | Design tweak: for later (see below) |
| Pressed feedback | Only the menu tiles darken when pressed; Roll, Add and Hold all give no pressed state. | Design tweak: for later |

## Fixes built

- Every button shows a 2 px primary-colour ring when reached by keyboard
  (`button:focus-visible`), matching the ring the dice already had. Taps still
  show no ring. A test guards it.

## Design tweaks built

None. Dice Roller reaches anyone, so even small design tweaks go to Daren as
cards.

## Suggested next goals

None filed this pass: the Focus tab is full (10 ideas, all added in the last
7 days), and nothing old enough can give way. Kept for a later pass:
- The browser bar takes the chosen theme's colour.
- Roll, Add and Hold all darken briefly when pressed, like the menu tiles.

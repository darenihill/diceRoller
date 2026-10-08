# Goal

Customizable dice for board games and tabletop RPGs, live at
customdiceroller.com. Public app: every merge to master publishes the site.

## Next items

- The phone's back gesture closes the open dialog or menu first, instead of
  leaving the app (trunk test, reviews/2026-10-07-trunk-test.md, finding 4).
- Dice size, step 1: add a stored dice-size preference (default 1.0, range
  0.6 to 1.6) applied as a multiplier on top of `calculateGridDimensions()`,
  clamped so dice never overflow the screen. Done when a unit test shows the
  multiplier scales the size and the clamp holds at 1 and 30 dice.
- Dice size, step 2: a "Dice size" slider (Smaller / Bigger) in Customize,
  using the app's existing toggle-row layout. Done when moving it resizes the
  dice live in the browser at 390 px and 1280 px, with screenshots.
- Dice size, step 3: include the size in backup export and import. Done when
  a round-trip test keeps the value and an old backup without it imports at
  the default.

# Phone bottom sheets, 2026-11-11

Daren's Build on "Phone dialogs slide up from the bottom and swipe down to
close" (way "sheet"), plus the menu as the same sheet (the Desk card's answer
to his "Does it slide up from the bottom as well?"). Checked in the built app
with Playwright at 390×844 (phone) and 1280×800 (computer). Screenshots are in
the project files under `dice-roller/2026-11-11/bottom-sheets/`.

| What | How it was checked | Holds |
|---|---|---|
| Every dialog is a full-width sheet from the bottom edge, top corners 28px, grab bar on top | History, Help, Save and Customize opened from the menu: each at x 0, width 390, bottom at 844, top-left radius 28px, bottom 0 (`phone-history.png`, `phone-help.png`, `phone-save.png`, `phone-customize.png`) | Yes |
| A drag down on the grab bar closes it | 120px drag on History's grab bar: the sheet follows the finger (`phone-history-dragging.png`), then no dialog is left | Yes |
| Tapping above it closes it | Tap at the top of the screen with Help open: no dialog left | Yes |
| Long dialogs still scroll | Only the grab bar and title bar take the drag; a drag in the content does nothing (test) | Yes |
| Tall dialogs leave a strip at the top | Help and Customize stop 72px from the top, where a tap closes them and the Undo bar now goes | Yes |
| The phone menu is the same sheet | Menu at x 0, width 390, bottom edge, grab bar (`phone-menu.png`); a drag on the grab bar closes it | Yes |
| History from the menu takes its place | 60ms after the tap the menu is gone and History is coming up in its spot (`phone-menu-to-history-60ms.png`) | Yes |
| Computer layout unchanged | History is the box in the middle, no grab bar; the menu stays above its button (`computer-history.png`) | Yes |
| Reduce motion | Framer's `reducedMotion="user"` drops the slide; a swipe closes at once; CSS drops the follow-the-finger transition (tests) | Yes |
| Phone keyboard | The sheet moves up by the part of the screen the keyboard covers (visual viewport), and the focused text box is scrolled into sight (test with a mocked keyboard; not seen on a real phone) | In tests |

## Notes

- The swipe code is now one hook (`useSheetDrag`), used by the die buttons'
  sheet, every dialog and the menu: 60px or a quick flick closes, shorter
  springs back, a flick back up keeps it, and the click that ends a swipe
  doesn't press a button.
- The open menu covers its own button, so that button no longer closes it
  on a phone; the drag, a tap above, Back and Escape do.
- The menu is its own commit, so it can be dropped alone.
- On a phone the Undo bar now sits at the top of the screen while a dialog is
  open (it used to sit at the bottom edge, which is now the sheet's Done).

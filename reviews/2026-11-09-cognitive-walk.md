Changed: no

# Cognitive walkthrough: roll, custom die, games (2026-11-09)

Four questions at each step: will they know what to do (**Know**), see the
control (**See**), connect it to the goal (**Link**), and see that it worked
(**Done**)? Walked at 390×844 on the release branch after the trim pass.
✓ = yes, ✗ = no, ~ = mostly. Screenshots in `dice-roller/2026-11-09/review45/`.

## 1. Roll dice

| Step | Know | See | Link | Done | Note |
|---|---|---|---|---|---|
| Open the site | ✓ | ✓ | ✓ | – | Two d6 and a big blue Roll in the thumb zone (`c1-first-screen.png`) |
| Tap Roll | ✓ | ✓ | ✓ | ✓ | The dice tumble and the total lands on the button |
| Hold one and roll the rest | ~ | ✗ | ✓ | ✓ | Hold only shows after tapping a die. The open "first-visit hint line" idea covers it (`c2-die-tapped.png`) |
| RPG mode: type 2d6+3 | ✓ | ✓ | ✓ | – | The box says "Type a roll: 2d6+3, d20 adv" |
| Then roll it | ~ | ✓ | **✗** | ~ | The thumb goes to the big Roll, which rolls the dice on screen, not 2d6+3. The typed roll's Roll is the small grey one at the top. Nothing says the typed text was skipped (`c5-typed-then-big-roll.png`). Idea |

## 2. Set up a custom die

| Step | Know | See | Link | Done | Note |
|---|---|---|---|---|---|
| Tap a die, then Settings | ~ | ✗ | ✓ | ✓ | Same hidden-buttons step as Hold |
| Name it | ✓ | ✓ | ✓ | ✓ | The name shows on the die |
| Custom faces tab › add words | ✓ | ✓ | ✓ | ✓ | "Add custom text" and + (`w-faces.png`) |
| Add a picture | ✓ | ~ | ✓ | ✓ | A 28 px picture icon on each face row |
| Take the picture off | ✓ | ~ | ✓ | **✗ → ✓** | Before: the photo vanished with no message or Undo. Fixed: "Removed picture · Undo" (`s2-picture-removed-after-fix.png`) |
| Done | ✓ | ✓ | ✓ | ✓ | The filled button, bottom right |

## 3. Save or load a game

| Step | Know | See | Link | Done | Note |
|---|---|---|---|---|---|
| Menu › Save | ✓ | ✓ | ✓ | ✓ | The name is filled in; "Saved" shows (`c4-save.png`) |
| Menu › Games › tap a game | ✓ | ✓ | ✓ | ✓ | "Loaded Catan · Undo", and the name shows in the header |
| Delete one game | ✓ | ✓ | ✓ | **~ → ✓** | Before: a double tap deleted two games and Undo said only the second (`s1-games-double-tap-two-gone.png`). Fixed: "Deleted 2 games" brings both back |
| Find Backup | ~ | ✗ | ✓ | ✓ | Below 18 popular games. Already noted on 9 Nov (laws of UX), not repeated |

## What the walk adds

- The one step where the person can't link the control to the goal is
  "type a roll, then roll it". Everything else is either fine or already
  queued.
- Both "did it work?" misses were feedback after a remove (a picture, a second
  game). Both are fixed in this pull request (see the stories write-up).

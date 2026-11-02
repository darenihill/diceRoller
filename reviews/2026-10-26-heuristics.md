Changed: yes

# Nielsen's 10 usability heuristics (2026-10-26)

Scored per screen from the walk above and the code. Pass = no problem
found; the notes say what fails.

| Heuristic | Main screen | Menu | Dice settings | Games & saves | Customize |
|---|---|---|---|---|---|
| 1 Status visible | Pass (total on Roll, spoken; held dice gold) | Pass | Pass | Pass | Pass |
| 2 Real-world words | ADV / NORM / DIS are table words for RPG players: pass | "Set Default" doesn't say it means "open with these dice" | Pass | Pass | Pass |
| 3 Undo, way out | Pass (Undo on remove and Clear All) | **Fails:** Set Default replaces the old default with no Undo | Pass | Pass (Undo on delete) | Pass (themes switch back) |
| 4 Consistency | Pass | **Fails:** Help, Games, History, Usage Stats and Customize leave the menu open behind them; Save, Share, Set Default and Clear All close it. Escape didn't close the menu (fixed). | Pass | Pass | Pass |
| 5 Error prevention | Pass | Pass | Pass | Pass (taken names warned) | Pass (target check) |
| 6 Recognition over recall | The five icons around a die have no words on a phone (tooltips need a mouse) | Pass | Icon faces had no names for screen readers (fixed) | Pass | Pass |
| 7 Shortcuts | **Fails on a computer:** no key rolls; you Tab to Roll every time | — | — | — | — |
| 8 Minimal design | Pass | Pass | Long, but sections are clear | Pass | Pass |
| 9 Clear error messages | Pass (typed-roll notes) | — | Pass (picture too big) | Pass | Pass |
| 10 Help | Help covers rolling, holding, faces | — | — | — | — |

## What fails, and what happens to it

- 3, Set Default with no Undo: Focus card ("Undo after Set Default"), since
  Dice Roller reaches anyone.
- 4, menu left open behind some dialogs: Focus card ("The menu closes when
  you open Help, Games...").
- 7, no key to roll on a computer: Focus card ("Press Space or R to roll").
- 6, icon-only buttons around a die: overlaps the Discuss card already on
  the Desk about the buttons around a die; no new card.
- 4, Escape: fixed in this pass (menu).

Covers: inconsistent, laws-of-ux, ui-navigation

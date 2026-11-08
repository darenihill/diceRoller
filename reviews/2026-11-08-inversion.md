Changed: yes

# Inversion: how would we make Dice Roller as frustrating as possible? (2026-11-08)

First inversion pass for this app. The list is what a bad dice roller does;
the right column is how much Dice Roller already does it, from today's walk
(reviews/2026-11-08-stories.md) and the code.

| # | To make it maddening… | Does Dice Roller do it? | Where it went |
|---|---|---|---|
| 1 | Throw away my dice whenever something else opens (a link, a game, History) | A little. Each of these replaces the dice with a 7-second Undo, then they are gone | Recently deleted is queued in GOAL.md; Clear all added to it today |
| 2 | Make a link do nothing sometimes | Yes, until today: a link pasted into the open tab did nothing until a refresh | **Fixed** |
| 3 | Call one thing by different names | A little: Help said "lock" and "gear" for Hold and Settings; the empty screen said "RPG Mode" | **Fixed** |
| 4 | Hide what you can do until you guess the gesture | A little: Hold, Settings, Copy and Remove only appear after tapping a die, and the first screen doesn't say so | Idea on the Focus tab |
| 5 | Send my taps somewhere without telling me | A little: page metrics go to Google Analytics, on by default; it is said only inside Customize | Idea on the Focus tab |
| 6 | Show a blank page on a slow link | Mostly fixed in October (opens in 3 s on weak signal); a "Loading dice…" line before the first script is still queued | Queued in GOAL.md |
| 7 | Let a message hide behind another one | A little: "Saved" and "Link copied" can sit under an Undo bar | Queued in GOAL.md ("Messages show over Undo") |
| 8 | Replace my saved games silently from a file | Yes: Import replaces same-named games and history with no Undo | Queued in GOAL.md ("Older backup asks first") |
| 9 | Make me type a game name every time | No: Save fills one in (8 November) | — |
| 10 | Tiny buttons, color-only states | No: switches say On/Off, held dice say HELD, tap targets are thumb-sized. Face-row buttons at large text are queued | Queued |
| 11 | Put ads or a sign-up wall in front of the dice | No | — |
| 12 | Let site code be swapped by anyone in between | No known hole, but the page has no Content-Security-Policy as a safety net | Idea on the Focus tab |

## What stands out

- Four of the twelve are already queued fixes from 6 and 7 November that
  haven't been built while new features landed. The queue itself is the
  frustration: each is small, and each is a standard.
- Every way dice arrive (link, game, History, typed roll, default) replaces
  what was out. The 7-second Undo is the only net.

## Fixes built

- Links opened in the open tab load (row 2).

## Standards applied

- Plain names | Help and the empty screen | Before: "lock", "gear", "RPG Mode" | After: "Hold", "Settings", "RPG mode" (`src/test/review20261108.test.tsx`)

Changed: yes

# Fixes from the 2026-11-21 code review (2026-11-23)

Gemini reviewed the code at 69b4262 three times (one full pass, two deep
passes on saved games and backups), and Opus checked each high and medium
finding against the code. Reports: Daren's project files,
`models/neon-review-2026-11-21/` (`diceroller.md`,
`2026-11-22-diceroller.md`, `2026-11-22-diceroller-deep.md`).

The three reports confirm 1 high, 3 medium and 4 low findings between them.
Two of those are the same finding graded twice: two open tabs (medium in
one deep pass, high in the other) and the half-applied backup (low, then
medium). That leaves six separate findings. All six are real, and all six
are fixed here. Each test failed before its fix.

Tests: `src/test/neonFixes20261123.test.tsx` (16 tests; the 16th, from the second read, covers Undo during a second roll after a called-off one).

| # | Finding | Grade | Verdict | Fix | Test |
|---|---|---|---|---|---|
| 1 | A second open tab wipes games saved in the other tab | High | Real | Every save, delete and Undo starts from what storage holds now, not the tab's copy from when it opened. A tab also refreshes its Games list when another tab changes it | "Two open tabs keep each other's saved games": the autosave keeps the other tab's game, a delete stays deleted, the other tab's list updates, and a game kept on screen while storage was full isn't dropped |
| 2 | The four landing pages ship the home page's description | Medium | Real | The script now looks for the home page's actual text ("colors … share your dice"). Each swap now has to find the exact number of copies, or the build stops. The four pages were regenerated | "Landing pages carry their own description": for each page, description, og and twitter all carry its own text, and the committed file matches |
| 3 | A backup that runs out of room is half applied, and autosave can then write old games over it | Medium | Real | The import plans every write first. At the first refused write it stops and puts back what it had already written, so storage is as it was. With nothing half done, the page's next autosave matches storage | "A backup that runs out of room changes nothing": games, theme and sound are unchanged after a refused write |
| 4 | Removing or clearing dice mid-roll still logs the old roll (and its target toast) | Low | Real | Remove, Clear All and Undo of Clear All during the 0.8 s tumble call the roll off. No History entry, and the dice left keep their values | "Removing or clearing dice mid-roll": two tests, no History entry and not rolling |
| 5 | Any JSON file with a "version" field imports as a backup | Low | Real | A file is a backup only if it has its games or a backup version such as "1.0" or "1.1". A package.json's "1.0.0" is refused | "Only a Dice Roller backup imports": package.json-like file refused, dice size unchanged; old and new backups still import |
| 6 | A game named `__proto__` vanishes after reload | Low | Real | Saved games and backup games are built with `Object.fromEntries`, so the name is kept as a game | "A game named __proto__": survives a reload and a backup import |

## What changes for people

- Saved games are no longer lost when the app is open in two tabs.
- Shared links to the four landing pages (D&D, d20, Catan, classroom) show
  their own description in search results and share previews.
- A backup that doesn't fit leaves everything as it was. The storage-full
  message shows, as before.
- Removing a die during the 0.8 s tumble stops the roll. Before, the roll
  landed and logged the removed die.

None of these changes how the app looks.

## Not built

- **Review note F4, unsure: saves written inside React's state updater.**
  Fix 1 moved the save out of the updater, so the doubt is gone.
- **Review note F8, unsure: Undo's pause reads state, not a ref.** The
  reviewer thinks it probably can't happen on React 19, and no test could
  reproduce it. A finding needs a failing test before it is built, so it is
  left as it is.

## Standards applied

- No lost work | Saved games, two tabs | Before: a second tab's autosave deleted a game saved in the other tab | After: every save starts from what storage holds, so both tabs' games are kept (`src/test/neonFixes20261123.test.tsx`)
- No lost work | Import backup | Before: a backup that ran out of room replaced some settings and left others | After: nothing changes and the storage-full message shows (`src/test/neonFixes20261123.test.tsx`)
- Say what happened | History | Before: removing a die mid-roll still logged a total with it in | After: the roll is called off and nothing is logged (`src/test/neonFixes20261123.test.tsx`)

## Suggested next goals

Dice Roller is in Maintain, so this is listed here and not sent to the Desk.

- **Undo's pause as a ref (F8).** Why: cheap hardening if a future React
  version stops flushing between events. Cues: code only, effort S, impact
  low, confidence 20.

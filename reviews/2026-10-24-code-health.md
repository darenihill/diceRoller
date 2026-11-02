Changed: yes

# Code health (2026-10-24)

## Where change is riskiest

| Spot | Why it is risky |
|---|---|
| `src/App.tsx`, 750 lines, changed in 7 of the last pull requests | Holds layout, startup loading, autosave, share links, backup import/export, shake, six remembered settings and every dialog's state. Any change touches a file every feature touches. |
| Backup import/export (inside App.tsx, ~90 lines) | Writes saved data and reloads the page; no test reads a backup end to end (only the picture part is tested). |
| Remembered settings | Six copies of the same "read from storage, write back on change" pair across App.tsx and useDiceState.ts; 21 bare storage writes. The modifier was simply never given one, which is why it resets (stories finding 1). |
| `useStorage.saveConfig` | Writes storage inside a state update with no guard; a full storage (pictures on faces) throws during render and nothing catches it, so the screen goes blank. |
| `public/sw.js` | The offline code has no test; its weak-signal gap (no time limit) went unnoticed. |
| Open-dialog state | Five separate "is it open" flags (modalOpen, menuOpen, savePromptOpen, editingDiceId, shareFallbackUrl). Shake checked only one; fixed today with one combined `overlayOpen`, the same gap the phone's Back gesture item will need. |
| `DiceSettingsModal.tsx`, 489 lines | Big but self-contained, with tests around faces; lower risk. |

Duplicates: the two default dice are written out twice in App.tsx; the theme
list lives in App.tsx and again in CustomizeModal.tsx.

## The one refactor that pays off most

Move the remembered settings and the backup out of App.tsx: one shared
"remembered setting" hook (with the storage guard in one place) and a
`backup.ts` module with a round-trip test. It changes nothing on screen,
makes "keep the modifier" a one-line change, closes the blank-screen risk on
full storage, and puts the only code that overwrites saved data under test.
Added to GOAL.md Next items.

## Fixes built

- One `overlayOpen` flag for shake (see stories). Tests: 115 → 148 passing
  (5 new behaviour tests and a 28-case theme contrast guard).

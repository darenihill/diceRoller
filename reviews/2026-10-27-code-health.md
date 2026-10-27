Changed: yes

# Code health (2026-10-27)

Where the code is hardest to change safely:

1. **`src/App.tsx`, 775 lines and 18 `useState`s.** One file holds share
   links, landing pages, startup loading (lines 160-232), autosave (237-252),
   backup export and import (379-470), shake to roll, theme and settings.
   Backup export and import has no test of its own.
2. **Storage scattered across about 35 direct `localStorage` calls in 4 files**
   (App.tsx, useDiceState.ts, useStorage.ts, analytics.ts), with uneven error
   handling:
   - App.tsx reads and writes `diceConfigs` behind `useStorage`'s back
     (330-334, 432-434), so the hook's in-memory copy can go stale.
   - Startup reads (88-106) and some writes (useStorage.ts 25 and 34,
     App.tsx 318) aren't wrapped. Pictures on faces live in localStorage too,
     so filling the phone's storage is a real risk, and it fails silently.
3. **Rolling in two places:** the real roll (useDiceState.ts 182-185) and the
   flicker while dice tumble (Dice.tsx 77-80). An unused `getRandomNumber`
   copy is removed in this pass.
4. **Files with no direct test:** DiceSettingsModal.tsx (489 lines), Dice.tsx
   (306), ActionBar.tsx (239), analytics.ts (210), History and Stats dialogs,
   and the service worker.
5. **Dependencies:** `npm audit --omit=dev` finds 0 issues; 5 runtime packages.

## The one refactor that pays off most (size M)

One safe storage module (`src/utils/storage.ts`): typed keys, plus get, set
and remove calls that never throw. `useStorage` becomes the only owner of
saved games. Backup export, import and startup loading move out of App.tsx
into their own files with tests. That cuts about 150 lines from App.tsx, ends
the stale copy, and puts the backup path under test. It changes nothing Daren
sees. It is kept for its own item rather than slipped into this review.

## Fixes built

- Removed the unused random helper.
- Backup download link released safely (see stories).

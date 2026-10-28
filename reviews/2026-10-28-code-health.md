Changed: yes

Done in this pull request: the safe fixes A1 to A5 are GOAL.md Next items 5 and 6, to build once pull requests 39 and 41 land (they edit the same lines). The backup-from-one-list refactor is on the Decision Desk.

# Code health — Dice Roller (review 28, lens 3)

Checked on master as of the Idea choices merge (pull request 28), in a scratch worktree.
Tests 120/120 pass, lint and type check clean. Coverage tool (@vitest/coverage-v8) is not
installed, so coverage below is mapped by reading `src/test/`.

## Short answer

The hardest place to change safely is **App.tsx (775 lines)**. It holds 17 pieces of state,
14 effects, 17 handlers and 26 direct `localStorage` calls, and it is where backup export and
import live with almost no tests. 18 of the recent source changes touched it, and **12 of the 20
open pull requests edit it** (24, 26, 31, 32, 34, 37, 38, 39, 41, 42, 43, 45), so they will keep
colliding there.

**The one refactor that pays off most:** one list of everything the app saves on the device, with
backup export and import built from that list and moved out of App.tsx into a small tested file.
Today the backup quietly leaves out RPG mode, Target Highlight, shake to roll, the analytics
choice and Usage Stats, although its button says "Export games & settings".

## Findings

### 1. Biggest files (src, non-test)

| File | Lines | Tests that reach it |
|---|---|---|
| src/App.tsx | 775 | 2 render tests (empty screen, typed roll) |
| src/components/DiceSettingsModal.tsx | 489 | **none** |
| src/hooks/useDiceState.ts | 364 | good: useDiceState.test (339 lines), undo, totalMath, typeRoll |
| src/utils/diceUtils.ts | 327 | good: diceUtils, faceValue, diceScale, useDiceLayout |
| src/components/Dice.tsx | 306 | **none** |
| src/components/ActionBar.tsx | 239 | **none** |
| src/utils/analytics.ts | 210 | **none** |

### 2. Untested paths that matter

- **Backup import**, src/App.tsx:408-471 (63 lines). It parses an outside file, cleans it,
  merges into saved games and overwrites 6 saved values, then reloads. No test touches it.
  Pull request 41 (storage full) edits this same block.
- **Backup export**, src/App.tsx:379-406. Untested; reads 6 keys by hand.
- **First load order**, src/App.tsx:160-233: share link → landing page → default set → autosave
  → two plain dice. Only the last two branches run in tests (emptyScreen.test.tsx).
- **DiceSettingsModal.tsx** (489 lines): face editing, pictures, colour picker, face count. No
  test renders it. Pull request 46 (paste a face list) adds the first test for it.
- **Dice.tsx** (306 lines): the spinning-face timer at :58-89 and the face-render rules. No test.
- **analytics.ts** (210 lines): Usage Stats and the opt-out. No test.

### 3. Saving to the device is spread over 5 files

26 direct storage calls in App.tsx, 7 in useDiceState.ts, 4 each in useStorage.ts,
analytics.ts and faceImages.ts. 11 keys, all plain strings, no shared list.

- `diceConfigs` (saved games) has **four writers or readers**: useStorage.ts:11-34,
  App.tsx:330-334 (Clear All), App.tsx:383 and :432-434 (backup), faceImages.ts:77.
- `telemetryEnabled` is read in App.tsx:106 and owned by analytics.ts:23 under its own name.
- **Small bug from this:** Clear All (App.tsx:329-338) deletes the autosave straight from storage
  but not from the saved-games list held in memory, so the next save or delete of any game
  (useStorage.ts:22-37) writes the old autosave back. If the phone then skips the page-hide save,
  the cleared dice come back on reload. Fix: call `deleteConfig('systemAutosave')` instead.
- **The backup misses settings.** Export (App.tsx:381-391) and import (:428-449) list keys by
  hand: games, default set, history, theme, sound, dice size, pictures. Left out: `rpgMode`,
  `targetHighlight`, `shakeToRoll`, `telemetryEnabled`, `diceAnalyticsStats` (Usage Stats).
  Each new setting has to be remembered in three places, and five weren't.
- Reads are unguarded: `localStorage.getItem` inside `useState` at App.tsx:88-106 and
  useDiceState.ts:64-66 throws when a browser blocks storage, and that blanks the screen.
  Pull request 41 guards **writes** only (new `saveItem`); reads stay as they are.

Credit: pull request 41 (safeStorage) already routes every write through one safe step. The
refactor below builds on it rather than redoing it.

### 4. Duplicated logic

| What | Where | Status |
|---|---|---|
| Random rolls (`Math.random`) | useDiceState.ts:182,185; Dice.tsx:77,80; diceUtils.ts:24 | Pull request 40 (fairRandom) fixes it |
| Safe saving | 5 files | Pull request 41 (safeStorage) fixes writes |
| Opening a window from the menu | App.tsx:644-648 | Pull request 43 (openFromMenu) fixes it |
| Splitting a pasted list into faces | DiceSettingsModal | Pull request 46 (faceList) adds one helper |
| Keep-highest and keep-lowest blocks, same 10 lines twice | useDiceState.ts:220-242 | safe fix A2 below |
| Target Highlight parsing: roll and the note under the box | useDiceState.ts:285 vs targets.ts:2-8 (its comment says "same reading as the roll") | safe fix A3 below |
| A plain white d6 written out in full | App.tsx:210-231 (twice), App.tsx:477-486, useDiceState.ts:96-105, diceUtils.ts:149-158 | safe fix A1 covers the first two |
| Spin tick 200 ms | Dice.tsx:84 hard-codes it; constants.ts:14 has `ROLL_TICK_INTERVAL_MS` used by the sounds | left out of safe fixes: Dice.tsx is untested and pull request 40 edits the lines above |

Modals: every window already uses one shared Modal (components/Modal.tsx, 102 lines), and pull
request 36 adds Back-closes to it. No duplicate modal shells found. 6 near-identical
`isOpen={modalOpen === 'x'} onClose={() => setModalOpen(null)}` lines in App.tsx:673-740 are noise,
not a risk.

### 5. Dead code and leftover folders

- `getRandomNumber` (diceUtils.ts:23-25): never called. Pull request 40 rewrites it instead of
  removing it; better to delete it there.
- `DEFAULT_DEV_PORT` (constants.ts:17): never used (the port lives in vite.config.ts). Safe fix A4.
- `old_legacy/` (80 KB: the pre-React page, script and style). Nothing imports it; README.md:91
  says it's kept for reference. It loads a SweetAlert script from a CDN, so if it is ever served
  it is a stray public page. Keep or delete is the owner's call; git can bring it back either way.
- The four landing folders (catan-dice-roller etc.) are live build inputs (vite.config.ts), not
  leftovers.

### 6. Dependencies

- `npm audit --omit=dev`: **0 vulnerabilities.**
- Runtime: 5 packages (react, react-dom, framer-motion, lucide-react, lz-string). Within range
  updates waiting: react/react-dom 19.2.8 → 19.3.1, lucide-react 1.31 → 1.63.
- Major versions behind: framer-motion 12 → 14 (used in 4 components: ActionBar, Dice, Modal,
  SidebarMenu), vitest 3 → 5, jsdom 26 → 29, typescript 6 → 7, jest-dom 6 → 7. None urgent;
  framer-motion 14 is the only runtime one and touches the roll animation, so it wants its own
  pull request and a look on a phone.
- lz-string carries the share-link format: changing it would break every link already sent.
  Keep it pinned in spirit.

### 7. Pull requests piling up on the same lines

Every one of pull requests 36-46 rewrites line 1 of STATE.md and adds a block to the top of
GOAL.md, so each merge makes the next one conflict on those two files. That is a process issue
more than code, noted for the reviewer who owns flow.

## The one refactor that pays off most

**One saved-settings list, with backup built from it, out of App.tsx.**

- A small file names every key the app saves (11 today) with how to read it safely and whether
  it goes in a backup.
- Export and import become two plain functions over that list, with tests (round trip, bad file,
  old backup, storage full).
- App.tsx loses about 120 lines (backup, Clear All's storage poke, the four setting effects).

Why this one: it fixes a real gap (5 settings missing from backups), removes the Clear All bug's
cause, gives the untested 90-line backup path tests, and takes the busiest file out of most
future pull requests. Pull request 41's `saveItem` is the base it sits on. It changes what a
backup file holds, so under the app standards it is a card (change to saved data), not a silent
fix. It is in health-ideas.json.

Smaller but next in line: split DiceSettingsModal.tsx (489 lines, untested) into face list,
colour picker and pictures. Not worth a card on its own; pull request 46 adds its first test.

## (a) Safe fixes to build now

Small, covered by existing tests, no visible change. Tried in a scratch worktree: 120/120 tests,
lint and type check pass. Not applied to the repo. Full diff also at
`review28/code-health-safe.diff`.

- **A1** First-run dice: App.tsx:209-231, 23 lines → 1 via `sanitizeDiceList([{}, {}])`, which
  gives exactly the same two plain white d6s. Covered by emptyScreen.test.tsx.
- **A2** Advantage/disadvantage: one block instead of two copies (useDiceState.ts:218-244).
  Covered by useDiceState.test.ts:141 and :157.
- **A3** Target Highlight: the roll reads targets with `checkTargets` (targets.ts), so the note
  under the box and the roll can't drift. Same parsing (both `parseInt` after trim). Covered by
  useDiceState.test.ts:306-315 and targetNote.test.tsx.
- **A4** Delete unused `DEFAULT_DEV_PORT` (constants.ts:17).

Order: land after pull request 39 (it edits useDiceState.ts near line 290) and pull request 41
(it edits App.tsx near the first-load block); both diffs apply cleanly by hand.

```diff
diff --git a/src/App.tsx b/src/App.tsx
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -206,29 +206,8 @@ function App() {
       }
     }
 
-    // Default to 2 basic dice if the app has never been used
-    setDiceList([
-      {
-        id: generateId(),
-        numberValue: 1,
-        faces: 6,
-        currentFaceIndex: 0,
-        name: '',
-        customFaces: [],
-        color: '#E9EAEC',
-        held: false
-      },
-      {
-        id: generateId(),
-        numberValue: 1,
-        faces: 6,
-        currentFaceIndex: 0,
-        name: '',
-        customFaces: [],
-        color: '#E9EAEC',
-        held: false
-      }
-    ]);
+    // Default to 2 basic dice if the app has never been used (plain white d6s)
+    setDiceList(sanitizeDiceList([{}, {}]));
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);
 
diff --git a/src/hooks/useDiceState.ts b/src/hooks/useDiceState.ts
--- a/src/hooks/useDiceState.ts
+++ b/src/hooks/useDiceState.ts
@@ -2,6 +2,7 @@ import { useState, useEffect, useCallback } from 'react';
 import type { DiceData } from '../types';
 import { generateId, parseFaceContent, faceNumericValue, FACE_ICON_PREFIX, isNumberedFaces } from '../utils/diceUtils';
 import { MAX_DICE_LIMIT, MAX_HISTORY_LENGTH, ROLL_DURATION_MS, TOAST_DURATION_MS } from '../utils/constants';
+import { checkTargets } from '../utils/targets';
 
 export interface RollHistoryItem {
   id: string;
@@ -215,32 +216,19 @@ export const useDiceState = () => {
         faceGroups[d.faces].push({ index: i, val: d.targetValue ?? 0 });
       });
 
+      // Advantage keeps the highest of each group, disadvantage the lowest; the rest drop
       Object.values(faceGroups).forEach(group => {
-        if (group.length >= 2) {
-          if (advantageMode === 'advantage') {
-            // Keep highest, drop lower ones
-            const maxVal = Math.max(...group.map(x => x.val));
-            let kept = false;
-            group.forEach(item => {
-              if (item.val === maxVal && !kept) {
-                kept = true;
-              } else {
-                processedList[item.index].dropped = true;
-              }
-            });
-          } else if (advantageMode === 'disadvantage') {
-            // Keep lowest, drop higher ones
-            const minVal = Math.min(...group.map(x => x.val));
-            let kept = false;
-            group.forEach(item => {
-              if (item.val === minVal && !kept) {
-                kept = true;
-              } else {
-                processedList[item.index].dropped = true;
-              }
-            });
+        if (group.length < 2) return;
+        const vals = group.map(x => x.val);
+        const keepVal = advantageMode === 'advantage' ? Math.max(...vals) : Math.min(...vals);
+        let kept = false;
+        group.forEach(item => {
+          if (item.val === keepVal && !kept) {
+            kept = true;
+          } else {
+            processedList[item.index].dropped = true;
           }
-        }
+        });
       });
     }
 
@@ -282,8 +270,7 @@ export const useDiceState = () => {
     // Evaluate Target Highlight Match (e.g. "7" or "6, 8")
     let isTargetHit = false;
     if (onlyId === undefined && targetHighlight.trim()) {
-      const targets = targetHighlight.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
-      if (targets.includes(finalTotal)) {
+      if (checkTargets(targetHighlight).counts.includes(finalTotal)) {
         isTargetHit = true;
       }
     }
diff --git a/src/utils/constants.ts b/src/utils/constants.ts
--- a/src/utils/constants.ts
+++ b/src/utils/constants.ts
@@ -14,4 +14,3 @@ export const GA_MEASUREMENT_ID = 'G-LF0JH7CVP6';
 export const ROLL_TICK_INTERVAL_MS = 200;
 export const ROLL_DURATION_MS = 800;
 export const TOAST_DURATION_MS = 3000;
-export const DEFAULT_DEV_PORT = 4500; // block 4500 per aiprojects/PORTS.md
```

**A5 (one-line bug fix, a small behaviour change, so its own pull request with a test):**
Clear All uses the storage hook instead of poking storage, so the autosave can't come back.

```diff
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -326,15 +326,7 @@ function App() {
     if (diceList.length === 0) return;
     const removed = diceList;
     clearAllDice();
-    try {
-      const stored = localStorage.getItem('diceConfigs');
-      if (stored) {
-        const parsed = JSON.parse(stored);
-        delete parsed['systemAutosave'];
-        localStorage.setItem('diceConfigs', JSON.stringify(parsed));
-      }
-    } catch (e) {
-      console.error(e);
-    }
+    deleteConfig('systemAutosave');
     offerUndo(`Cleared ${removed.length} ${removed.length === 1 ? 'die' : 'dice'}`, () => restoreDice(removed));
   };
```
Test to add: Clear All, then save a game, then reload; the dice stay cleared.
Note it overlaps pull request 41's edit of the same lines.

Also for pull request 40: drop `getRandomNumber` (unused) rather than rewriting it.

## (b) Larger refactors (Focus ideas)

1. **One saved-settings list, backup built from it** (in health-ideas.json). Effort M. Card,
   because it changes what a backup file holds.
2. Split DiceSettingsModal.tsx into three parts with tests. Effort M. Not carded; do it alongside
   the next settings-window change.
3. Pull the first-load order (App.tsx:160-233) into a `chooseStartingDice()` function with one
   test per branch. Effort S. Fold into idea 1 if it is built.

## Standards applied

(none built in this review; A1–A3 apply standard 3 "Built once" when they land)

# App Review — Dice Roller (customdiceroller.com)

**Date:** 2026-08-12 · **Reviewer:** Claude Code (Opus) · **Scope:** full UI/UX, code, and app review of `master` (d4df180)

Method: read the entire `src/` tree plus configs, docs, and PWA assets; ran the app live (dev server, desktop + 375px mobile emulation); verified suspect findings by interacting with the running app and inspecting state, network traffic, and layout geometry. Items marked **[confirmed live]** were reproduced in the running app, not just inferred from code.

**Overall:** solid foundation — clean hook/component split, CSS modules, data-driven presets, a real test suite, working CI/CD to a custom domain, PWA basics. The issues below are concentrated in three areas: one real correctness bug in RPG advantage, an analytics/privacy layer that doesn't do what its UI claims, and mobile layout crowding in RPG mode.

---

## 1. Correctness bugs

### 1.1 Advantage/Disadvantage corrupts percentile (d100) and mixed pools — HIGH **[confirmed live]**
[useDiceState.ts:149](src/hooks/useDiceState.ts:149) groups dice by `faces` count alone. The Call of Cthulhu preset's tens die and units die are both `faces: 10`, so with ADV active they're treated as an advantage pair: rolled Tens=90 / Units=1 → units die DROPPED, total reported **90 instead of 91**. Any mixed pool of same-faced dice (e.g. 2d6 damage + d6 sneak) is likewise corrupted.

**Fix options:** (a) apply ADV/DIS only to plain d20s (matches 5e rules — advantage is a d20 mechanic); (b) exclude dice with `customFaces` from grouping; (c) let the user mark which dice form the advantage pair. Option (a)+(b) is the minimal safe fix.

### 1.2 Roll analytics never record the sum — MEDIUM **[confirmed live]**
[App.tsx:424](src/App.tsx:424) calls `trackEvent('roll_dice', {...})` without a `sum` field, so [analytics.ts:126](src/utils/analytics.ts:126) always adds 0: after a real roll of 9, localStorage showed `totalSumRolled: 0, highestRoll: 0` forever. Root cause: the total is computed asynchronously inside `rollDice()` (the hook), but the event is tracked at the call site which never learns the total. Track from inside the hook's completion callback (where `finalTotal` exists), or have `rollDice` accept an `onComplete(total)` callback.

### 1.3 Telemetry toggle doesn't actually stop Google Analytics — MEDIUM (privacy) **[confirmed live]**
- GA loads and fires `/g/collect` beacons unconditionally from [index.html:23](index.html:23) — including with "Anonymous Page Metrics" toggled OFF. The toggle only gates the custom `trackEvent` dispatch; GA4's automatic page_view + enhanced measurement still send.
- GA also fires on **localhost**, polluting your production property with dev traffic (confirmed 7 beacons during this session).

**Fix:** respect the toggle via GA's kill switch (`window['ga-disable-G-LF0JH7CVP6'] = true` before gtag runs, read from localStorage), and skip `gtag('config', ...)` when `location.hostname === 'localhost'`.

### 1.4 "Roll Modifier" setting does nothing — MEDIUM (dead setting)
`showModifier` ([App.tsx:61](src/App.tsx:61)) is persisted and passed to CustomizeModal — and read by nothing else. The modifier stepper's visibility is actually controlled by `rpgMode`. A user toggling "Roll Modifier — show mathematical offset adder bar" sees zero change. Either wire it to the modifier column in ActionBar or remove the setting.

### 1.5 Target Highlight feature has no UI — MEDIUM (dead feature)
`targetHighlight` / `setTargetHighlight` ([useDiceState.ts:22](src/hooks/useDiceState.ts:22)) implement a full "🎯 Target Hit" system (toast, history badge, gold border styling) — but no component ever calls `setTargetHighlight`. It's only reachable by hand-editing localStorage. Ship a small input (Customize modal or RPG column) or delete ~30 lines of dead code.

### 1.6 Roll history is never persisted, but backup pretends it is — LOW
`rollHistory` lives only in React state ([useDiceState.ts:17](src/hooks/useDiceState.ts:17)). Export reads a `localStorage['rollHistory']` key that's never written ([App.tsx:300](src/App.tsx:300)) — backups always contain `[]` — and import restores a key nothing reads. Either persist history (with a cap) or drop it from backup.

### 1.7 Autosave can be silently lost on mobile — LOW
Autosave only writes on `beforeunload` ([App.tsx:189](src/App.tsx:189)), which mobile browsers frequently don't fire (tab kill, swipe-away, bfcache). And [useStorage.ts:39](src/hooks/useStorage.ts:39) deletes the autosave on read, so a second tab or a crash after load eats it. Use `visibilitychange`/`pagehide` (fires reliably on mobile) and don't delete-on-read.

### 1.8 Final-tick animation race — LOW (cosmetic)
The tick interval in [Dice.tsx:35](src/components/Dice.tsx:35) fires its 4th tick (random value) at ~800ms, the same moment the finalize timeout in `rollDice` lands. Depending on scheduling, a die can flash a wrong value before snapping to the final one. Stop ticking after tick 3, or clamp all ticks ≥3 to the target value.

### 1.9 Help text drift — LOW
[HelpModal.tsx:20](src/components/modals/HelpModal.tsx:20) advertises "Usage Stats … under Tools > Usage Stats" — no such menu item exists. The local stats collected in `analytics.ts` have no viewer UI at all (related: a stats modal would make features 1.2's data visible and give the telemetry toggle real meaning).

### 1.10 Session double-count in dev — INFO
`recordSessionStart()` runs in a mount effect; React StrictMode double-invokes it (observed `totalSessions: 2` on first load in dev). Prod is unaffected, but the effect isn't idempotent — worth knowing before trusting local session counts.

---

## 2. UI/UX

### 2.1 Mobile + RPG mode: dice hidden behind the FAB cluster — HIGH (geometry-confirmed)
On a 375×812 viewport with RPG mode on, the action stack (ADV/NORM/DIS + modifier column + roll button) occupies **~314px of height** (y≈474–788), but the layout only reserves 120px ([App.tsx:380](src/App.tsx:380) inline `paddingBottom`, [App.module.css:129](src/App.module.css:129) mobile 96px). The dice grid sizes itself into space the buttons cover — with 2 large dice, the bottom die sits behind the FABs. Fix: feed the action bar's actual height into the container measurement (or reserve `~340px` when `rpgMode`), or collapse the RPG columns into a horizontal strip on narrow screens.

### 2.2 Roll button label becomes the total — MEDIUM
After the first roll the primary CTA reads "9" instead of "Roll" ([ActionBar.tsx:192](src/components/ActionBar.tsx:192)). New users lose the verb; the number also looks like a button *count*. Recommend a separate total chip (above the roll button) and a stable "Roll" label — the total is a result, the button is an action.

### 2.3 Tap-anywhere-to-hold is easy to trigger accidentally — MEDIUM
The entire die surface toggles hold on click ([Dice.tsx:129](src/components/Dice.tsx:129)). Users exploring the app (or mis-tapping between dice on mobile) silently lock dice, then wonder why they stopped rolling. The lock icon animates, but on small dice it's subtle. Consider: tap = reveal actions only; tap the lock icon (or long-press) = hold. At minimum, toast on first hold ("Die held — tap again to release").

### 2.4 Keyboard accessibility is absent — MEDIUM
- Dice are `<div onClick>` — no `role="button"`, no `tabindex`, unreachable and uninvokable by keyboard.
- Per-die action buttons are `opacity: 0; pointer-events: none` until *hover* ([Dice.module.css:47](src/components/Dice.module.css:47)) — keyboard focus never reveals them. Add `:focus-within` reveal.
- No `aria-live` region announces roll results — screen-reader users get silence on the core interaction.
- Modals have Escape-close (good) but no focus trap or focus restore.
- Roll button's accessible name is a bare number after rolling (compounds 2.2).

### 2.5 RPG shape wireframes are hard to tell apart — LOW
d10 `polygon(50% 2%, 96% 36%, 76% 98%, 24% 98%, 4% 36%)` vs d12 `polygon(50% 2%, 96% 35%, 78% 97%, 22% 97%, 4% 35%)` are visually identical ([Dice.module.css:187](src/components/Dice.module.css:187)); d20 reuses the d6 hexagon silhouette. The `PolyhedralWireframe` overlay helps, but at small sizes the silhouettes are the signal. Consider giving d12 a true pentagon-ish profile and d20 a taller hex.

### 2.6 Color picker popover detaches from its target — LOW
Hardcoded `top: 65px / 230px` ([DiceSettingsModal.tsx:244](src/components/DiceSettingsModal.tsx:244)) — editing face #8's color on a long list shows the popover far from the face being edited. Anchor to the triggering button.

### 2.7 Roll Log shows no breakdown for unnamed dice — LOW
`details` only includes named dice ([useDiceState.ts:194](src/hooks/useDiceState.ts:194)); the default 2d6 produce history rows with an empty middle column. Fall back to `d6 #1: 4` style labels.

### 2.8 Positives worth keeping
- Auto-contrast text on any die color (`getContrastColor`) — genuinely colorblind/readability-friendly.
- Preset library is excellent breadth for board gamers (Catan, LCR, King of Tokyo, Fate…).
- Hold-all, clone, per-die settings, share links via LZ-compressed URL hash — right feature set, no server needed.
- Synthesized WebAudio dice sounds + haptics, no asset downloads; sound is opt-in (good default).
- Themes are coherent; felt/midnight are tasteful; toast/animation polish is above average.

---

## 3. Code quality & architecture

### 3.1 App.tsx is a god component — MEDIUM
527 lines orchestrating theme, telemetry, share, backup import/export, autosave, modal state, and layout measurement. Extraction candidates: `useTheme()`, `useBackup()` (export/import), `useShareLink()`, `usePersistentToggle(key)` (the 3 copy-pasted localStorage toggle effects). This is the file that will rot first.

### 3.2 String-encoded face format is fragile — MEDIUM
Faces are strings with `:bg:` / `:icon:` sentinels (`"Barbarian:bg:#384050"`). User text containing `:bg:` breaks parsing; the format leaks into presets, share URLs, and backups, so it's now a de-facto wire format with no version tag. If you touch it, migrate to `{ text?, icon?, bg? }` objects with a read-side shim for old strings.

### 3.3 No validation on untrusted inputs — MEDIUM
Share-link hashes ([App.tsx:126](src/App.tsx:126)) and backup imports ([App.tsx:320](src/App.tsx:320)) `JSON.parse` and use the result with only `Array.isArray` checks. Malformed `faces: 0`, giant `customFaces` arrays, or non-string colors flow straight into state/styles. Low actual risk (no server), but a `sanitizeDice()` on both paths is cheap insurance against corrupt-state bugs — the kind DEVELOPMENT_RECORD.md says already bit this project once.

### 3.4 Duplicated roll-value logic — LOW
The held/unheld branches of `rawTargetList` ([useDiceState.ts:96](src/hooks/useDiceState.ts:96)) duplicate the custom-face→value parse. Extract `faceValue(dice, faceIndex): number`. Also makes 1.1's fix testable.

### 3.5 localStorage keys scattered as literals — LOW
`'diceConfigs'`, `'defaultDiceSet'`, `'appTheme'`, `'rpgMode'`, `'targetHighlight'`… across 4+ files. Centralize in `constants.ts` next to the existing ones.

### 3.6 Tests exist but miss the risky logic — MEDIUM
19 passing tests cover `diceUtils`, grid layout, CSS sanity, and basic state — good seed. But there are **zero tests for `rollDice`**: advantage/disadvantage grouping (bug 1.1 would've been caught), custom-face value parsing, modifier math, crit flags. That function is the app. The `cssSanity` + layout-guard + pre-commit hook setup is a genuinely good pattern — extend it to roll semantics.

### 3.7 CI deploys without running tests — LOW
[deploy.yml](.github/workflows/deploy.yml) runs `npm ci && npm run build` only. `tsc` catches type errors but a failing Vitest suite still deploys. Add `npm test` (and optionally `npm run lint`) before build.

### 3.8 Housekeeping — LOW
- `package.json` name is still `temp-app`, version 0.0.0.
- README.md is the stock Vite template — says nothing about the actual app.
- `scratch.txt` (leftover notes) committed at repo root.
- `old_legacy/` — fine as history, but a git tag would serve the same purpose without shipping it in every clone.
- npm audit: 5 vulns are **all dev-only** (vite/postcss/nanoid/babel chain); `npm audit --omit=dev` is clean. Fix at leisure with a vite minor bump.

---

## 4. PWA / SEO / meta

- **manifest.json icons**: only an SVG `any` icon. Android install prompts want a 192px + 512px PNG and a `maskable` purpose; iOS needs `<link rel="apple-touch-icon">` — currently missing, so home-screen icons will be poor/absent on iOS.
- **og:image is a relative URL** ([index.html:16](index.html:16)): scrapers (Discord/Facebook/Slack) require absolute URLs — link previews currently show no image. Also missing `og:url` and `twitter:image`. And `og-image.png` is **747KB** — compress to <300KB.
- **Service worker**: stale-while-revalidate is a sound choice; localhost bypass + dev unregister logic is thoughtful. One gap: nothing precaches the hashed JS/CSS bundles, so offline works only after a second visit — acceptable, just know it.
- `<html lang="en">`, viewport, theme-color all present — good.

---

## 5. Suggested priority order

| # | Item | Effort |
|---|------|--------|
| 1 | Fix advantage grouping (1.1) + add rollDice tests (3.6) | S–M |
| 2 | Mobile RPG-mode layout reservation (2.1) | S |
| 3 | GA consent + localhost gating (1.3) | S |
| 4 | Roll analytics sum (1.2) | S |
| 5 | Wire or remove: showModifier (1.4), targetHighlight (1.5), history-in-backup (1.6) | S each |
| 6 | Keyboard/a11y pass: focusable dice, focus-within reveal, aria-live total (2.4) | M |
| 7 | Roll button label vs total chip (2.2) | S |
| 8 | Autosave via pagehide (1.7) | S |
| 9 | Meta/PWA icons + absolute og:image (§4) | S |
| 10 | App.tsx decomposition (3.1) — do alongside whatever feature you touch next | M |

Not urgent, skippable: 2.5, 2.6, 3.2 (only if faces feature evolves), 3.8.

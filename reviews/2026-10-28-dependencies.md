Changed: yes

Done in this pull request: the service worker now saves the app's own files on the first visit (built without a new package; see the on-the-go write-up, fix 3), so the vite-plugin-pwa idea isn't needed now. Moving pictures to idb-keyval stays on watch, not carded, until storage-full messages appear after pull request 41.

# Build vs adopt again (2026-10-28)

**Short answer.** Still no library should replace our dice code. Two places
where adopting would help, both behind the scenes, are filed as ideas:
**offline from the very first visit** (vite-plugin-pwa, used to add a file
list to our own service worker) and, only if storage-full messages turn up,
**pictures moved to the browser's bigger store** (idb-keyval). Everything
else stays as ours. Nothing you see changes today.

## What changed since yesterday's pass (2026-10-27, in the review pull request 34)

- **Secure randomness is now built.** The secure randomness change (pull
  request 40) adds `randomBelow` in `src/utils/fairRandom.ts` (18 lines,
  crypto with rejection sampling). I checked the maths: it throws away the
  top few draws so every face is equally likely. It also edits
  `getRandomNumber`, which the review pull request 34 deletes, so whichever
  lands second needs a one-line merge fix.
- **A new dice library has turned up:** @randsum/roller 4.0.0 (MIT, no
  dependencies, July 2026). It reads drop-lowest, exploding and reroll
  notation. It's the one to look at if typed rolls ever need those.
- **framer-motion 14.7.1 and `motion` 14.7.1 came out on 27 Oct.** We're on
  12.43. Still a planned-sweep job.
- **vite-plugin-pwa 2.0.0** is now 25 days old (3 Oct). It supports Vite 8.
  The install tile (pull request 37) is in flight, which makes the gap below
  matter more.
- **New finding:** the service worker only stores the app's code on the
  *second* visit, and it never clears old copies. Details are under PWA
  below. The earlier pass said the offline walk passes. It does, but only
  after a second visit.
- **Storage:** the storage-full message (pull request 41) adds a small safe
  storage helper. Pictures on faces are still kept in localStorage, which
  holds about 5 MB for everything.

## Verdicts

| Area (our code) | Option checked 2026-10-28 | Verdict |
|---|---|---|
| Typed rolls, `src/utils/rollNotation.ts:28-96` (96 lines, plain notes, tested) | @dice-roller/rpg-dice-roller 5.5.1 (MIT, Feb 2025, ~7.8k/week, pulls in mathjs and random-js) | **Keep.** No release in 20 months, and it's heavy for what it adds. |
| same | dice-roller-parser 0.1.8 (MIT, Mar 2020, ~290/week); @3d-dice/dice-roller-parser 0.2.6 (May 2022) | **Keep.** Abandoned. |
| same | @randsum/roller 4.0.0 (MIT, Jul 2026, ~3.3k/week, no dependencies) | **Watch.** Only worth it if typed rolls gain d6! or 4d6L. Exploding dice is on the Desk as a per-die switch, and that's our own code either way. |
| Fair rolls, the secure randomness change (pull request 40), `fairRandom.ts` (18 lines) | random-js 2.1.0 (MIT, last release May 2019, ~612k/week) | **Keep ours.** It does the same thing with the same browser source, in 18 lines. random-js is six years stale. |
| Saves, settings, pictures: about 65 `localStorage` calls in `src/`; `useStorage.ts` (63 lines); `faceImages.ts:9-59` | idb-keyval 6.3.0 (Apache-2.0, works with MIT; Jul 2026; ~9.4M/week; about 0.6 kB) | **Keep localStorage for saves and settings. Watch pictures** (idea 2). Pictures can reach 200 × 60 kB, more than the ~5 MB space. Move them only if storage-full messages appear after pull request 41. |
| same | localforage 1.10.0 (Aug 2021, stale); Dexie 4.4.7 (Oct 2026, 3 MB unpacked) | **No.** Stale, or far more than a key-value store needs. |
| Offline, hand-written `public/sw.js` (99 lines) + `index.html:121-144` | vite-plugin-pwa 2.0.0 (MIT, Oct 2026, ~4.8M/week, Workbox 7.4), used in "inject list" mode | **Swap the file list only** (idea 1). Keep our network-first page logic, and let the plugin add the list of built files at build time. |
| Share links, lz-string 1.5.0 already in use (`App.tsx:359`, `setName.ts:55`) | fflate 0.8.3 (MIT, May 2026); the browser's own CompressionStream | **Keep.** It's adopted, tiny and stable (68M/week). A switch would change the link format and need old-link reading forever. |
| 3D dice (we draw 2D dice with CSS and SVG) | @3d-dice/dice-box 1.1.4 (MIT, Aug 2024, 11 MB unpacked with Babylon.js) | **Keep 2D.** No new release. Too heavy for a public site, and it clashes with custom faces and pictures. |
| Luck Meter and stats, `HistoryModal.tsx:20-36`, `StatsModal.tsx` | No library is needed. Fair-dice odds take about 15 lines of exact sums. | **Keep ours.** The fair-dice mark (already Building) needs no package. Target odds stays iced. |
| Dialogs, `components/Modal.tsx` (102 lines: Esc, focus trap, focus return) | @radix-ui/react-dialog 1.3.1 (MIT, Oct 2026, ~61M/week, 7 dependencies); native `<dialog>` with `showModal()` | **Watch native `<dialog>`.** It makes the dice behind the dialog unreachable for screen readers, which ours doesn't fully do. But `closedby` (tap outside to close) still isn't in Safari, and Back closes the dialog (pull request 36) is changing Modal now. Revisit after that lands. Radix is too much for 8 dialogs. |
| Toasts and Undo, `useUndo.ts` (40 lines) + `showToast` | sonner 2.0.8 (MIT, Aug 2026) | **Keep.** Ours already does one offer at a time, Undo and spoken messages, and the bar is moving to the bottom (Building). |
| Animation, framer-motion 12.43 (4 files) | framer-motion / `motion` 14.7.1 (MIT, 27 Oct 2026) | **Watch.** Do it in a planned upgrade sweep. Note for the weak-signal item (Building): motion's `LazyMotion` + `m` can shrink the first download without a new package. The main bundle is 137 kB gzipped. |
| Screen on (pull request 45), shake (`shake.ts`), sounds (`soundEffects.ts`), picture shrinking | nosleep.js 0.12 (Dec 2020), howler, browser-image-compression | **Keep.** The browser's built-in features already cover each one. nosleep.js is stale. |

Checked: `npm audit` and `npm outdated` weren't re-run (no installs here).
Versions and dates come from the npm registry, read 2026-10-28.

## Details

<details><summary>PWA: why the first visit isn't offline-ready</summary>

`sw.js` caches only `/`, `index.html`, two icons and the manifest at install
(lines 2-8). The app's code (`/assets/main-*.js`, `.css`) is fetched before
the service worker is registered on `load` (`index.html:137`). So it only
lands in the cache on a later visit, which is the gap APP_REVIEW.md:122
noted. Each deploy adds a new hashed bundle to `diceroller-v2`, and nothing
removes the old ones until someone renames the cache by hand. The plugin's
`injectManifest` mode writes the exact list of built files, including the
four landing pages, into our own `sw.js`, and clears outdated ones. The app
download doesn't grow. Precaching happens in the background after first
load.
</details>

<details><summary>Storage: how full pictures can get</summary>

`faceImages.ts` allows 200 pictures of up to 60,000 characters each, about
12 MB. Browsers give localStorage about 5 MB per site, shared with saves,
the autosave and stats. Typical 128 px JPEGs (4-12 kB) fit easily, so this
is a limit, not a bug seen today. IndexedDB gets a far bigger share of the
disk. The cost: pictures load a moment after start instead of at once,
because `useFaceImage` reads them synchronously today.
</details>

## Sources

- [npm: @dice-roller/rpg-dice-roller](https://www.npmjs.com/package/@dice-roller/rpg-dice-roller)
- [npm: dice-roller-parser](https://www.npmjs.com/package/dice-roller-parser)
- [npm: @randsum/roller](https://www.npmjs.com/package/@randsum/roller) · [README 2.0](https://cdn.jsdelivr.net/npm/@randsum/roller@2.0.0/README.md)
- [npm: random-js](https://www.npmjs.com/package/random-js)
- [npm: idb-keyval](https://www.npmjs.com/package/idb-keyval) · [MDN: storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [npm: localforage](https://www.npmjs.com/package/localforage) · [npm: dexie](https://www.npmjs.com/package/dexie)
- [npm: vite-plugin-pwa](https://www.npmjs.com/package/vite-plugin-pwa) · [vite-plugin-pwa change log](https://vite-pwa-org.netlify.app/guide/change-log) · [injectManifest guide](https://vite-pwa-org.netlify.app/guide/inject-manifest)
- [npm: lz-string](https://www.npmjs.com/package/lz-string) · [npm: fflate](https://www.npmjs.com/package/fflate) · [MDN: CompressionStream](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream)
- [npm: @3d-dice/dice-box](https://www.npmjs.com/package/@3d-dice/dice-box)
- [npm: @radix-ui/react-dialog](https://www.npmjs.com/package/@radix-ui/react-dialog) · [MDN: dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) · [Web features: dialog closedby](https://web-platform-dx.github.io/web-features-explorer/features/dialog-closedby)
- [npm: sonner](https://www.npmjs.com/package/sonner)
- [npm: framer-motion](https://www.npmjs.com/package/framer-motion) · [Motion: reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size)
- [npm: nosleep.js](https://www.npmjs.com/package/nosleep.js) · [MDN: Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)

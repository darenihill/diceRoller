Changed: no

# Build vs adopt (2026-10-24)

Packages today: react 19, framer-motion 12, lucide-react, lz-string. `npm
audit` finds no known problems in what ships.

| Our own code | Adopt instead? | Verdict |
|---|---|---|
| Offline code (`public/sw.js`, 90 lines) | Workbox via vite-plugin-pwa: network-first with a built-in timeout, assets stored ahead of time. | Worth it only if the offline code grows. Today a 3 s limit in our own code does the same job; both are offered as the two ways on the weak-signal card. |
| Share-link packing | lz-string already adopted; fine. | Keep. |
| Dice notation | The "type a roll" box is pending (not on master); not re-reviewed. | — |
| Shake detection (57 lines, tested) | shake.js and similar are unmaintained. | Keep ours. |
| Animation | framer-motion is two majors behind (12 → 14) and the largest part of the download. Its own LazyMotion option would trim the first load without a new package. | Not now: under a second on a slow link. Revisit with the next major update. |
| Statistics chart, sounds | Small and tested by use. | Keep. |

Dev tools behind: vitest 3 → 5, jsdom 26 → 29, typescript 6 → 7. No action
this pass; upgrade together in one pull request with the test suite as the
check.

No swap recommended, so no new card beyond the weak-signal ways.

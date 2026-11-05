Changed: no

# Build vs adopt again (2026-10-27)

| Our code | Candidate | Licence, last release | Swap it in? |
|---|---|---|---|
| Typed rolls, `rollNotation.ts` (96 lines, plain-English errors, tested) | @dice-roller/rpg-dice-roller 5.5.1 | MIT, Feb 2025 | **No.** It pulls in mathjs (hundreds of kB). Only worth it if keep/drop or exploding dice (4d6kh3, d6!) are wanted, and "drops the lowest" is on Watch. |
| Same | rpg-dice-roller 5.0, dice-roller-parser 0.1.8 | MIT, 2022 | **No.** Abandoned. |
| `Math.random` in every roll | the browser's `crypto.getRandomValues` | built in | **Yes, in our own code**, about 10 lines. On the Focus tab as a card, since it changes how every roll is made. |
| Hand-written `public/sw.js`, manifest | vite-plugin-pwa (Workbox) 1.3 / 2.0 | MIT, 2.0 out 3 Oct 2026 | **Not now.** The offline walk passes today; a new package needs a card, and 2.0 is three weeks old. Revisit if offline breaks. |
| 2D dice | @3d-dice/dice-box 1.1.4 | MIT, Aug 2024, 11 MB with Babylon | **No.** Too heavy for a fast public site, and it clashes with custom faces and pictures. |
| framer-motion 12 | `motion` 14 (its new name) | MIT, Oct 2026 | **Not now.** A major upgrade with no feature gain; do it in a planned dependency sweep. |

`npm outdated`: in-range bumps for react 19.3.1, vite 8.3.5, eslint and
lucide. Major versions waiting: vitest 3 to 5, jsdom 26 to 29, TypeScript 6
to 7, framer-motion 12 to 14. `npm audit --omit=dev`: 0 issues.

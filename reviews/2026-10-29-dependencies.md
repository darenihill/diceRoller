Changed: no

# Build vs adopt, again (2026-10-29)

The question: is there now an open-source library, service or app that does part of
Dice Roller better than our own code? Every hand-written part was checked against
current, maintained options (npm view, 2026-10-29). Today the app ships with only
framer-motion, lucide-react, lz-string and React.

| Part | Ours today | Best outside option | Verdict |
|---|---|---|---|
| Offline (public/sw.js, 89 lines) | Hand-made cache "diceroller-v2"; the built files are saved only after a visit | vite-plugin-pwa 2.0.0 + Workbox 7.4.1 (MIT, Oct 2026, Vite 8) | **Adopt: Focus card.** Stores the whole app ahead from the build list, clears old copies, can say "new version ready" |
| Shake to roll (57 lines) | Detector with cooldown and the iPhone permission prompt | shake.js and similar: old, no iPhone prompt | Keep |
| Type a roll parser (96 lines) | Small notation, plain-English notes | @dice-roller/rpg-dice-roller 5.5.1 (pulls in mathjs) | Keep; watch if exploding or keep-highest dice are wanted (both are on the Watch list) |
| Share links | lz-string 1.5.0 | Same | Keep. @types/lz-string is now an empty stub (lz-string ships its own types); drop it next time packages are touched |
| Metrics | Local counters, switch-off-able | PostHog, Plausible | Keep |
| Sounds | Web Audio, synthesized | howler.js + files | Keep: nothing to download |
| Dice shapes | Hand-drawn SVG | none fits | Keep |
| 3D tumble (on Focus) | none | @3d-dice/dice-box 1.1.4 (~11 MB, no release since Aug 2024) | Watch: makes the Focus idea cheaper but heavy and quiet |
| Randomness | Math.random | crypto.getRandomValues | Already built (pull request 40) |
| Saves | localStorage + JSON export | idb-keyval 6.3.0 | Keep: data is small |
| Dialogs (Modal.tsx) | Hand-made focus trap and Escape | The browser's own `<dialog>` | Watch: about 50 lines less code, no visible change; phone Back is already handled by pull request 36 |
| Toasts | One message + CSS | sonner 2.0.8 | Keep: one message at a time |
| Luck Meter chart | CSS bars | Recharts | Keep |
| Confetti | none | canvas-confetti 1.9.4 | Already built (pull request 54) |

## Checks

- `npm audit --omit=dev`: 0 vulnerabilities.
- Behind on major versions (care needed, no urgency): framer-motion 12 → 14,
  vitest 3 → 5, TypeScript 6 → 7, jsdom 26 → 29.
- Minor updates available: React 19.3.1, Vite 8.3.5, lucide-react 1.64.

## What was done

- Focus tab: "Offline: the app saves itself ahead of time and says when a new
  version is ready" (new package, so a card). It overlaps the offline part of
  pull request 47 and should replace or follow it.
- Nothing built: every swap here is a new package or has no visible gain.

Sources: https://npmjs.com/package/vite-plugin-pwa ·
https://github.com/3d-dice/dice-box · https://npmjs.com/package/@dice-roller/rpg-dice-roller

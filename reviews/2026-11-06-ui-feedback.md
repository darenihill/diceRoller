Changed: yes

# Polish: feedback and motion (2026-11-06)

Question: does every tap or click answer right away, with short, purposeful transitions?

Walked master (merge of pull request 74) as a production build in Chromium at 390 × 844 with touch. For each visible button on the main screen, the open menu and a tapped die, the pressed state was forced through the browser's dev tools and its look compared with the resting look (opacity, fill, filter, shadow, size, text color).

## What was found

| Screen | Buttons checked | No pressed look, before | After |
|---|---|---|---|
| Main screen | 14 | 13 (Roll, Add, About, every die button) | 0 |
| Menu open | 28 | 13 | 0 |
| A tapped die | 14 | 13 (Release, Roll again, Settings, Copy, Roll only, Remove) | 0 |

- **Taps gave no sign on a phone.** The page turns off the browser's grey tap flash (`-webkit-tap-highlight-color: transparent`), and only the menu button and menu tiles had a pressed style. Everything else changed only on mouse hover, which phones don't have. On a slow phone a tap on Roll looked ignored until the dice moved.
- **Tapped buttons stayed lit.** Hover colors (`.md-button:hover`, Undo's ×, the stepper, the Add D&D Die options and more, 17 rules) also fire on a tap and stay on until you tap somewhere else, so a button looked selected after you used it.
- **Motion is already short.** Transitions run 0.1 to 0.4 s; the longest animation is the 450 ms number reveal. The roll shake, total pop, new-die glide and dropped-die stamp were reviewed in earlier passes and Reduce motion keeps them still. Nothing to change.

Compared one flow at a time with widely loved apps: iOS system buttons dim while pressed (Apple Human Interface Guidelines, buttons); Material 3 shows a pressed state layer on every button (m3.material.io, states). Both answer the finger the instant it lands, before any action runs.

## What was done (fixes)

1. **Every button dims while pressed** (`src/index.css`): `button:not(:disabled):active { opacity: 0.72 }`, on the moment the finger lands. Works the same in every theme, since it doesn't pick a color. A die's own buttons get the same rule (`Dice.module.css`), because their reveal rules otherwise win.
2. **iPhone Safari shows it too** (`src/main.tsx`): Safari only applies `:active` once the page listens for touches, so a passive empty `touchstart` listener is added.
3. **Hover colors only with a mouse** (17 rules in `index.css`, `App.module.css`, `ActionBar`, `DiceSettingsModal`, `SidebarMenu`, `UndoBar`): wrapped in `@media (hover: hover)`, so a tapped button no longer stays lit. A computer with a mouse keeps every hover color. A die's hover rules are left as they are, because hovering a die shows its buttons on purpose.

Before and after (Roll button held down, top before, bottom after): screenshot kept with the review run, `compare.png`.

Test: `src/test/pressedLook.test.ts`.

## Design tweaks built

None.

## Standards applied

Standard 4 (say what happened): a tap now answers the moment it lands.

## Suggested next goals

None from this pass.

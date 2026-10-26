Changed: yes

# On the go: one hand, bright sun, gloves, weak signal (2026-10-24)

| Condition | What happens | Verdict |
|---|---|---|
| One hand | Roll, +, lock and menu sit in the bottom bar (y 660–820 of 844). RPG ADV/NORM/DIS and ± sit just above. Undo and every message show at the top (y 54). | Main actions in reach; **Undo out of reach** (card). |
| Gloves / wet hands | Bottom buttons 72 px. Buttons around a tapped die are 44 px with 1–2 dice, 36 px with 2 RPG dice, **30 px with 6 RPG dice**. Clear All 38 px tall. A missed X is caught by Undo. | Card for a 44 px floor. |
| Bright sun | Measured text contrast in all four themes: all pass except **Clear All in the light theme, 1.3:1**. | **Fixed** (light theme error colour) plus a guard test. |
| Shake while walking / phone in a bag | A firm shake rolled even with Dice settings or Save open. | **Fixed.** |
| Weak signal | Slow link, first visit: Roll usable in about 3.8 s. No signal: opens from the saved copy in 0.1 s. **Hanging signal: blank for 21 s** — the app asks the network first and waits. | Card (two ways). |
| Phone locks mid-game | Dice, holds and RPG mode come back. **Modifier and ADV/DIS reset.** | Card. |

Method: Playwright Chromium, iPhone 13 profile, 390 px; contrast computed
from the rendered colours; weak signal via network throttling, offline mode
and a 20 s stalled request with the service worker active.

Large text was not walked: the app sizes text in px, so iPhone text size does
not reach it; Android's font scale was not emulated this pass.

## Fixes built

See reviews/2026-10-24-stories.md (light-theme Clear All, shake under
dialogs, spoken messages, message timer).

Covers: one-hand-outside, ui-touch, access, breaks

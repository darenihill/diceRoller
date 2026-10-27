Changed: yes

# On the go: one hand, bright sun, gloves or wet hands, weak signal (2026-10-27)

| Condition | What happens | Verdict |
|---|---|---|
| One hand | Roll, Hold all, Add and the menu sit in the bottom bar in thumb reach. Roll is 156×72. | Good |
| Bright sun | Every theme passes WCAG AA after the contrast fix (pull request 33, waiting on Daren). The dark theme default has big black numbers on light dice. | Good once 33 lands |
| Gloves or wet hands, quick repeat taps | Buttons had no `touch-action`, so a fast double tap on Roll or a die could zoom the page (iOS) instead of rolling twice. | **Fixed** |
| Gloves, small targets | The buttons round a tapped die drop to 39 px in RPG mode; Clear All is 38 px tall. | Card in Discuss already |
| Weak signal | Opens in 3 seconds (built Oct 25). After one visit it works offline (checked: offline reload still shows the app and Roll). | Good |
| Weak signal, file missing from cache | The service worker returned nothing. | **Fixed:** cached copy or a clean error |
| Phone on its side on the table | Fits with no scroll. | Good |

## Fixes built

- Buttons and dice take `touch-action: manipulation`: quick repeat taps roll
  again and never zoom. A test guards it.
- Service worker offline fallback (see stories).

## Suggested (Focus tab)

None new. Small targets are already in Discuss with Daren's note "maybe below
a certain size the options pop out".

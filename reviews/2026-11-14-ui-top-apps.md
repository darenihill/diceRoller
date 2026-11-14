Changed: yes

# Match the best apps: the main flow (2026-11-14)

The most used flow: set the dice, Roll, read the total, Hold one, roll
again. Walked at 390×844 (Chromium, touch, 2× scale) on a `vite build` of
the release branch at f632f48, before and after. Screenshots are in Daren's
project files under `dice-roller/2026-11-14/ui-top-apps/` (`before-1` to
`before-8`, `after-1` to `after-8`). Findings already handled in the
10 November Material review and the 11 and 14 November reviews are not
repeated.

## Compared with

| App | The same step there |
|---|---|
| Google Search's dice roller | One Roll button at the bottom updates every die; the total sits in a fixed corner and changes only with the dice ([9to5Google](https://9to5google.com/2019/08/15/google-search-roll-dice/)) |
| Yahtzee with Buddies | Roll all five, then "hold" any number of dice and re-roll the rest, up to two more times ([Scopely help](https://scopely.helpshift.com/hc/en/32-yahtzee-with-buddies/faq/2995-how-do-i-play), [App Store](https://apps.apple.com/us/app/id1206967173)) |
| Apple's guidance on feedback | Feedback should help people "know what's happening" and "understand the results of actions"; status is best shown "near the items it describes" ([Apple HIG, Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback)) |

## The flow, step by step

| Step | Today (before) | Against the best apps |
|---|---|---|
| Set the dice | + adds a d6 in thumb reach; dice are large and centered (`before-2-added.png`) | Matches: one tap, at the bottom like Google's Roll |
| Roll | The dice tumble for 0.8 s | Matches |
| Read the total | The total lands on the Roll button and pops once (`before-4-total.png`) | Matches Apple's "near the items it describes" |
| **While the dice tumble** | **The Roll button kept the previous total at full strength over dice that hadn't landed** (`before-7-rolling-held.png`: the button said 9 while the dice tumbled). Table view dims its numbers until the dice land, and the screen reader line waits for them; the button didn't | **Fixed.** Google's total changes only with the dice, and Apple asks that status show what's happening. The old total now fades while the dice tumble, using the same faded look as a total whose dice changed, and comes back bright with the new total (`after-7-rolling-held.png`, `after-8-again.png`) |
| Hold | Tap a die › lock: HELD tag in gold with a lock, and Release 1 above Roll (`before-6-held.png`) | Matches Yahtzee's hold-and-re-roll; the word and the lock carry it, not the gold alone |
| Roll again | The held die stays still, the rest tumble (`before-7-rolling-held.png`) | Matches |

## Fixes built

- While a full roll tumbles, the Roll button's last total fades and comes
  back bright when the dice land. A die rolled on its own (Roll one) leaves
  the big total alone, as before. No new look: it reuses the faded total
  from 25 October ("The Roll button's old total fades once you change the
  dice"). The 26 October speed review called showing the first total over a
  second roll's dice a bug; this is the same thing for every roll.
  Tests: `src/test/polishTopApps20261114.test.tsx` (fails before the fix,
  passes after).

## ui-check (DESIGN.md is DRAFT, so report only)

- Scope: `src/App.tsx` (the Roll button's faded state), `ActionBar.tsx`,
  `ActionBar.module.css`.
- Mechanical: the change adds no values; it reuses `.rollBtnLabelStale`.
  The file's raw px font sizes and one `rgba()` edge are existing Known
  drift (§10).
- Judgment: M3's status rule is met: one state per number, faded while it
  doesn't describe the dice.

## Standards applied

- Say what happened | Roll button | Before: the previous total stayed bright while the new roll's dice tumbled | After: it fades until the dice land, then the new total shows bright (`src/test/polishTopApps20261114.test.tsx`)

## Suggested next goals

Dice Roller is in Maintain, so these are listed here and not sent to the
Desk.

- **Three or four dice sit two to a row on a phone.** Why: at 390px three
  d6 stack in one column with half the width empty, so the third die sits
  low near the buttons; Google and Yahtzee lay dice side by side. Cues:
  layout, one screen, effort M, impact low, confidence 40 (Dice size in
  Customize already lets people choose).

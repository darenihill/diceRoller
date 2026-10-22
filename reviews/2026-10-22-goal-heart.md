Changed: no

# Goal check: what success looks like (HEART) (2026-10-22)

Question: for happiness, engagement, adoption, retention and task success,
what would show Dice Roller has reached its goal, and is the goal one we
could ever tell we reached?

## Signals the app can already measure

The app sends these events (only with Anonymous Page Metrics on): roll_dice,
roll_one_die, preset_loaded, preset_saved, dice_added, share_link_copied,
backup_exported, backup_imported, theme_changed, sound_toggled. Google
Analytics also gives visitors and returning visitors; Search Console gives
search queries for the four landing pages.

| HEART | What reaching the goal looks like | Signal we have | Gap |
|---|---|---|---|
| Happiness | People say it does the dice their game needs | Feedback form (24 responses to Aug 2026); donations | No Donate-tap count yet (the donate_clicked event in GOAL.md Next is unbuilt) |
| Engagement | Several rolls per visit; custom dice made | roll_dice, dice_added per session | none |
| Adoption | New visitors from search and shared links; first roll soon after landing | GA visitors; Search Console; share_link_copied | No "first roll" timing |
| Retention | Same people back on game night; saved sets reused | GA returning visitors; preset_saved then preset_loaded of a save | Save loads aren't told apart from preset loads in analytics, on purpose (privacy) |
| Task success | Roll, read the total, change a die, save and reload, without getting stuck | Stories and cognitive-walk write-ups (manual) | Held-die confusion and lost work found 2026-10-22 have no metric |

## Could we tell we reached the goal?

**Not from the goal line as written.** "Customizable dice for board games and
tabletop RPGs, live at customdiceroller.com" was true the day the site went
live; it describes the product, not a result. Nothing in it says how many
people, how often, or what "good enough" is.

The parts of GOAL.md that *are* checkable sit in its Next items, each with a
"Done when". The one result-shaped hope on record is Daren's of 2026-10-09:
the app covers its own costs (the domain), with no ads. That one we could
tell: donations in a year at least equal the domain renewal.

## Verdict for this question

The goal is the right target but has no finish line. That calls for a
measurable line Daren chooses, not a different goal. Not suggested on the
Desk this pass, because the evidence does not point away from the goal
(combined write-up). A cheap step already queued in GOAL.md helps most:
the donate_clicked event.

What was done: nothing built; no Next item added.

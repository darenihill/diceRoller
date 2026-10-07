# Trunk test: lost in the middle (2026-10-07)

Lens: drop onto any screen cold. Can you tell what app this is, what screen you
are on, what you can do here, and how to get back?

Method: read the code (App, SidebarMenu, Modal, the modals, presets), then
walked the built app in headless Chromium at phone width (390 x 844) and
desktop width: cold first load, the menu, every dialog, loading a preset, RPG
mode. Compared one flow at a time against widely used apps: Google's built-in
dice roller and Google Keep (identity and place on a single-screen tool),
Material 3 bottom sheets and dialogs (back behaviour), Spotify's mini player
and Apple Music's "Now Playing" line (always naming what is loaded).

## Screen by screen

| Screen | What app? | Where am I? | What can I do? | How do I get back? |
|---|---|---|---|---|
| Main, cold | No. Two blank "1" dice and four round icons; the name exists only as a hidden heading and the tab title. | Yes, there is only one screen. | Roll is labelled. Lock, + and the chevron are bare icons. | n/a |
| Main, after loading a game | No | No. Nothing says which game is loaded (Catan shows two dice named Red and Yellow, nothing says "Catan"). | As above | n/a |
| Menu | No | Yes, labelled columns (App, Saves, Tools) | Yes, every item has an icon and a word. "Games" and "Load" open the same dialog. | Chevron-down button, tap outside, or Esc |
| Dialogs (Games & Saves, Help, History, Usage Stats, Customize, Dice Settings) | No | Yes, every dialog has a clear title | Yes | X, tap outside, Esc. Closing returns to the menu if it was opened from there, which is good. The phone's back gesture does not close a dialog: the app never adds a history entry, so back leaves the site (in the installed app, it closes the app). |

## What it found

1. **The app never names itself on screen.** A cold visitor from a shared link
   or search sees dice and icons. Google's dice roller has a header; most
   single-screen tools show a name or logo somewhere small.
2. **The loaded game is never named.** After loading Catan or a save, the
   screen has no "Catan". Music apps always name what is playing; this is the
   same need.
3. **The menu button is a bare chevron** with the hover text "Toggle Menu" and
   no accessible name. It reads as "scroll up" rather than "menu".
4. **Back leaves the app** from inside any dialog on a phone (code: no
   `pushState`/`popstate` anywhere in `src/`). Material and Android both treat
   back as "close the sheet or dialog".
5. **"Games" and "Load" are the same dialog** under two names in the menu.
6. Found on the way: **Most Played Games in Usage Stats never filled in**,
   because loading from the Games dialog never passed the preset's name. And
   the Yahtzee preset was spelled "Yatzee".

## What was done (this pull request)

- Loading a game or a save now shows "Loaded Catan" (or the save's name) as
  a short toast, using the toast the app already has. Covers finding 2 for
  the moment of loading.
- Loading a preset now records its name, so Most Played Games fills in. Only
  built-in preset names go to analytics; a save's own name never does.
- The menu button has a name for screen readers ("Open menu" / "Close menu"),
  says whether it is open, and its hover text is "Menu".
- "Yatzee" is now "Yahtzee".

Checked: lint, 34 tests, type check and build pass; in the browser the menu
button is found by its new name, "Loaded Catan" appears, Usage Stats lists
Catan, and the preset list shows Yahtzee.

## Next

- GOAL.md Next item: the phone's back gesture closes the open dialog or menu
  first (finding 4).
- Suggested on the Decision Desk's Focus tab (visible changes to a public
  app): a small top line naming the app and the loaded game (findings 1 and
  2); a menu button that reads as a menu, and one "Games" entry instead of
  two (findings 3 and 5).

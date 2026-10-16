# Goal

Customizable dice for board games and tabletop RPGs, live at
customdiceroller.com. Public app: every merge to master publishes the site.

## Next items

- Easier face colours (Daren 2026-10-16, Build): "Die settings would show
  all faces as coloured tiles in a row. Tap a face, then tap a colour, and you
  are done, with no hidden palette icon. A one-tap 'Colour every face
  differently' covers the 'roll for a colour' use people wrote about." Built
  2026-10-16 in three small steps, each with its done-check:
  1. Each face shows as a tile in its own colour; tapping one picks it, and a
     colour row (kept in view while scrolling) paints it. The per-face palette
     button is gone. Done when face 3 turns black in two taps at 390 px and
     1280 px.
  2. "Colour every face differently" gives every face its own colour, turning
     a plain numbered die into faces 1 to n first. Done when unit tests show n
     different colours for 1 to 100 faces and a d6 keeps its numbers.
  3. Help text says how. Done when the Help dialog names both.
  Built and checked locally on top of pictures on faces; pushing waits on
  Daren's OK (public repo).
- Pictures on dice faces (Daren 2026-10-16, Build): "In a die's settings you
  could pick a picture for any face, shrunk small so it fits on the device.
  Pictures stay on your device and go into backups, but not into share links,
  so links stay short. A shared die with a picture shows that face's text
  instead." Built 2026-10-16 in four small steps, each with its done-check:
  1. Face format: an optional `:img:<id>` marker beside `:bg:` and `:val:`.
     Done when unit tests read, build and trim faces with it.
  2. Choose picture on each face and "Add a picture face" in Dice settings;
     pictures shrink to 128 px and live in local storage. Done when a picture
     shows on the die at 390 px and 1280 px.
  3. A picture face still scores its number. Done when a picture face with
     Counts as 6 adds 6 to the total in the browser.
  4. Backups carry pictures; share links leave them out and show the face's
     text. Done when a backup restores the pictures on a fresh browser and a
     shared link opens with text faces.
  Built and checked locally; pushing waits on Daren's OK (public repo).
- Name the app and the loaded game on screen. The top of the screen shows only
  dice and icons, so someone opening a shared link cannot tell which app they
  are in, and after loading Catan nothing on screen says Catan. A slim top line
  would read Dice Roller, followed by a chip with the loaded game's name. The
  chip clears or changes when you load another game or edit the dice into
  something of your own. Changes: A top line names the app: Dice Roller; The
  loaded game shows as a chip, for example Catan; Shared links open with both
  names visible; The chip clears when the dice no longer match the game.
- Four search landing pages (Daren 2026-10-09, "start on the plan"):
  /dnd-dice-roller, /d20-roller, /catan-dice-roller, /classroom-dice-roller.
  Each opens the app with its dice loaded and has 150-300 words below the
  dice. Built locally 2026-10-09; next, check Search Console queries to tune
  the titles.
- The phone's back gesture closes the open dialog or menu first, instead of
  leaving the app (trunk test, reviews/2026-10-07-trunk-test.md, finding 4).
- Donations cover the domain: count Donate taps (a donate_clicked event, no
  personal data) and offer the Donate link at a good moment, such as after a
  share link is copied. Done when the event fires in a test and the prompt
  shows once after a share at 390 px and 1280 px (Daren 2026-10-09: no ads;
  hopes the app covers its own costs, which is about the domain).
- Roll just one die (Daren 2026-10-12, Build): "Tapping a die already shows
  small buttons for settings, copy and remove. A fourth button would roll only
  that die. The single roll goes in the roll log as its own entry, and the big
  total stays as it was." Done when a unit test shows only that die changes and
  the log entry is marked single, and at 390 px the button rolls one die while
  the Roll button's total stays put. Built locally 2026-10-12.
- Symbols that score a number (Daren 2026-10-12, Build): "A face with a symbol
  or word counts as zero today. Each face would get an optional Counts as
  number, so a gold star can count as 6 in totals and target highlights. Old
  share links and backups keep working unchanged." No preset named after a
  trademarked game. Done when unit tests show a star counting 6 in the total,
  log and target, and old face strings read as before. Built locally 2026-10-12.
- A menu button that reads as a menu (Daren 2026-10-12: "I like the idea of an
  updated menu icon. Animate as m3 between menu and close. I don't like the redo
  of the actual menu items."). The up-arrow becomes a three-line icon that turns
  into a close X when the menu opens; menu items unchanged. Done when the icon
  animates both ways at 390 px with screenshots. Built locally 2026-10-13.
- Dice size, step 1: add a stored dice-size preference (default 1.0, range
  0.6 to 1.6) applied as a multiplier on top of `calculateGridDimensions()`,
  clamped so dice never overflow the screen. Done when a unit test shows the
  multiplier scales the size and the clamp holds at 1 and 30 dice.
- Dice size, step 2: a "Dice size" slider (Smaller / Bigger) in Customize,
  using the app's existing toggle-row layout. Done when moving it resizes the
  dice live in the browser at 390 px and 1280 px, with screenshots.
- Dice size, step 3: include the size in backup export and import. Done when
  a round-trip test keeps the value and an old backup without it imports at
  the default.

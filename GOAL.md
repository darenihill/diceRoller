# Goal

Customizable dice for board games and tabletop RPGs, live at
customdiceroller.com. Public app: every merge to master publishes the site.

## Next items

- ~~Done 2026-10-28~~ Tapping Roll while the dice tumble lands them at once (Daren 2026-10-27,
  Build, way "Try it first on a private link"): "Second tap during the
  tumble: lands the dice at once, same result; History: one entry per roll,
  even after a double tap; Try link: a private preview to feel it on your
  phone before it goes public." It reaches the public site only after Daren
  says it feels right.
  1. ~~Done 2026-10-28~~ A second tap on Roll during the tumble lands the dice at once with the
     result already picked, and History gets one entry. Done when a unit test
     double-taps Roll and sees one History entry with the first roll's total.
  2. ~~Done 2026-10-28~~ Without a second tap, a roll looks and lasts as today. Done when a unit
     test sees the roll finish only after the usual tumble time.
  3. ~~Done 2026-10-28~~ A private try link only Daren can open runs this build. Done when the
     link opens the app in a browser and a double tap lands the dice.

- ~~Done 2026-10-22~~ Say the total includes the modifier (Daren 2026-10-22,
  Build): "The big number stays the real total, and the math sits beside it in
  brackets: 9 (7+2), so the dice and the modifier are both visible and nobody
  adds the +2 twice. A minus modifier reads 5 (7−2). Before any roll the button
  keeps 'Roll +2' as today."
  1. ~~Done 2026-10-22~~ After a roll with a modifier the Roll button reads
     9 (7+2), or 5 (7−2) for a minus; before a roll it still reads Roll +2.
     Done when unit tests cover both signs and a browser roll shows the brackets.
  2. ~~Done 2026-10-22~~ The math uses the modifier the roll counted, not one
     changed afterwards, and screen readers hear "Rolled 9: 7 plus 2". Done when
     a unit test rolls with +2 and reads the stored modifier and spoken text.

- ~~Done 2026-10-22~~ Tapping a die doesn't hold it (Daren 2026-10-22, Build):
  "The first tap on a die would show its small buttons without holding it, and
  a faint lock with the words 'Tap again to hold' would appear in the middle of
  the die. A second tap holds it: the lock turns gold, as today. After someone
  has held a die this way three times the words drop and only the faint lock
  shows, so regular players aren't nagged. The corner lock button keeps working
  too."
  1. ~~Done 2026-10-22~~ On a phone the first tap selects the die and shows
     "Tap again to hold"; a second tap holds. A mouse click still holds at once.
     Done when a unit test and a phone-emulated browser tap check both pass.
  2. ~~Done 2026-10-22~~ The words drop after three tap-holds; the faint lock
     stays. Done when a unit test counts three holds.
  3. ~~Done 2026-10-22~~ The corner lock is a real button that holds or releases,
     and Help says to tap twice. Done when a unit test taps the corner lock.
  Rolled back 2026-10-26 (Daren: "can we also roll back the change to have the
  double press to hold in the middle of the dice. I don't love how it looks").
  One tap holds a die again, as before 2026-10-22.

- ~~Done 2026-10-22~~ Your saves first in Games (Daren 2026-10-22, Build): "Games
  & Saves would list Your Saves first, since a returning player usually wants
  their own set. The menu would keep one Games entry instead of Games plus
  Load, which open the same thing. Presets stay as they are underneath."
  1. ~~Done 2026-10-22~~ Games dialog shows Your Saves above Presets when there
     are saves, and starts with Presets when there are none. Done when a unit
     test checks the heading order both ways.
  2. ~~Done 2026-10-22~~ The menu drops Load; Games does the same job. Done when
     a unit test finds Games and no Load in the menu.
- ~~Done 2026-10-22~~ Shake to roll (Daren 2026-10-22, Build): "A Shake to roll
  switch in Customize, off by default. When on, shaking the phone rolls the
  dice exactly like the Roll button. On iPhone the browser asks once for motion
  access, which is why it starts off."
  1. ~~Done 2026-10-22~~ A Shake to roll switch in Customize, off by default and
     remembered. Done when a unit test finds it off and a tap reaches its handler.
  2. ~~Done 2026-10-22~~ A firm shake rolls once, like the Roll button, and only
     from the main screen. Done when unit tests show small moves are ignored and
     one shake gives one roll.
  3. ~~Done 2026-10-22~~ Turning it on asks iPhone for motion access once; if it
     is turned down, the switch stays off with a short message. Done when a
     unit test covers granted, turned down and no sensor.
- ~~Done 2026-10-22~~ Undo after removing (Daren 2026-10-22, Build): "Every
  remove would say what it did and offer Undo for 5 seconds, using the app's
  existing message bar. This covers the X on a die, the bin on a saved game and
  Clear All. Clear All could then skip its confirm, since Undo brings
  everything back."
  1. ~~Done 2026-10-22~~ The X on a die shows "Removed d6" with Undo for five
     seconds; Undo puts the die back in its place. Done when a unit test puts a
     removed die back where it was and the offer closes after five seconds.
  2. ~~Done 2026-10-22~~ Deleting a saved game shows Undo, which brings the save
     back. Done when a unit test restores a deleted save.
  3. ~~Done 2026-10-22~~ Clear All skips its confirm and offers Undo, which
     brings every die back. Done when a unit test restores all dice after Clear
     All.
- ~~Done 2026-10-22~~ Safer saving (Daren 2026-10-22, Build): "Save Game would
  remember what you typed until you save or clear it. If a save with that name
  exists, the dialog says so and offers Keep both (adds '(2)') or Replace it."
  1. ~~Done 2026-10-22~~ The typed name comes back after tapping away, and clears
     once saved. Done when a phone-size browser check types a name, cancels,
     reopens and finds it, then finds it empty after saving.
  2. ~~Done 2026-10-22~~ A taken name shows a note with Keep both and Replace it,
     and Enter never overwrites. Done when unit tests cover the note, both
     buttons, Enter, and the "(2)" naming.
- ~~Done 2026-10-22~~ Empty screen offers next step (Daren 2026-10-22, Build):
  "When there are no dice, the middle of the screen would show a short line and
  two buttons: Add die (same as +) and Games (opens Games & Saves). It
  disappears as soon as a die is added."
  1. ~~Done 2026-10-22~~ With no dice, "No dice yet" with Add die and Games shows
     in the middle; it goes once a die is added. Done when a unit test clears the
     dice, finds both buttons, adds a die and finds the line gone.
- ~~Done 2026-10-22~~ Check target numbers as you type (Daren 2026-10-22,
  Build): "While you type in Target Highlight, any part that isn't a whole
  number gets a gentle note under the box, and the box edge turns the theme's
  error colour. Nothing is blocked or changed: the numbers that do read still
  celebrate as today. The note goes away as soon as every part is a number."
  1. ~~Done 2026-10-22~~ A part that isn't a whole number turns the box edge to
     the error colour and shows one line naming it and what still counts. Done
     when unit tests cover the note, its wording and the box's invalid mark.
  2. ~~Done 2026-10-22~~ Rolls celebrate exactly as before. Done when a unit test
     shows the note counts what a roll counts, and the roll code is unchanged.

- One highlight colour per meaning (Daren 2026-10-17, Build): "Every selected
  or focused thing (a theme card, a face, a colour swatch, the focused die)
  would use the theme's own accent colour, the same one the Roll button uses.
  Gold would only ever mean a held die, a target hit or a natural 20." Built
  2026-10-17 in four small steps, each with its done-check:
  1. Selected theme cards all use the theme's accent, not gold or lavender.
     Done when every theme card, picked, shows the same 3 px accent ring.
  2. Gold kept only for held dice, target hits and natural 20s. Casino Felt's
     accent becomes ivory, since its accent was gold. Done when a unit test
     shows no theme accent equals the gold token.
  3. The hold lock and Hold All use the shared gold colour. Done when no
     component names gold by hex (unit test).
  4. Selected faces and swatches match the focused die outline. Done when a
     picked face and swatch show the same 3 px accent ring at 390 px and
     1280 px.
  ~~Done 2026-10-17~~ (Daren OK'd the push 2026-10-17).
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
  ~~Done 2026-10-17~~ (Daren OK'd the push 2026-10-17).
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
  ~~Done 2026-10-17~~ (Daren OK'd the push 2026-10-17).
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
- Fixes from the 2026-10-22 four-lens review (reviews/2026-10-22-stories.md):
  the Save Game and Share Link buttons show as filled buttons; the bin on a
  saved game is named for screen readers; rolling with no dice logs nothing.
  Done when a unit test shows an empty roll leaves history empty and the Save
  button has a fill at 390 px. ~~Done 2026-10-22~~
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
- ~~Done 2026-10-23~~ Type a roll like 2d6+3 (Daren 2026-10-23, Build, Way A): "Everyday rolls:
  2d6+3, d20 adv, 1d8+2d6." In RPG mode a "Type a roll" box sits above the
  dice; typing fills in the dice, the modifier and advantage the app already
  has, then rolls.
  1. ~~Done 2026-10-23~~ A parser reads NdX, d20, plus or minus a number, mixed dice (1d8+2d6) and
     adv/dis, and gives a short plain note for anything it can't read. Done
     when unit tests cover each form, the limits and a typo.
  2. ~~Done 2026-10-23~~ The box appears in RPG mode only; Roll sets the dice, modifier and
     advantage, then rolls once. Done when a component test types 2d6+3 and
     sees two d6, +3 and one roll, and a 390 px browser check shows the box
     clear of the dice and the Roll button.
  3. ~~Done 2026-10-23~~ History shows what was typed beside the result. Done when a unit test
     reads the typed text on the history entry.

# Goal

Customizable dice for board games and tabletop RPGs, live at
customdiceroller.com. Public app: every merge to master publishes the site.

## Next items

- ~~Done 2026-11-11~~ Deep review, 2026-11-11: user stories walked at 390px, what could leak or
  be abused (STRIDE), and privacy and data, with release 99's Privacy page,
  Erase everything and Send Google less checked against the code at this
  head. Done when: reviews/2026-11-11-stories.md, -security.md, -privacy.md
  and -combined.md are written, each fix and standard gap found is built
  with tests, and ideas are listed under "Suggested next goals" (Dice Roller
  is in Maintain, so none go to the Desk).
- ~~Done 2026-11-11~~ Phone dialogs slide up from the bottom and swipe down to close (Daren
  2026-11-10, Build, way "sheet"): "On a phone, dialogs slide up from the
  bottom with a small grab bar on top. Dragging the grab bar down closes
  them; the × stays." Done when: at the phone width every dialog opens as a
  full-width sheet from the bottom edge with a grab bar and rounded top
  corners; dragging its grab bar or header down past a threshold, or a quick
  flick, closes it, as do tapping above it, Back and its ×/Done; with Reduce
  motion on it appears without sliding; the focus trap, 48px buttons, the
  Undo bar under it and a focused text box above the phone keyboard all
  hold; the computer layout is unchanged (src/test/bottomSheets.test.tsx).
- ~~Done 2026-11-11~~ The phone menu is the same bottom sheet (the Desk card's answer to
  Daren's "Does it slide up from the bottom as well?"). Done when: at the
  phone width the menu rises from the bottom edge with the grab bar and
  closes on a drag down, a tap above it or Back, and tapping History or
  Games swaps it for that sheet in the same spot; its own commit, so it can
  be dropped alone (src/test/bottomSheets.test.tsx).
- ~~Done 2026-11-11~~ Send Google less (Daren 2026-11-10, Build, way "Cut what isn't used"):
  "Rolls send how many dice and which mode, not the total or modifier; The
  second visit count and an unused second sender go; You keep Google's data
  2 months and turn its ad links off, in Google's settings." Done when: a
  roll sends Google its dice count, RPG mode, advantage and whether it was
  typed, and no total or modifier, while Usage stats still counts the total
  on the phone; the app's own session_start event is gone; the unused second
  sender (VITE_ANALYTICS_ENDPOINT) and the event names nothing sends are
  gone (src/test/sendGoogleLess.test.ts). Google's own settings are
  Daren's step.
- ~~Done 2026-11-11~~ The Privacy page stays exactly true. Done when: it no longer says a
  roll's total goes, and still names what Google gathers by itself; the
  field-list test passes (src/test/privacyPage.test.tsx).

- ~~Done 2026-11-11~~ Say plainly what goes to Google (Daren 2026-11-10, Build, way "Privacy
  page plus a Help line"): a short Privacy page, a Help line and a switch
  called "Page metrics". His page text: "Stays on this phone: your dice,
  games, History and pictures. Nothing you type, name or photograph is ever
  sent. Goes to Google while Page metrics is on: counts of visits, rolls and
  taps; your rough city, device and browser; a random ID Google keeps on
  this phone for about 13 months. Turning it off: Customize, Page metrics,
  Off. Then nothing goes to Google and its ID is deleted." He has not picked
  "Send Google less", so the page says what today's app sends, with any
  claim that isn't true of it corrected. Done when: customdiceroller.com/privacy/
  is a static page in the site's look with that text, true to
  src/utils/analytics.ts and every trackEvent call; it carries its own
  Content-Security-Policy written by npm run landing, is in the sitemap,
  opens offline, and reads at 320px and 200% text
  (src/test/privacyPage.test.tsx; Playwright on the built site: no policy
  errors, no sideways scroll at 320px and 200% text, and with the offline
  worker installed it opens offline on its first visit, checked on a local
  copy without the worker's localhost skip; shots in
  dice-roller/2026-11-11/privacy/).
- ~~Done 2026-11-11~~ The switch is called "Page metrics". Done when: Customize's metrics switch
  says "Page metrics" (its label, title and name for screen readers) and its
  line ends in a "What's sent" link to the Privacy page; DESIGN.md's word
  list has "Page metrics" in place of "anonymous page metrics", and the
  classroom page says Page metrics (src/test/privacyPage.test.tsx).
- ~~Done 2026-11-11~~ Help has one Privacy line linking to the page
  (src/test/privacyPage.test.tsx).

- ~~Done 2026-11-11~~ Erase everything at the bottom of Usage stats (Daren 2026-11-10, Build,
  way "Bottom of Usage stats"): "The ask-first panel counts what goes:
  'Erase 3 games, 120 rolls, 4 pictures and your stats? This can't be
  undone.' with a red 'Erase all' and 'Not now'. It clears every saved item
  (games, default dice, History, pictures, saved rolls, stats, settings) and
  Google's ID cookie, then reloads like a first visit. The metrics switch
  stays as set, so if it is on, Google starts a fresh ID." Done when: Usage
  stats ends with "Your games, History, pictures and these stats stay on
  this phone." and an "Erase everything" button outlined in red; it asks
  first in a panel that counts what goes (no part that is zero, "1 game"
  for one) with "Not now" and a red "Erase all", 48px tall; Escape is Not
  now and focus starts on Not now, with only Not now, Erase all and the
  dialog's × to Tab to (src/test/eraseEverything.test.tsx; Playwright at
  390px, dark and Clean Light, shots in dice-roller/2026-11-11/erase/).
- ~~Done 2026-11-11~~ Erase all really erases. Done when: every saved item and the first-visit
  mark are gone and Google's _ga cookies deleted after its tag is told to
  stop, another open tab stops saving and reopens too, the metrics switch is kept
  as it was, nothing on the page saves again before the reload (an Undo bar
  or a held picture can't bring anything back), and the app reloads at the
  home page and opens like a first visit; no Undo is offered
  (src/test/eraseEverything.test.tsx).
- ~~Done 2026-11-11~~ Words and Help. Done when: "erase (everything on this phone)" is in
  DESIGN.md's word list beside clear and delete, and Help has one line about
  it (src/test/eraseEverything.test.tsx).

- ~~Done 2026-11-11~~ First visit: the first die starts with its buttons
  open (Daren 2026-11-10, Build, way "Show the buttons once"): "On the very
  first visit only (nothing saved on the phone yet), the first die's button
  strip starts open, exactly as a tap opens it. Any tap, Roll included,
  closes it as it does today, and a mark saved on the phone stops it opening
  by itself again. No new text, color or box; with Reduce motion on it
  simply appears." Done when: with nothing saved, the app opens with the
  buttons round the first die open as a tap opens them; a tap on Roll closes
  them and rolls, a tap anywhere else closes them, and they close after five
  seconds as a tap's do; where small dice would put them in the sheet over
  Roll (a short screen or a phone on its side), they wait for a tap instead
  (src/test/firstVisit.test.tsx).
- ~~Done 2026-11-11~~ One saved mark, so it happens once per phone. Done
  when: the mark is saved as the buttons open; a second visit, anyone with
  saved dice, a theme, default dice, History, saved rolls or usage stats,
  and a share link never see them open by themselves; the mark stays out of
  backups and an import leaves it as it is (src/test/firstVisit.test.tsx).
- ~~Done 2026-11-11~~ Nothing else changes. Done when: no new words, colors
  or boxes; with Reduce motion on the buttons round a die appear without
  fading and the sheet without sliding (src/test/firstVisit.test.tsx);
  Playwright on the built site at 390px, dark and Clean Light, Reduce
  motion, a second visit and an existing user (shots in
  dice-roller/2026-11-11/first-visit/).

- ~~Done 2026-11-11~~ Catan: a 7 shows a Robber note above the Roll button (Daren 2026-11-10,
  Build, way "With the game, shown above Roll"): "Lives with the built-in
  game, not in Customize. The note follows the game name on the top line:
  while it says Catan (or Cities & Knights), a total of 7 shows the note in
  the message spot above Roll, in words with the 🎯 mark, never color alone,
  until the next roll." Done when: with Catan on the top line a roll of 7
  shows "🎯 7 · Robber" and "Over 7 cards? Discard half, then move it" just
  above Roll, a screen reader hears it with the total, and the next roll
  takes it away; any other total shows nothing (src/test/robberNote.test.tsx).
- ~~Done 2026-11-11~~ Cities & Knights carries its own 7 note. Done when: with Cities &
  Knights on the top line a 7 shows "🎯 7 · Robber" and "Over 7 cards?
  Discard half"; the note sits with each game in the popular games list, not
  in Customize (src/test/robberNote.test.tsx).
- ~~Done 2026-11-11~~ The note stops when the game does. Done when: after a
  die is added or removed, Catan is loaded again or another game is loaded,
  or Catan's dice are saved under another name, the note is gone and a 7
  shows none; other popular games, plain dice and typed rolls never show it;
  in RPG mode the dice make the 7, not the bonus; "🎯 Target hit: 7", the
  Undo bar and the new-version bar keep the spot and the note shows once
  they go (src/test/robberNote.test.tsx). Playwright on the built site, root
  text 16px and 32px, Catan and Cities & Knights at 320×640 and 390×844: the
  note stays inside the 16px gutters and covers no die, with or without the
  Release row (a die held), the dice area giving
  up room for it when it would (shots in
  dice-roller/2026-11-11/robber/).
- ~~Done 2026-11-11~~ Help names the note. Done when: Help has one line under Games saying a 7
  in Catan or Cities & Knights shows what to do above Roll
  (src/test/robberNote.test.tsx).

- ~~Done 2026-11-10~~ Material 3 fit (polish lens ui-material). Done when:
  the Die settings text boxes (name, number of faces, custom face text,
  "counts as") are the same outlined field as Save and the typed roll box,
  every text box shows a 2px edge while typing, and
  reviews/2026-11-10-ui-material.md says what was found
  (src/test/materialFit.test.ts).
- ~~Done 2026-11-10~~ Die settings face cards are white on Clean Light (Focus
  card built as a fix, Daren 2026-11-10: fixes shouldn't be cards). Done
  when: the face cards, − and + and the icon picker take each theme's own
  shade, not a fixed black; on Clean Light the cards are white with a gray
  edge and the "counts as" edge is 3:1 or more on every theme; Dark, Felt and
  Midnight look the same (src/test/cardFixes.test.tsx).
- ~~Done 2026-11-10~~ Messages like "Saved" don't cover the open menu (Focus
  card built as a fix). Done when: with the menu or the Add menu open no
  message shows on it; a message still fresh when the menu closes shows then
  (src/test/cardFixes.test.tsx).
- ~~Done 2026-11-10~~ One offline copy per page, without ad IDs (Focus card
  built as a fix). Done when: the offline worker saves each page under its
  address without the query, so ad links (?gclid, ?fbclid) share the plain
  page's copy and keep no ID; the cache moves to v6 so the old copies go;
  offline, an ad link still opens the app (src/test/cardFixes.test.tsx; check
  on the live site after it lands).
- ~~Done 2026-11-10~~ Dialog buttons are 48px tall (Daren 2026-11-10 on the
  Desk: "This shouldn't be a card if it's matching a standard"; standards 9
  and 20). Done when: every button inside a dialog (Save's Cancel and Save,
  Keep both, Replace it, Clear History, Share's and Install's Done, Die
  settings' Remove, Copy, Done and Add) is at least 48px tall through one
  shared rule, with the same words, order and colors and 8px between
  buttons; the dialogs' boxes, steppers and chips are 48px too; nothing runs
  off at 320px or at 200% text that didn't before; and
  reviews/2026-11-10-tap-targets.md lists what is left under 48 and why
  (src/test/tapTargets.test.ts).
- ~~Done 2026-11-10~~ Enter in Save no longer opens the menu (stories
  review, standard 20). Done when: pressing Enter (or a phone keyboard's Done)
  in Save's name box saves the game and the menu stays shut; with a taken name
  Enter still only puts the keyboard away (src/test/review20261110.test.tsx).
- ~~Done 2026-11-10~~ The Undo bar never covers a dialog's buttons (stories
  review, standard 2). Done when: with a dialog open (Die settings, Games,
  History, Save) the bar and messages sit at the screen's bottom edge, under
  the dialog, so Done after removing a face closes the dialog instead of
  pressing Undo; with no dialog open the bar stays just above the buttons
  (src/test/review20261110.test.tsx).
- ~~Done 2026-11-10~~ Die settings tabs fit at a large text size (stories
  review, standard 9). Done when: at 150% and 200% text size "Die Settings"
  and "Custom Faces" wrap onto two lines instead of running into each other
  and under ×; at normal size they look the same as before
  (src/test/review20261110.test.tsx).
- ~~Done 2026-11-10~~ A share link can't dress other dice up as a popular game
  (security review). Done when: a link named "Catan" with a hidden character,
  wide letters or an extra space, and other dice, opens with no name, and
  direction marks are taken out of link names; Catan's own dice and ordinary
  names still keep theirs (src/test/review20261110.test.tsx).
- ~~Done 2026-11-10~~ Safety net: the site refuses code from anywhere except
  itself and Google (Daren 2026-11-10, Build). Done when: the home page and
  the four search pages carry a Content-Security-Policy meta, written by npm
  run landing, that allows scripts only from the site, Google Tag Manager and
  the two inline scripts' sha256 hashes (no 'unsafe-inline' for scripts),
  images from the site, data:, blob: and Google Analytics, data only to the
  site and Google Analytics, and workers and the manifest only from the site;
  a Playwright walk of the built site (roll, die settings with a picture,
  share link, History, Customize with metrics on and off, RPG mode with a
  natural 20, the four search pages) logs no policy violation
  (src/test/picks20261110.test.tsx).
- ~~Done 2026-11-10~~ With metrics off, the app no longer contacts Google for
  its font (Daren 2026-11-10, Build). Done when: Roboto 400, 500 and 700 come
  from the site (public/fonts/, @font-face with font-display: swap), the home
  page and the four search pages have no Google Fonts links, the service
  worker saves the font for offline and has no Google Fonts branch, and
  screenshots before and after match pixel for pixel
  (src/test/picks20261110.test.tsx).
- ~~Done 2026-11-10~~ Saved games load from a tap anywhere on their row (Daren
  2026-11-10, Build). Done when: in Games > Your games the load target fills
  the row's full height and everything left of the bin, at least 48px tall,
  the bin stays 48 x 48 even beside a long name, and the text sits where it
  did (src/test/picks20261110.test.tsx).
- ~~Done 2026-11-10~~ Photos on removed dice are really deleted from the phone
  (Daren 2026-11-10, Build). Done when: when the app starts, and whenever an
  Undo bar or a die's settings close with neither left up, pictures no face
  names are deleted; a picture is kept while it is on screen, in any saved
  value (saved games, the autosave at start, the default dice, History rows)
  or held for an Undo, and all are kept when storage can't be read; a removed
  picture is gone after a reload, and ones in a saved game, the default dice
  or History stay (src/test/picks20261110.test.tsx).
- ~~Done 2026-11-10~~ After you type a roll, the big Roll button rolls it
  (Daren 2026-11-10, Build). Done when: in RPG mode, with a roll that reads in
  the roll box, the big Roll button rolls it exactly as the box's own Roll
  does (its dice swap in, with Undo); with the box empty or holding a roll
  that doesn't read, Roll works as before; Help's typed-roll line names the
  big Roll button (src/test/picks20261110.test.tsx).
- ~~Done 2026-11-09~~ A double tap on Remove keeps its Undo (impaired and
  stories review, standard 2). Done when: a tap on the Undo bar's × or Undo
  that starts within half a second of the bar showing does nothing, so the
  second tap of a double tap on Remove, Delete or Clear all can't throw the
  Undo away; keyboard presses still work at once
  (src/test/review20261109b.test.tsx).
- ~~Done 2026-11-09~~ Two games deleted in a row both come back (impaired
  review, standard 2). Done when: deleting a second game while the bar is up
  says "Deleted 2 games", one Undo brings both back, and each game returns to
  its old place in Your games, not the end; dice removed in a row join the same
  way, "Removed 2 dice" (src/test/review20261109b.test.tsx).
- ~~Done 2026-11-09~~ Removing a face's picture can be undone (stories
  review, standard 2). Done when: Remove picture says "Removed picture" with
  Undo, and Undo puts the same picture back on the face
  (src/test/review20261109b.test.tsx).
- ~~Done 2026-11-09~~ Page metrics off means nothing goes to Google (privacy
  review, standard 15). Done when: with metrics off, the home page and the four
  search pages don't fetch Google's tag script, turning metrics on fetches it
  without a reload, and Google's `_ga` cookies are deleted when metrics go off
  and on each visit while off (src/test/review20261109.test.tsx).
- ~~Done 2026-11-09~~ A backup can't turn page metrics back on (privacy
  review). Done when: Import keeps metrics off when the backup says on, and
  still turns them off when the backup says off
  (src/test/review20261109.test.tsx).
- ~~Done 2026-11-09~~ Focus goes back to the menu button after a menu dialog
  (stories review, standard 9). Done when: closing Customize, History, Games,
  Help, Usage stats or Save leaves focus on the menu button, not the start of
  the page (src/test/review20261109.test.tsx).
- ~~Done 2026-11-09~~ Words on screen, last pass (polish lens ui-copy). Done
  when: the safe rewrites left over from the 2026-11-06 copy audit are in
  (no semicolons in messages, US "around", plain sound and stats lines,
  "No custom faces yet"), and reviews/2026-11-09-ui-copy.md says what was
  found.
- ~~Done 2026-11-08~~ History shows each roll as small dice (Daren 2026-11-07,
  Build: "History shows each roll as small dice, not “d6 #1: 2, d6 #2: 4”").
  Done when: each History row shows the roll number with the game, typed roll
  or die name under it, a small tile per die in that die's color with its
  face, the Advantage die left out faded and struck through, and the total on
  the right with any modifier math under it; many dice wrap; a screen reader
  still hears the full lines; older rolls show plain white tiles
  (src/test/historyTiles.test.tsx).

- ~~Done 2026-11-08~~ One name per thing (Daren 2026-11-07, Build: "Use one name for each thing
  in the app, from a short word list"; way "Call saved dice games"; his
  comment: "Popular Games"). Done when: DESIGN.md §7 holds the word list;
  the Games dialog is titled "Games" with "Your games" and "Popular games";
  one die's dialog is "Die settings"; menu tiles and dialog titles are in
  sentence case; messages carry no "!" (src/test/oneName.test.tsx).
- ~~Done 2026-11-08~~ Help says tap, in short items. Done when: Help has no "click", "e.g." or
  "preset", and each item is one or two short sentences
  (src/test/oneName.test.tsx).
- ~~Done 2026-11-08~~ Landing pages point at real menu items. Done when: no landing page sends
  people to "Load" or a "set"; they say Games and saved games
  (src/test/oneName.test.tsx).
- ~~Done 2026-11-08~~ Save fills in a name for you (Daren 2026-11-07, Build:
  "Save fills in a name for you, like “Catan 2” or “2 d6”"). Done when:
  Save opens with a name already in the box and selected, so typing replaces
  it: a loaded game's name ("Catan", or "Catan 2" when taken); dice named in
  Dice Settings ("Lunch die + 2 d6"); plain dice counted by kind ("2 d6 + 1
  d20"); unnamed custom-face dice "Custom dice". A taken name still asks Keep
  both / Replace it (src/test/saveNameSuggest.test.tsx).
- ~~Done 2026-11-08~~ Tap a past roll in History to put those dice back out (Daren 2026-11-07,
  Build: "Tap a past roll in History to put those dice back out"). Done when:
  tapping a History row closes History and puts that roll's dice out, unrolled,
  with "Loaded dice from History · Undo"; a typed roll (2d6+3) goes back into
  the roll box ready to roll; new rolls keep each die's color and name, and
  older rolls come back in the default color (src/test/historyReuse.test.tsx).

- ~~Done 2026-11-08~~ Phone menu groups (Daren 2026-11-01, Build: "Phone menu
  groups its tiles under App, Saves and Tools"; 2026-11-07: "I want to give
  more of an indicator (especially on mobile) related topics like we have on
  desktop"; way A from the mock-ups). Done when: on a phone the App, Settings
  and Saves headings show above their rows (the circle, square and triangle
  came out 2026-11-10 at Daren's ask), each row of tiles lightly tinted in a colorblind-safe blue,
  orange or pink-purple; the computer menu keeps its headings
  (src/test/menuGroups.test.tsx).

- ~~Done 2026-11-07~~ Switches say On or Off (app standards: accessibility;
  deep review 2026-11-07). Done when: every Customize switch shows On or Off
  in words under it, so its state never rests on color alone
  (src/test/switchWords.test.tsx).
- ~~Done 2026-11-07~~ Backup keeps the newest switches (review 2026-11-07,
  standard 1, no lost work). Done when: Export backup carries Table view,
  Bright Rings and Sort dice, Import brings them back, and the
  round-trip test fails if any saved value is left unseeded
  (src/test/backup.test.tsx).
- ~~Done 2026-11-07~~ Usage Stats survives a damaged backup (review
  2026-11-07, security). Done when: stats of the wrong kind fall back to their
  defaults on load, so Usage Stats opens instead of blanking the app
  (src/test/statsSafe.test.tsx).
- ~~Done 2026-11-07~~ Metrics switch says where data goes (review
  2026-11-07, standard 15, privacy). Done when: Customize's Anonymous Page
  Metrics line names Google Analytics and what is never sent
  (src/test/privacyWording.test.tsx).
- ~~Done 2026-11-08~~ Fixes from the 2026-11-08 review (stories, security,
  inversion). Done when: a share link opened in the tab Dice Roller is
  already in puts its dice out with Undo, as a fresh visit does; Help says
  "Tap a die, then Hold" and "then Settings", not lock and gear; the empty
  screen says "RPG mode" (src/test/review20261108.test.tsx).
- Recently deleted (review 2026-11-07, standard 2, Undo › get it back later).
  Done when: a deleted saved game, a cleared History and dice cleared with
  Clear all (review 2026-11-08) go to a Recently deleted list for 30 days,
  each row with its name, how long ago and Restore, after the Undo bar has
  gone.
- Large text, zoom and keyboard pass (reviews/2026-11-06-stories.md, S3, S9,
  S10, S12). Done when: at 200% page zoom (195 px wide) the menu button can be
  reached; with 32 px text the Dice Settings tabs, the Color/Icons/Text row and
  menu tiles don't overlap or split words; Enter on + moves focus into the Add
  D&D Die menu and + reports aria-expanded; face-row buttons are 44 px tap
  areas.
- Older backup asks first (reviews/2026-11-06-stories.md, S4). Done when:
  importing a backup with less history than the device says how many rolls it
  replaces, and Undo puts back today's history, dice and settings.
- Same-name typed roll asks (S6). Done when: saving a typed roll under a name
  already used asks Keep both / Replace it, like Save Game.
- Messages show over Undo (S8). Done when: "Saved!", "Share link copied" and
  "Saved Attack" show while an Undo bar is up, and the Undo stays reachable.
- Loading text on a slow link (S14). Done when: the page shows "Loading
  dice…" before the app script arrives.
- ~~Done 2026-11-06~~ Typed "2d6+3 adv" reads back as typed, not "d6+3 adv"
  (stories, remix and words review; src/test/typeRoll.test.tsx). The word
  list and wording changes are a Focus idea (reviews/2026-11-06-copy.md).
- ~~Done 2026-11-06~~ Fixes from the 2026-11-06 review
  (reviews/2026-11-06-combined.md): Import Backup keeps the imported games, a
  file that isn't a backup is refused, search pages offer Undo, Add custom text
  is kept on Done, the Undo bar waits for the Add D&D Die menu, saving under a
  new name updates the header, Table view no longer overlaps in RPG Mode, the
  typed-roll Undo message wraps, and a backup can't break stats or turn
  analytics back on (src/test/reviewWalk20261106.test.tsx,
  src/test/review20261106.test.ts).
- ~~Done 2026-11-06~~ Feedback polish (reviews/2026-11-06-ui-feedback.md).
  Done when: every button dims while pressed on a phone, iPhone included, and
  a tapped button no longer stays lit from hover (src/test/pressedLook.test.ts).
- ~~Done 2026-11-07~~ Games in two columns (Daren 2026-11-07: "Include
  that", after the two-column try-out). Done when: Games & Saves shows saves,
  presets and backup buttons two to a row at every width (src/App.module.css,
  checked at 390 px).
- ~~Done 2026-11-07~~ A sentence stays one face (player feedback 2026-11-06:
  "if the sentence is more than 2-3 words it's being separated into similar
  faces"; Daren 2026-11-07: "can we make sure all of this is addressed?").
  Done when: Add custom text splits on commas only when every piece is one or
  two words, a pasted list of sentences adds one face per line with Undo, a
  face keeps its first 60 letters, and a long word face wraps onto up to four
  lines instead of shrinking to one (src/test/pasteFaceList.test.tsx).

- ~~Done 2026-11-06~~ Reorder custom faces (Daren 2026-11-05, Build: "Drag a die's custom faces
  into a new order"): each face in Custom faces gets a grip; dragging it
  moves the face with its color, picture and number, the arrow keys move it
  too, and Undo puts the old order back. Rolls don't change, only the list
  order, which is also the order a shared die shows. Done when: a drag or an
  arrow key moves a face, the face showing on the die stays the same, and
  Undo restores the order (src/test/reorderFaces.test.tsx).
- ~~Done 2026-11-07~~ Share box wording (Daren 2026-11-06, Build with
  comment: '"Share with this link" instead'). Done when: the copy-link box
  that shows when the phone's share sheet isn't available is labeled "Share
  with this link" (src/test/shareSheet.test.tsx).
- ~~Done 2026-11-07~~ Color names in the picker (Daren 2026-11-06, Build: "Color picker writes
  the color's name, like "Die color · White""). Done when: the title above
  the color dots in Dice Settings and in Custom faces Color names the picked
  color in words, using the names screen readers hear; a custom color reads
  "Custom" and its code (src/test/colorPicker.test.tsx).
- ~~Done 2026-11-07~~ Sort dice after each roll (Daren 2026-11-06, Build: "A Sort button lines
  up the dice from low to high after a roll"; card: no button on the main
  screen, a "Sort dice" switch in Customize (named "Sort dice after each roll"
  until the 2026-11-09 trim pass), off by default
  and kept on this device). Done when: with the switch on, the dice slide
  into low-to-high order each time a roll lands, only where they sit changes
  (never what they rolled, the saved dice order or History), and turning it
  off puts them back in their own order (src/test/sortDice.test.tsx).
- ~~Done 2026-11-03~~ Lift and tag lock (Daren 2026-11-03: "For lock I like
  the lift and held tag"). Done when: a held die lifts with a deeper shadow
  and a gold HELD tag drops onto its top edge; a die loaded already held shows
  the tag without the drop (src/test/heldTag.test.tsx).
- ~~Done 2026-11-03~~ One colour picker (Daren 2026-11-03: "make sure all
  color picking is consistent throughout the app (both non overflowing rows
  and custom color selection)", "I like the color picker"). Done when: die
  colour and face colour use the same twelve equal dots (two rows of six) in
  the page, Custom opens the same sliders and colour code everywhere, and no
  phone colour tool or floating box remains (src/test/colorPicker.test.tsx).
- ~~Done 2026-11-04~~ New-version bar (Daren 2026-11-03, Build: "The
  installed app shows a bar when a new version is ready"). Done when: an app
  left open shows "New version · Refresh · ✕ (Later)" once a newer version is
  live (checked when it comes back on screen, when signal returns and every
  30 minutes), Refresh loads it, Later hides it until the next version, and
  the offline worker lets the check reach the network
  (src/test/newVersion.test.tsx).
- ~~Done 2026-11-02~~ Dice settings tabs (Daren 2026-11-02: "remove the quick
  templates from a dice settings ... shift dice settings to 2 main tabs 'Dice
  Settings' ... and 'Custom faces' ... take up the top where Dice settings
  title is currently and leave the close x on the top right"). Done when: the
  two tabs sit in the title bar beside the close button, and Quick Templates
  are gone (src/test/diceSettingsTabs.test.tsx).
- ~~Done 2026-11-02~~ Die buttons (Daren 2026-11-02: "Delete can be red ...
  and then match the single roll with the regular roll blue"; "change the X on
  the dice for delete to a trash icon"). Done when: Roll one uses the Roll
  button's blue, Delete stays red and shows a trash icon
  (src/test/rollOneColour.test.ts).
- ~~Done 2026-11-02~~ Most used far right (Daren 2026-11-02: "I want the most
  used items to the far right") and Clear History findable ("There isn't an
  option to clear history"). Done when: Saves is the right-hand menu group,
  each group ends with its most used tile, and Clear History sits at the top
  of History.
- ~~Done 2026-11-02~~ Even menu (Daren 2026-11-02: "update the menu to make
  it look cleaner, it's too inconsistently sized currently, 6 options in tools
  vs 3 in saves"). Done when: App, Saves and Settings hold four each (History
  joins Saves; Install app sits beside Clear All in the bottom row).
- ~~Done 2026-11-02~~ Bright rings as a Customize switch (Daren 2026-11-02:
  "I thought the bright rings were something that could be turned on in the
  custom section"). Done when: the ring shows only with Customize > Bright
  Rings on, it is off by default and kept on this device
  (src/test/controlRing.test.tsx).
- ~~Done 2026-11-02~~ New die animation (Daren 2026-11-01, Build): "a die you
  add glides out of the + button into its place." Works for the RPG
  quick-add menu too. Done when: a die added from + (or its menu) rises from
  the button into its slot; dice already out, copies and Reduce motion keep
  the usual appearance (src/test/addGlide.test.tsx).
- ~~Done 2026-11-02~~ Total animation (Daren 2026-11-01, Build): "the total on
  the Roll button pops slightly bigger and settles when the dice land." One
  short scale on the number, nothing else moves. Done when: each landed roll
  pops the total once, not while tumbling, and Reduce motion keeps it still
  (src/test/totalPop.test.tsx).
- ~~Done 2026-11-02~~ Dropped die animation (Daren 2026-11-01, Build): "with
  Advantage, the lower die shrinks back and a DROPPED stamp drops onto it."
  Only in RPG Mode with Advantage or Disadvantage; nothing about the roll or
  the total changes. Done when: the dropped die sinks back and dims with
  Material 3 emphasized easing, the DROPPED stamp drops in, and Reduce motion
  keeps both still (src/test/droppedDie.test.tsx).
- ~~Done 2026-10-24~~ Show the result big for the table (Daren 2026-10-23, Build, picked "Table
  view switch in the menu"): "The Roll button stays a roll button. A Table
  view switch in the menu; while it is on, each roll shows the total huge in
  the dice area, its math under it, the dice as small tiles and an upside-down
  copy at the top. The Roll button below keeps rolling, and tapping the big
  number shows the dice again. Flipped 6 and 9 are underlined."
  1. ~~Done 2026-10-24~~ A Table view switch in the menu, off by default and remembered. Done when
     a unit test finds it off, taps it on and finds it on after a reload.
  2. ~~Done 2026-10-24~~ While it is on, a roll shows the total huge in the dice area with its
     math under it, the dice as small tiles, and an upside-down copy at the
     top; the Roll button keeps rolling. Done when a unit test rolls with it
     on and finds the big total, the math and the flipped copy, and a
     phone-size browser check shows it.
  3. ~~Done 2026-10-24~~ Tapping the big number shows the dice again, and the next roll shows it
     big once more. Done when a unit test taps the number and finds the dice.
  4. ~~Done 2026-10-24~~ A 6 or a 9 shown on its own (big total or small tile) is underlined, so
     the flipped copy reads right. Done when a unit test finds 6 and 9
     underlined and 8 not.

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

- ~~Done 2026-10-24~~ Fixes from the 2026-10-24 on-the-go review
  (reviews/2026-10-24-stories.md): the light theme's Clear All is readable
  (it showed the dark theme's pale pink at 1.3:1), shake to roll waits while
  any dialog or the menu is open, and plain messages are spoken to screen
  readers. Done when a theme contrast test covers every theme and unit tests
  shake under Save and Dice settings without a roll.
- Code health: move the remembered settings and the backup out of App.tsx
  (reviews/2026-10-24-code-health.md). One shared remembered-setting piece
  with the storage guard in one place, and a backup module with a round-trip
  test. Nothing on screen changes. Done when App.tsx has no direct storage
  calls for settings, a backup exported and imported in a test comes back
  the same, and a full storage shows a message instead of a blank screen.

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
- Fixes from the 2026-10-26 review (reviews/2026-10-26-access.md):
  screen readers reach each die's buttons, states are spoken, Escape closes
  the menu, the bottom buttons stop overlapping below 380 px wide, and high
  contrast draws edges. Done when unit tests find each die's named buttons
  and Escape closing the menu, and a 320 px browser check shows no overlap.
  ~~Done 2026-10-26~~
- At 200% zoom (about 195 px wide) the bottom buttons still overlap: give
  them one row that fits, for example the menu and Hold All side by side
  above Add and Roll. Done when a 195 px browser check shows no overlap.
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
- ~~Done 2026-10-28~~ The faces counter warns that it will replace your custom faces (Daren
  2026-10-28, Build): "Dice settings: the faces counter's label names the
  custom faces it would replace; No new control or behaviour". Wording only.
  1. ~~Done 2026-10-28~~ When a die has custom faces, the Standard Faces label adds "Replaces your
     N custom faces". Done when a component test reads it (and the singular),
     a plain die shows no note, and a 390 px check shows it wrapping cleanly.

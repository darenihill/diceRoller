Changed: yes

Done in this pull request: Set A is built (the three missing colour tokens, the main-screen left edge, off-scale text, one section rhythm). Sets B and C are GOAL.md Next items, built once pull requests 44 and 47 land. The three design tweaks are on the Decision Desk. Screenshots are on the Desk cards.

# Type and spacing check (polish-ui-type-spacing), 2026-10-28

Question: are the text sizes, spacing and left edges even across screens, and
does each screen have one clear most-important thing?

Checked on master (after pull request 28) at 390x844 with touch and at
1280x800, in the built app. Every screen in the list was opened by tapping
through the real app, with three rolls made first so History and Usage Stats
have content. Sizes and gaps below are what the browser actually drew
(computed styles and measured boxes), not what the CSS files say.

Before shots: `type/before-<screen>.png` (phone) and
`type/before-<screen>-desktop.png`. After shots of both fix sets applied
locally: `type/after-<screen>.png` (they also show a trial 22 px dialog title
that is *not* proposed, see "Left alone").

What it is measured against: `DESIGN.md` is a DRAFT and has no type scale or
spacing scale yet (its own Known drift says so). Where it is silent, the hub
rule says the base system wins, so sizes are checked against the Material 3
type scale (11, 12, 14, 16, 22, 24 …; weights 400/500, plus the 700 this app
loads) and spacing against the Material 3 4 px grid, with 8/12/16/24 as the
steps the app already uses most.

## Summary

| | Count |
|---|---|
| Distinct text sizes in use | 13 (9, 11, 12, 13, 14, 15, 16, 18, 20, 24, 30, plus dice faces and the PR 24 table view) |
| Off the Material 3 scale | 9, 13, 15, 18, 20 (and weights 600, 800, which the app does not load) |
| Colour tokens used but never defined | 3: `on-surface-variant` (8 uses), `outline`, `outline-variant` |
| Gap under a section heading | 5 different values for the same heading: 8, 12, 16, 24, 28 |
| Gap above a section heading | 16 in two dialogs, 48 in two others |
| Left edges on the main screen | 2: top line at 40 px, bottom buttons at 24 px |
| Section heading styles | 2: blue 16/700 in Dice settings, white 16/600 everywhere else |

Biggest single cause: three colour tokens the dialogs use were never
defined. So every "secondary" line (setting descriptions, Help text, stat
labels, the empty-screen title) draws in the full-strength text colour, and
the divider line above every second section never draws at all. That flattens
the hierarchy on every dialog at once.

## Findings per screen

### Main screen (normal)
- Sizes: app name 16/500, Roll total 30/500, dice faces about 169 px.
- Left edges: "Dice Roller" at 40 px; the menu, Hold all and + buttons at
  24 px. The top line adds its own 16 px on top of the page's 24 px. **Fix 2.**
- One most-important thing: the Roll button with the total. Clear.
- Computer (1280): same 40 vs 24 px split.

### Main screen (RPG mode)
- Sizes: ADV/NORM/DIS 15/700 (off scale), typed-roll box 16, its Roll button 14/500.
- Left edges: typed-roll box at 40 px (its own 16 px padding), bottom
  buttons at 24 px; its Roll button ends 18 px short of the big Roll
  button's right edge. **Fix 2.**
- One most-important thing: not clear. Three filled blue controls (typed
  Roll, chosen NORM, big Roll). **Design tweak, idea 2.**

### Menu
- Phone: tile labels are **9 px**, below the smallest Material 3 size (11).
  Clear All is 12. Group names App/Saves/Tools are hidden, so the 11 tiles
  run in rows of four and History lands in the Saves row with an empty slot
  after RPG Mode. Pull request 44 turns 9 px into 0.5625 rem, which is still
  9 px at the default text size. **Fix 6 (after 44)**; grouping is **idea 1.**
- Computer: labels 13/500 (off scale), group names 11/600; grid gap 10 px,
  column gap 6 px, tile padding 10/12 px: three different spacings in one card.
  **Fix 6.**
- Menu card left edge at 16 px on a phone vs 24 px for the button under it:
  left as is (the card is wider on purpose).
- One most-important thing: none needed (it is a list of places). The only
  coloured item is Clear All in red, which is right for a destructive action.

### Dice settings
- Sizes: title 20/500, section titles 16/700 **blue**, labels 14, small
  labels 12, number box 15/600 (off scale), face tiles 16/600.
- Same heading role, two styles: "General Settings" and "Custom Faces" are
  blue and bold; every other dialog's section headings are white. **Fix 5.**
- "Base Color" wraps to two lines, which pushes the colour button 16 px
  lower than the − 6 + steppers beside it. **Fix 3.**
- Spacing: 6 and 10 px gaps in the face cards, the icon grid and the
  picture button (on a 4/8 grid these would be 8). **Fix 7 (after 47).**
- Content sits at 80 px (dialog 24 + card 16) while the title is at 64: fine,
  that is the card inset.
- One most-important thing: the faces list. OK.

### Customize
- Sizes: title 20/500, section headings 16/600 (drawn as 700), row titles
  **15/600**, descriptions **13/400**, theme cards 16/500.
- Row titles at 15/600 are almost as heavy as the section heading at 16/700,
  and the descriptions are the same colour as the titles (undefined token).
  "Preferences" and "Dice Size" read as the same level. **Fixes 1 and 5.**
- Gap under "Visual Themes": 28 px (heading margin 12 + the column's 16).
  Gap under "Preferences": 24 px. No divider shows between the two sections.
  **Fixes 1 and 4.**
- Compared with iOS Settings and Material 3 lists: one row label size, a
  lighter, smaller second line, and a clear section header with a gap above
  it. Customize has all three parts, but they come out nearly the same weight
  and colour.
- One most-important thing: the theme cards. OK.

### Help
- Sizes: 14/400 and 14/700 only, line height 1.6. Good.
- Spacing: the intro paragraph keeps the browser's 14 px top and bottom
  margins on top of the 16 px column gap, so 30 px sits under the intro and
  14 px above it; list items are 10 px apart. **Fix 8 (after 44).**
- A second, unused copy of the Help list style (`.helpList`, 20 px indent, 12
  px between items) still sits in `App.module.css`. **Fix 4 removes it.**
- One most-important thing: none needed (reading page).

### History
- Sizes: title 20, headings 16/600, "Roll 3" 16/500 blue, details **14 px
  monospace**, totals 16/700, the frequency chart 13/700, HIT 12.
- The roll details use the browser's monospace font, the only place outside
  Roboto; at 390 px "d6 #1: 2, d6 #2: 3" breaks over two lines in every row.
  **Fix 3.**
- "Roll Log" is a second section but uses the first-section heading with
  margin 0, so it has no divider and sits 16 px under the chart; the other
  dialogs separate sections with 48 px and a line. **Fix 4.**
- Chart rows: gap 10 px, text 13 px. **Fix 6 (after 44).**
- One most-important thing: the Luck Meter chart sits on top; fine.

### Games
- Sizes: title 20, headings 16/600, cards 16/500. Even.
- Gaps: a Games-only override sets every heading to 0 above and 16 below,
  so "Backup" sits 16 px under the last preset (48 px in Customize and Usage
  Stats) and heading-to-cards is 16 (12 in the others). **Fix 4.**
- One most-important thing: Your saves first, then presets. OK.

### Usage Stats
- Sizes: title 20, headings 16/600, numbers 24/700, number labels 12/500
  uppercase, rows 14, footnote 13 (off scale).
- Gap under "Your Dice, By The Numbers" 12 px; under "History" 8 px; above
  "History" 48 px (16 column gap + 16 margin + 16 padding). **Fix 4.**
- Number cards stack one per row on a phone (130 px minimum, 262 px space),
  so History starts below the bottom of the dialog. **Design tweak, idea 3.**
- One most-important thing: the big numbers. OK.

### Empty screen
- Sizes: "No dice yet" **18/600** (off scale), buttons 14/500.
- One most-important thing: Add die, filled. Clear. But the big Roll button
  at the bottom is also filled and still shows the last total (8) with no
  dice on screen, so two filled buttons compete. Noted for whoever owns "The
  Roll button's old total fades once you change the dice", which looks like
  it doesn't cover Clear All. Not a type or spacing fix.
- Title fix: **Fix 3** (22/400, Material 3 title large).

## Comparisons (one flow at a time)

| Flow | Compared with | What they do | Dice Roller today |
|---|---|---|---|
| Settings sheet (Customize) | iOS Settings; Material 3 lists | Section header, then rows with one label size and a smaller, lighter second line | Row titles 15/600 almost as heavy as the 16/700 header; second line same colour as the title |
| Dialog sections | Material 3 dialog spec | 24 px padding; sections split by a divider; one heading style | Padding 24 ✓; divider never draws; two heading styles; five different gaps under a heading |
| Field help text (Target Highlight, typed roll) | Material 3 text field spec | Supporting text in body small, 12 px, 4 px under the field | 13 px, 6 px under |
| Menu groups | Material 3 navigation drawer | Items grouped under small section headers | Computer: yes; phone: headers hidden |
| Main action | Material 3 buttons | One filled button for the main action | Normal mode ✓; RPG mode has three filled controls |

Sources:
- Material 3 type scale: https://m3.material.io/styles/typography/type-scale-tokens
- Material 3 spacing (4 px grid): https://m3.material.io/foundations/layout/understanding-layout/spacing
- Material 3 dialogs, specs: https://m3.material.io/components/dialogs/specs
- Material 3 lists, specs: https://m3.material.io/components/lists/specs
- Material 3 text fields, specs: https://m3.material.io/components/text-fields/specs
- Material 3 navigation drawer: https://m3.material.io/components/navigation-drawer/guidelines
- Material 3 buttons: https://m3.material.io/components/buttons/guidelines
- Apple, lists and tables (iOS Settings style): https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
- Apple, layout: https://developer.apple.com/design/human-interface-guidelines/layout

## How the fixes fit around open pull requests

| Pull request | Touches | This check |
|---|---|---|
| 44 (menu/dialog text sizes to rem) | every `font-size` line in Modal, Modals, SidebarMenu, DiceSettingsModal CSS, HelpModal and HistoryModal | Size and weight fixes on those lines wait for it (Set B), written against its rem values |
| 47 (Dice settings sticky footer, dialog X, Clear All, slider) | DiceSettingsModal CSS from line 161, Modals line 219, ActionBar CSS 115–155, Modal.tsx X, CustomizeModal 95–110, index.css line 1 and 92 | Set A stays clear of all of these; Set C waits for it |
| 35 (focus ring) | index.css after line 101, CustomizeModal 53/61/69/77 | Set A changes CustomizeModal line 48 and index.css lines 13–78 only: no overlap |
| 24 (big table view) | App.module.css end, App.tsx, SidebarMenu.tsx, new TableView CSS | No overlap. Its new `TableView.module.css` uses 13 and 18 px; worth 12 and 16 when it lands |

Set A was applied on a scratch copy of master: all 120 tests pass and lint is clean.

## Set A: build now (no open pull request touches these lines)

1. **Define the three missing colour tokens** (`src/index.css:15`, `:49`,
   `:64`, `:77`). Secondary text gets its lighter colour back and section
   dividers draw. Material 3 baseline values for dark and light; matched
   tints for Felt and Midnight.
2. **One left edge on the main screen**: top line and typed-roll box drop
   their extra 16 px, so they line up with the bottom buttons at 24 px
   (`src/App.module.css:241`, `src/components/TypeRollBox.module.css:6`).
3. **Off-scale text that no PR touches**: History details lose monospace
   (`App.module.css:54`); "No dice yet" 18/600 → 22/400
   (`App.module.css:216-217`); ADV/NORM/DIS 15/700 → 14/500
   (`ActionBar.module.css:79-80`); Add-menu d20 button 15/800 → 14/700
   (`ActionBar.module.css:172-173`); typed-roll error 13 → 12
   (`TypeRollBox.module.css:47`); Base Color button level with the steppers
   (`DiceSettingsModal.module.css:54`).
4. **One section rhythm in every dialog**: 12 px under a heading; 16 px, a
   divider, 16 px above a later one. Removes the Games-only heading override
   (`App.module.css:63-66`) and the unused `.helpList` copy
   (`App.module.css:23-30`); Customize's outer column stops adding its own
   16 px (`CustomizeModal.tsx:48`); Roll Log gets the divider row
   (`HistoryModal.tsx:72`, new `.sectionHeaderRow`); a heading that opens its
   own block drops its top margin (`Modals.module.css`, new rule after line 15).

```diff
--- a/src/index.css
+++ b/src/index.css
@@ -13,6 +13,10 @@
   --md-sys-color-on-primary-container: #C2E7FF;
   --md-sys-color-error: #F2B8B5;
   --md-sys-color-on-error: #601410;
+  /* Secondary text and dividers: used across the dialogs, never defined until now */
+  --md-sys-color-on-surface-variant: #C4C7C5;
+  --md-sys-color-outline: #8E918F;
+  --md-sys-color-outline-variant: #444746;
   
   --elevation-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
@@ -47,6 +51,9 @@ body.theme-light {
   --md-sys-color-primary-container: #D7E3FF;
   --md-sys-color-on-primary-container: #001B3F;
+  --md-sys-color-on-surface-variant: #444746;
+  --md-sys-color-outline: #747775;
+  --md-sys-color-outline-variant: #C4C7C5;
 }
@@ -62,6 +69,9 @@ body.theme-felt {
   --md-sys-color-primary-container: #EFE6D2;
   --md-sys-color-on-primary-container: #13382D;
+  --md-sys-color-on-surface-variant: #D3E4DC;
+  --md-sys-color-outline: #8FA89E;
+  --md-sys-color-outline-variant: #2F5A4C;
 }
@@ -75,6 +85,9 @@ body.theme-midnight {
   --md-sys-color-primary-container: #262D6E;
   --md-sys-color-on-primary-container: #DFE0FF;
+  --md-sys-color-on-surface-variant: #C5C6DD;
+  --md-sys-color-outline: #8E90A8;
+  --md-sys-color-outline-variant: #2E3450;
 }
--- a/src/App.module.css
+++ b/src/App.module.css
@@ -20,15 +20,6 @@
   padding: 16px;
 }
 
-.helpList {
-  padding-left: 20px;
-  line-height: 1.6;
-}
-
-.helpList li {
-  margin-bottom: 12px;
-}
-
 .historyList {
@@ -51,8 +42,8 @@
 .historyDetails {
-  font-family: monospace;
   font-size: 14px;
+  font-variant-numeric: tabular-nums;
 }
@@ -60,11 +51,6 @@
-.setsContainer h3 {
-  margin-top: 0;
-  margin-bottom: 16px;
-}
-
 .setsGrid {
@@ -213,8 +199,8 @@
 .emptyTitle {
   margin: 0;
-  font-size: 18px;
-  font-weight: 600;
+  font-size: 22px;
+  font-weight: 400;
   color: var(--md-sys-color-on-surface-variant);
 }
@@ -238,7 +224,7 @@
   gap: 12px;
   min-height: 32px;
-  padding: 0 16px;
+  padding: 0;
   flex-shrink: 0;
--- a/src/components/TypeRollBox.module.css
+++ b/src/components/TypeRollBox.module.css
@@ -3,7 +3,7 @@
   max-width: 480px;
   margin: 8px auto 0;
-  padding: 0 16px;
+  padding: 0;
 }
@@ -44,7 +44,7 @@
 .note {
   margin: 4px 0 0;
   min-height: 0;
-  font-size: 13px;
+  font-size: 12px;
--- a/src/components/ActionBar.module.css
+++ b/src/components/ActionBar.module.css
@@ -76,8 +76,8 @@
   justify-content: center;
-  font-size: 15px;
-  font-weight: 700;
+  font-size: 14px;
+  font-weight: 500;
   border-radius: 50%;
@@ -169,8 +169,8 @@
   padding: 12px 8px;
-  font-size: 15px;
-  font-weight: 800;
+  font-size: 14px;
+  font-weight: 700;
--- a/src/components/DiceSettingsModal.module.css
+++ b/src/components/DiceSettingsModal.module.css
@@ -52,6 +52,8 @@
   grid-template-columns: 1fr 1fr;
   gap: 16px;
+  /* A label that wraps (Base Color) keeps its button level with the steppers */
+  align-items: end;
 }
--- a/src/components/modals/CustomizeModal.tsx
+++ b/src/components/modals/CustomizeModal.tsx
@@ -47,7 +47,7 @@
     <Modal isOpen={isOpen} onClose={onClose} title="Customize App">
-      <div className={modalStyles.formGroup}>
+      <div>
         <h3 className={modalStyles.sectionHeaderFirst}>Visual Themes</h3>
--- a/src/components/modals/HistoryModal.tsx
+++ b/src/components/modals/HistoryModal.tsx
@@ -71,7 +71,7 @@
           <div className={styles.historyList}>
-            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+            <div className={modalStyles.sectionHeaderRow}>
               <h3 className={modalStyles.sectionHeaderFirst} style={{ margin: 0 }}>Roll Log ({rollHistory.length})</h3>
--- a/src/components/modals/Modals.module.css
+++ b/src/components/modals/Modals.module.css
@@ -14,6 +14,21 @@
   border-top: none;
 }
 
+/* A section heading with an action beside it (Roll Log + Clear History) */
+.sectionHeaderRow {
+  display: flex;
+  justify-content: space-between;
+  align-items: center;
+  border-top: 1px solid var(--md-sys-color-outline-variant);
+  padding-top: 16px;
+}
+
+/* In a column that already spaces its sections, a heading that starts its
+   section needs no top margin of its own (Usage Stats) */
+.sectionHeader:first-child {
+  margin-top: 0;
+}
+
 .formGroup {
```

The full patch is saved as `type/fix-now.patch` (applies cleanly to master).

## Set B: build after pull request 44 lands

Same lines as 44, so written against its rem values. Line numbers are
master's (44 keeps them, except SidebarMenu, where it adds lines from 31).

5. **One section heading style, on the scale.** Weights 600 → 700 (the app
   loads 400/500/700, so 600 is drawn as 700 already: no visible change);
   heading → content 8 → 12; Dice settings headings white like the rest.
   Row titles 15/600 → 16/400 and descriptions 13 → 14 (Material 3 list
   label and supporting text); field notes 13 → 12 with 4 px above
   (Material 3 field supporting text).
6. **Menu and chart text on the scale.** Phone tile labels 9 → 12 px;
   computer labels 13 → 14; group names 600 → 500; menu gaps 10/6 → 8 and
   tile padding 10/12 → 12; History chart rows 13 → 12, gap 10 → 8.
8. **Help spacing.** Intro paragraph margin 0; list gap 10 → 12.

```diff
--- a/src/components/modals/Modals.module.css   (lines 1-14, 54-56, 84-89, 164-168)
 .sectionHeader {
-  margin: 16px 0 8px 0;
+  margin: 16px 0 12px 0;
   font-size: 1rem;
-  font-weight: 600;
+  font-weight: 700;
 ...
 .sectionHeaderFirst {
   margin: 0 0 12px 0;
   font-size: 1rem;
-  font-weight: 600;
+  font-weight: 700;
 ...
 .fieldNote {
-  margin: 6px 0 0;
-  font-size: 0.8125rem;
+  margin: 4px 0 0;
+  font-size: 0.75rem;
 ...
 .toggleTitle {
-  font-weight: 600;
-  font-size: 0.9375rem;
+  font-weight: 400;
+  font-size: 1rem;
 }
 .toggleDesc {
-  font-size: 0.8125rem;
+  font-size: 0.875rem;
 ...
 .freqRow {
   display: flex;
   align-items: center;
-  gap: 10px;
-  font-size: 0.8125rem;
+  gap: 8px;
+  font-size: 0.75rem;
 }
--- a/src/components/DiceSettingsModal.module.css   (lines 15-19, 102-103, 247)
 .sectionTitle {
-  margin: 0 0 16px 0;
+  margin: 0 0 12px 0;
   font-size: 1rem;
-  color: var(--md-sys-color-primary);
+  font-weight: 700;
+  color: var(--md-sys-color-on-surface);
 }
 ...
 .stepperInput {
-  font-size: 0.9375rem;
-  font-weight: 600;
+  font-size: 1rem;
+  font-weight: 500;
 ...
 .pictureError {
-  font-size: 0.8125rem;
+  font-size: 0.75rem;
--- a/src/components/SidebarMenu.module.css   (master lines 32, 43, 47, 64, 77, 123)
 .menu {
   grid-template-columns: repeat(3, minmax(0, 1fr));
-  gap: 10px;
+  gap: 8px;
 .menuItem {
-  padding: 10px 12px;
+  padding: 12px;
 ...
-  font-size: 0.8125rem;
+  font-size: 0.875rem;
 .menuColumn {
-  gap: 6px;
+  gap: 8px;
 .menuColumnHeader {
   font-size: 0.6875rem;
-  font-weight: 600;
+  font-weight: 500;
 @media (max-width: 468px) .menuItem span {
-    font-size: 0.5625rem;
+    font-size: 0.75rem;
--- a/src/components/modals/HelpModal.tsx   (lines 13-14)
-        <p>Welcome to <strong>Dice Roller</strong>! ...
+        <p style={{ margin: 0 }}>Welcome to <strong>Dice Roller</strong>! ...
-        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
+        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
```

Checked locally in px form: at 390 px "Usage Stats" wraps to two lines in its
tile at 12 px, which 44's `overflow-wrap` handles; nothing else wraps.

## Set C: build after pull request 47 lands

7. **Dice settings 6/10 px gaps onto the 4/8 grid** (47 rewrites the sticky
   colour bar at lines 161-163 with the same 10 px values, so do these in one
   pass after it):

```diff
--- a/src/components/DiceSettingsModal.module.css
 .faceCard {            /* line 125-127 */
-  gap: 6px;
+  gap: 8px;
-  padding: 10px;
+  padding: 8px;
 .faceTile {            /* line 144 */
-  padding: 4px 10px;
+  padding: 4px 8px;
 (sticky colour bar)    /* lines 161-163, as 47 leaves them */
-  gap: 6px;
-  margin: 10px -10px 12px;
-  padding: 10px;
+  gap: 8px;
+  margin: 8px -8px 12px;
+  padding: 8px;
 .addPictureBtn {       /* line 241 */
-  gap: 6px;
+  gap: 8px;
 .iconGrid {            /* line 287 */
-  gap: 6px;
+  gap: 8px;
```

## Design tweaks (Desk cards, see ideas.json)

1. Phone menu keeps its App, Saves and Tools groups (layout).
2. In RPG Mode, the big Roll button is the only filled one (look).
3. Usage Stats shows two numbers per row on a phone (layout).

None of these repeat a Desk item (checked against building, iced, dismissed
and open items in `review28/desk-suggestions.json`).

## Left alone

- **Dialog titles at 20/500.** Not on the Material 3 scale (dialog headline
  is 24/400; title large is 22). A trial at 22/400 wrapped "Roll History &
  Frequency" onto two lines. Better settled when DESIGN.md gets a type scale
  (below), together with shorter dialog names.
- **Dice faces, Roll total (30 px) and the table view's huge numbers.** Display
  sizes on purpose.
- **Usage Stats footnote at 13 px.** It uses the description style, so Set B's
  change to 14 covers it.

## For DESIGN.md (owner ratifies; not edited here)

DESIGN.md §1 says "no named type styles" and "no spacing scale". After these
fixes the app uses exactly: 11/500, 12/400–500, 14/400–500, 16/400–700,
22/400, 24/700 (stat numbers), 30 (Roll total), and spacing 4/8/12/16/24.
Recording those two lines in §1 would let the next check flag drift
mechanically instead of by eye.

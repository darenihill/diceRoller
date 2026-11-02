Changed: yes

Done in this pull request: all eight changes below are built (fixes 1 to 3, standards 4 to 8). The two ideas and the view on the thumb-sized buttons card are on the Decision Desk.

# On the go: one hand, bright sun, gloves or wet hands, weak signal (2026-10-28)

Master at the merge of pull request 28, built and served with `vite preview`.
Playwright Chromium at 390×844 with touch. Weak signal: CDP
`Network.emulateNetworkConditions` at 400 ms latency and 50 kB/s. The service
worker skips `localhost`, so the offline runs were served at 127.0.0.2. The
fixes were tried in a throwaway worktree and measured there, then reverted;
nothing was committed. Unit tests passed with them (120 of 120).

Already covered, so not reported again: the open pull requests (39–46, 24–26,
30–38), the Desk card about thumb-sized buttons round a tapped die (now in
Discuss), and the Desk items being built: the Undo bar moving to the bottom
and the app opening in 3 seconds on a weak signal.

## What fails

| # | Condition | What happens | Measured | Kind |
|---|---|---|---|---|
| 1 | One hand, RPG mode | The Add D&D die card opens off the left edge of the screen. Its title is cut off and the D10, D6, D4 and D20 buttons start at x = −3 | Card from x −15 to 195; option buttons 38 px tall with 6 px gaps | (a) fix |
| 2 | Weak or stuck signal, first visit | The Roboto font stylesheet is an `@import` inside the app's CSS, so nothing paints until Google Fonts answers. If it hangs (captive Wi-Fi, a blocked font server), the screen stays blank | Font server in 5 s: Roll shows at 6.3 s. Never answers: no paint in 45 s. With the fix, 3.8 s either way | (a) fix |
| 3 | Offline, after one visit | Open once at home, then offline at the table: you get an unstyled About text and no dice. The service worker caches only the page shell. The hashed script and CSS are cached on the second visit, not the first | Caches after one visit: `/`, `/index.html`, icons, manifest; no `/assets/*`. Offline reload: `#root` empty | (a) fix |
| 4 | Bright sun | The hint text in the Type a roll box (and every other text box) uses the browser's default grey | Felt 2.09:1, dark 4.07:1, midnight 4.27:1 (needs 4.5). With the fix: 5.7 to 8.4:1 | (b) standard 9 |
| 5 | Gloves, one hand | Every dialog's close X is 40×40 at the top right (y 116) | 40 px, under the 48 px rule. Tapping the dimmed area also closes, so one hand still has a way out | (b) standard 9 |
| 6 | Gloves, wet hands | The Dice size slider in Customize is a 16 px tall track with no − or + buttons. A gloved thumb can't land on 0.1 steps | Track 153×16 | (b) standard 10 |
| 7 | Gloves | Clear All in the menu is 38 px tall, with 12 px words in red | 318×38 | (b) standard 9 |
| 8 | One hand, Dice settings | Done, Clone and Remove sit at the end of the scroll, below the visible dialog. Template chips are 32 px tall and the icon buttons 33 px with 6 px gaps | Done at y 827, while the dialog ends at 760 | (b) standard 20.2 |
| 9 | Bright sun | The round bottom buttons (menu, Hold all, Add, ±, ADV/NORM/DIS) are grey circles on a near-black page. The icons read, but the button shapes vanish in glare | Button edge against the page: 1.36 (dark), 1.30 (light), 1.52 (felt), 1.23 (midnight). Icons 10.7 to 14.6:1 | (c) card |
| 10 | Gloves, many dice | Your view on the "buttons round a tapped die" card is below | 32 px with six RPG dice | Desk discussion |

What held up: Roll (156×72), Hold all, Add and the menu all sit in the bottom
third (y 660 to 820). ADV, NORM, DIS and ± are 72 px with 8 px gaps. The die
numbers are 18:1 or better on dark dice. A second visit works offline, and so do
landing pages and share links.

Screenshots in `shots/`: go-1 and go-1-after (Add D&D die card), go-2 (timing
chart) and go-2-after (stuck font server, app shown), go-3 and go-3-after
(offline after one visit), go-4 and go-4-after (felt hint text), go-5 (close
X), go-6 (slider), go-7 and go-7-after (Clear All), go-8 and go-8-after (Dice
settings Done), go-9 (round buttons in the dark theme), go-10 (six RPG dice,
die tapped).

## Fixes (a) and standards gaps (b), exact changes

### 1. Add D&D die card off screen (a)
`src/components/ActionBar.module.css:118` and `:150`
```diff
 .addPopover {
   position: absolute;
   bottom: 84px;
-  right: 0;
-  left: auto;
+  /* Open rightward from the + button: anchored right, the 210px card ran
+     15px off the left edge of a 390px phone. */
+  left: 0;
+  right: auto;
@@ .dndOptionBtn {
   border-radius: var(--shape-small);
+  min-height: 44px;
   padding: 10px 8px;
```
Checked: the card spans 135 to 345 at 390 px, 92 to 302 at 360, 52 to 262 at
320 and 1012 to 1222 at 1280. Buttons are now 44 px.

### 2. Font stylesheet holds up the first paint (a)
`src/index.css:1`: delete the line
```diff
-@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
```
`index.html:26`: add after the apple-touch-icon link
```diff
     <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
+    <!-- Roboto loads without holding up the first paint: on a slow or stuck
+         signal the app shows in the system font, then swaps. -->
+    <link rel="preconnect" href="https://fonts.googleapis.com" />
+    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
+    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" media="print" onload="this.media='all'" />
```
Then run `npm run landing` so the four landing pages get the same head. That
also updates the sitemap's lastmod.
This is separate from the Desk's "opens in 3 seconds" item, which covers the
service worker waiting on the network for a returning visitor. A first visit
has no service worker yet, so that fix can't reach this one.

### 3. Offline after one visit (a)
`public/sw.js:1`, `:14`, `:81`
```diff
-const CACHE_NAME = 'diceroller-v2';
+const CACHE_NAME = 'diceroller-v3';
@@ install
-      return cache.addAll(ASSETS_TO_CACHE);
+      return cache.addAll(ASSETS_TO_CACHE).then(() =>
+        // The app's own script and styles have hashed names, so read them off
+        // the page: without them a first-visit-then-offline open is blank.
+        fetch('/index.html').then((r) => r.text()).then((html) => {
+          const built = [...new Set(html.match(/\/assets\/[\w.-]+\.(?:js|css)/g) || [])];
+          return cache.addAll(built);
+        })
+      );
@@ fetch
-      return cache.match(e.request).then((cachedResponse) => {
+      // ignoreVary: hashed files never change, and a server that adds "Vary: Origin"
+      // would otherwise hide the copy saved at install from the page's module request
+      return cache.match(e.request, { ignoreVary: true }).then((cachedResponse) => {
```
Checked: after one visit the cache holds both `/assets/` files, and an offline
reload shows the dice and Roll. The live site sends `Vary: Accept-Encoding`.
`vite preview` sends `Vary: Origin`, which hid the cached copy until
`ignoreVary` went in. Note that pull request 34 edits the line just below the
fetch change (its offline fallback), so whichever lands second needs a small
merge.

### 4. Hint text too faint in sun (b, standard 9)
`src/index.css:95`, before `button {`
```diff
+/* Hint text readable in sun on every theme (browser grey was 2.1:1 on felt) */
+input::placeholder,
+textarea::placeholder {
+  color: var(--md-sys-color-on-surface);
+  opacity: 0.7;
+}
+
 button {
```
After: dark 7.5:1, light 6.4, felt 5.7, midnight 8.4. Inside dialogs, 6.1 to 7.9.

### 5. Dialog close X 40 px (b, standard 9)
`src/components/Modal.tsx:90`
```diff
-<button className="md-icon-button" onClick={onClose} aria-label="Close dialog" style={{ width: 40, height: 40 }}>
+<button className="md-icon-button" onClick={onClose} aria-label="Close dialog" style={{ width: 48, height: 48 }}>
```

### 6. Dice size slider has no − and + (b, standard 10)
`src/components/modals/CustomizeModal.tsx:3` and `:97-111`
```diff
-import { Volume2, VolumeX, BarChart2, Smartphone } from 'lucide-react';
+import { Volume2, VolumeX, BarChart2, Smartphone, Minus, Plus } from 'lucide-react';
@@
             <div className={modalStyles.sliderRow}>
-              <span className={modalStyles.toggleDesc} aria-hidden="true">Smaller</span>
+              <button type="button" className="md-icon-button" aria-label="Smaller dice"
+                disabled={diceScale <= DICE_SCALE_MIN}
+                onClick={() => onChangeDiceScale(Math.max(DICE_SCALE_MIN, Math.round((diceScale - 0.1) * 10) / 10))}>
+                <Minus size={20} />
+              </button>
               <input type="range" … />
-              <span className={modalStyles.toggleDesc} aria-hidden="true">Bigger</span>
+              <button type="button" className="md-icon-button" aria-label="Bigger dice"
+                disabled={diceScale >= DICE_SCALE_MAX}
+                onClick={() => onChangeDiceScale(Math.min(DICE_SCALE_MAX, Math.round((diceScale + 0.1) * 10) / 10))}>
+                <Plus size={20} />
+              </button>
             </div>
```
`src/components/modals/Modals.module.css:216`: give the track a thumb-sized hit area
```diff
 .slider {
   flex: 1;
   min-width: 0;
+  min-height: 44px;
   accent-color: var(--md-sys-color-primary);
 }
```
This one wasn't run in the browser; it reuses the existing `md-icon-button`
(48 px).

### 7. Clear All 38 px (b, standard 9)
`src/components/SidebarMenu.module.css:135`
```diff
     gap: 8px;
+    min-height: 48px;
     padding: 10px;
```

### 8. Dice settings: Done scrolls out of view (b, standard 20.2)
`src/components/DiceSettingsModal.module.css:317`
```diff
 .footerActions {
   display: flex;
   gap: 8px;
   margin-top: 8px;
+  /* Done stays on screen while the faces scroll (standard 20.2) */
+  position: sticky;
+  bottom: 0;
+  z-index: 1;
+  padding: 8px 0;
+  background-color: var(--md-sys-color-surface);
 }
```
Checked: Done sits at y 672 without scrolling (it was at 827, off the dialog).
The 32 px chips and 33 px icon buttons in the same dialog are left as they
are. They are secondary, and pull request 32 already names the icon buttons.

## Standards applied
- Accessibility | Main screen, Type a roll box | Before: hint text 2.1:1 on felt | After: 5.7:1 or more on every theme
- Accessibility | Every dialog | Before: close X 40 px | After: 48 px
- Accessibility | Menu | Before: Clear All 38 px tall | After: 48 px
- Precise input | Customize, Dice size | Before: 16 px slider only | After: − and + buttons beside it
- Text input and the keyboard | Dice settings | Before: Done hidden below the scroll | After: Done, Clone and Remove pinned at the bottom

## Design tweak and idea (to the Desk as cards)

- **(c) Round buttons get a visible edge in sun.** A 1.5 px ring in the
  theme's outline colour round each bottom button, so you can see where to
  press in glare. Edges today are 1.2 to 1.5:1. go-9.
- **(d) A buzz when the dice land, even with sound off.** Today the phone only
  buzzes when sound effects are on, and only if audio starts. Outdoors or in a
  loud room you'd feel the result land. Works on Android; iPhone browsers don't
  allow it.

## View on the Desk card "Buttons round a tapped die stay thumb-sized"

Daren's note ("maybe below a certain size the options pop out") is the better
fix. With six RPG dice, 44 px buttons overlap the next die, and the remove X
lands at the top left of the die, at the top of the screen. Suggestion: when
the dice are smaller than about 150 px, the tapped die's Roll this die, Clone,
Settings and Remove buttons show as one row of 48 px buttons in a strip just
above the bottom bar, labelled with the die's name. The die itself stays
plain. That fixes size and thumb reach together, and with two or three big
dice nothing changes. Effort M. go-10 shows today's 32 px ring.

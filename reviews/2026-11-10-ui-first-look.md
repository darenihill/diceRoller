Changed: no

# First five seconds (2026-11-10)

Polish lens ui-first-look. This pass looked at the opening screen for a first
visit at 390 × 844 (phone) and 1280 × 800 (desktop), with no saved data.
Screenshots of the screen today are in the project files, under
dice-roller/2026-11-10/first-look/ (before-phone.png and before-desktop.png).

## What a new person sees

- The words "Dice Roller" at the top left, and an About link (on phones, only
  its ⓘ icon shows).
- Two large dice, both showing 1.
- Three buttons along the bottom: the menu (☰), Add (+), and a filled Roll
  button that carries a dice icon and the word "Roll".

## Would they know what it's for and what to tap first?

Yes, on both what it's for and what to tap first.

- **What it's for.** The name and the two dice say "dice roller" before
  anything is read.
- **What to tap first.** Roll is the only filled button. It sits where the
  thumb rests, and it says what it does in a word, not only an icon.

Compared with the same first screen in other apps:

- Google Search's dice roller shows the die and one "Roll" button.
- Apple Clock's Timer opens on its picker and one Start button.
- Material 3 guidance asks for one primary action per screen.

Dice Roller already does all three.

## Where it falls short

- **Nothing on screen says a die can be tapped.** Tapping a die is how you
  hold it, set it up or remove it, and only Help says so. This gap is already
  on the Focus tab as the idea "First visit: a line above the dice says 'Tap a
  die to Hold, set it up or Remove it'" (added 2026-11-08). Fixing it means a
  new line on screen, which counts as a feature, so it stays an idea and isn't
  built here.
- **On phones the About link is an icon only.** It isn't the first thing
  anyone needs, the icon has the accessible name "About", and the trim pass
  (release 96) keeps labels short. Left as it is.

## Design tweaks built

None. The first screen does its job, and the one gap is already an idea.

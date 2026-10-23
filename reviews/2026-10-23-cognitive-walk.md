Changed: yes

# Cognitive walkthrough of the new features (2026-10-23)

For each step: will the person know what to do, see the control, link it to
their goal, and see progress after acting?

| Task | Step | Finding |
|---|---|---|
| Hold a die on a phone | First tap | Clear: the buttons show and "Tap again to hold" names the next step. |
| | Second tap | Gold lock appears, as before. Clear. |
| | Release a held die | Two taps (select, then tap). Not cued: the hint shows only on unheld dice. Acceptable: held dice show the gold lock, and a second tap on the selected die releases it. |
| Undo a removal | After X | Bar names what went ("Removed Red") and offers Undo for 5 s. Clear. |
| Save twice under one name | Save | Note names the clash and offers Keep both / Replace it. Clear. |
| Turn on shake to roll | Customize | Switch is labelled; on iPhone the motion prompt follows the tap. Off-state reads from the icon only (aria-pressed for screen readers). Acceptable, matches Sound. |
| Fix a target typo | Target box | Edge and note appear as you type. Clear. |
| Start from nothing | Empty screen | "No dice yet" with Add die and Games. Clear. |

## Gaps

- The Undo bar sits over the top line (app name) while it shows. Existing
  toast position; fine for five seconds.

Nothing built beyond the one-line Undo bar fix in the stories write-up.

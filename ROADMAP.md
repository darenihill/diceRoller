# Roadmap — feature decisions from user feedback

Working document for the 2026-08-18 discussion. Built from the 24 responses in
the Customer Feedback form, deduplicated into 23 distinct asks. Status of every
request lives in the companion sheet, *Dice Roller — Feedback Status*.

**Three decisions were settled by the owner on 2026-08-17, ahead of the
discussion.** They are recorded in place below and marked **DECIDED**:

1. Images stay local and are excluded from share links (item 4)
2. The face format gains an additive `:val:` sentinel rather than a rewrite (item 3)
3. Discoverability is solved in the app; no replies to feedback (final section)

---

## The yardstick

Every good property of this app follows from one decision: **there is no
backend**. That is what makes it free, instant with no signup, private by
default, offline-capable, and what makes a share link permanent — the set lives
in the URL, so there is no server that can lose it.

So the first question for any request is not "is this useful" but **"does this
need a server?"** If it does, it doesn't just cost money — it breaks the
property the rest of the app is built on.

Two of the ten open requests cross that line. The other eight are client-side
and therefore fair game on the merits.

A second, softer constraint matters almost as much: **the share link carries the
whole set**. Anything that inflates a die's data inflates every share URL. That
is the real obstacle for images, and it is easy to miss until the feature is
half-built.

---

## Tier 1 — build these

### 1. Resize / zoom the dice
**Asked by:** Rafael de Almeida (2025-09-16), one anonymous (2026-07-19) — 2 asks
**Effort:** small

The best value-to-effort item on the list. `calculateGridDimensions()` already
derives a size from dice count and container size; this adds a user multiplier on
top of the computed value, persisted like the other preferences.

Worth noting the second requester framed it as "zoom out a bit" — they wanted
*smaller*, not bigger, so the control needs to go both ways rather than being a
"bigger dice" button.

**Open question for discussion:** a slider in Customize, or pinch-to-zoom on the
dice area? A slider is far cheaper and doesn't fight the tap-to-hold gesture.

### 2. Roll a single die
**Asked by:** AthenA (2024-08-05) — 1 ask
**Effort:** small

Each die already carries hover/reveal buttons for settings, clone and remove, so
there is an established pattern and place to put a fourth. The current workaround
— hold all, unhold the one you want, roll, then unhold the rest — is bad enough
that people write in about it.

**Open question:** does a single-die roll get written to the roll log as its own
entry, and does it count toward the running total? My instinct is yes to the log,
no to replacing the total.

### 3. Let a face's label differ from its value — **DECIDED**
**Asked by:** Daniel (2024-10-09) directly; unlocks neek (2024-10-04)
**Effort:** small-to-medium, now that the approach is settled

Daniel asked for a Marvel die where the face shows "M" but scores 6. The current
format cannot express it: a face is a string and its value is whatever
`parseInt` makes of it, so a symbol scores zero.

**Decision (2026-08-17): additive `:val:` sentinel, not a format rewrite.**

A face gains an optional `:val:N` marker alongside the existing `:icon:` and
`:bg:` — so `":icon:Star:bg:#FFD700:val:6"` shows a gold star worth 6. Because it
is purely additive:

- every existing share link and backup keeps parsing byte-for-byte unchanged
- no version tag, no migration, no dual read path
- `parseFaceContent()` gains one more split; faces without `:val:` behave exactly
  as they do today

The rejected alternative was restructuring faces into objects with a version tag
and a legacy read path. Same user outcome, but it is a migration on data sitting
in other people's saved links — not worth it for this.

**One caveat to handle:** a link containing `:val:` opened against an older
cached build would render the sentinel as literal text. The service worker now
serves HTML network-first, so the window is small, but the parser should be
tolerant of unknown sentinels going forward.

**Do not ship a "Marvel Multiverse" preset** — the name is trademarked and this
is a public app. A generic symbol-die preset gets the user to the same place.

---

## Tier 2 — worth discussing, lower conviction

### 4. Images on dice faces — **DECIDED**, promote to Tier 1 when scheduled
**Asked by:** Zack Gotsch (2023-11-03), Tony (2024-09-25), Snato (2024-11-03) — 3 asks, the most of anything open
**Effort:** large

Two hard limits shape this:

- **Storage.** `localStorage` is roughly 5MB for the whole origin, shared across
  saved sets, default set, autosave and history. Base64 images consume that fast.
- **Share links.** The set is compressed into the URL. A 300-dice link already
  runs about 5,600 characters; a single small base64 image would add thousands
  more, and browsers and chat clients start refusing long URLs.

**Decision (2026-08-17): images live locally and are excluded from share links.**

What that means concretely, and the part worth getting right:

| Path | Carries images? | Why |
|---|---|---|
| Share link | **No** | Keeps URLs short and robust — the property that makes sharing work at all |
| Export / Import Backup | **Yes** | A local JSON file has no URL limit, so this becomes the way to move image sets between machines |
| Saved sets / autosave | Yes, under a cap | Bounded by the 5MB origin budget |

A shared die keeps its shape, colour, name and text; only the picture is absent.
That needs a visible, non-alarming fallback rather than an empty face.

**Worth noting:** putting images in backups but not links makes Export/Import
materially more useful, and quietly answers part of Lucas's cross-machine sync
request without any server.

**Still to decide before building:** the storage cap and downscale target (a
64–128px square, re-encoded on import, would keep a 50-die set well inside
budget), and what a shared image face falls back to.

### 5. Turn / round tracker
**Asked by:** Flávio (2024-05-05) — 1 ask
**Effort:** medium

A counter that increments every X rolls, for tracking whose turn it is across a
fight. Self-contained and client-side, but it is a new surface with its own
config, and it is one request. Reasonable to build; hard to justify ahead of
Tier 1.

### 6. Colour changes based on the roll
**Asked by:** mars (2025-07-08) — 1 ask
**Effort:** small-to-medium

Partly served already: RPG mode glows gold on a natural 20 and red on a 1, and
Target Highlight celebrates chosen totals. The generalised version is a rule —
"if the value is X, colour the die Y" — which is a neat fit with item 3.

mars' own framing was vague ("mostly a design change to make rolls look better"),
so this may not need building at all so much as surfacing what exists.

### 7. More roll animations
**Asked by:** Tony (2024-09-25) — 1 ask
**Effort:** small
**Recommendation:** skip for now

`DEVELOPMENT_RECORD.md` shows five animation variants were built and compared,
and "Overshoot Tick" was chosen deliberately. This is a settled decision, not an
unconsidered gap.

---

## Tier 3 — against the grain

Both of these should get an explicit "not planned" rather than sitting
ambiguously on a backlog. People wrote in; a clear answer is worth more than a
vague maybe.

### 8. Log in to reach your sets from any machine
**Asked by:** Lucas Gontijo (2024-05-07)

Needs accounts, authentication, hosting and an ongoing privacy surface — on a
free tool used heavily by teachers, in classrooms, near student data. It also
contradicts the money ladder's $0 posture directly.

**What already covers most of it:** Export / Import Backup moves everything
between machines as a file, and a share link moves a single set instantly.

### 9. Play with friends
**Asked by:** one anonymous (2025-03-25)

Real-time shared rolling needs a relay server, so the same objection applies with
more force — plus session state, presence and abuse handling.

**What already covers part of it:** share links pass a *setup* to other people,
which is the offline-friendly 80% of "we're playing together".

---

## Discoverability — **DECIDED**

**Seven of the twenty-four responses asked for features that already exist.**

- Four asked for share links: Rob, Ben, Rhys, Jackson Wilson
- Three asked for per-face colours: Rafael, Klark, Flip — and Flip's exact use
  case, "roll a die and get a colour result", works today

That is a discoverability problem, not a backlog. Nothing else on this roadmap
helps those users.

**Decision (2026-08-17): fix it in the app. Do not reply to feedback.**

No mass reply. Most of these are one to two years old, and answering a 2023
feature request is odd whatever address it comes from. The work is making the
features visible in the product instead:

- Share is a menu item behind a caret; it deserves a visible affordance
- Per-face colour is three levels deep — die settings, custom faces, palette icon
- The Help modal documents both, but nothing prompts anyone to open Help

**Three exceptions worth a second look** (owner's call, not a mass reply):

| Who | When | Why this one is different |
|---|---|---|
| **Amy** | 2026-08-04 | Said she would donate *"as soon as I'm SURE everything saved properly"* — actively deciding to pay, blocked on precisely the save bug fixed 2026-08-13 |
| **Claudia** | 2025-09-15 | Filed a *Question*, not a request, and never got an answer. It has a one-line answer: yes, Save/Load does exactly that |
| **Eva** | 2025-03-26 | Reported the save-loss bug that is now fixed, and asked directly whether her work could be recovered |

**On the personal-email concern:** the domain is already owned and on a
GoDaddy-managed zone, so a forwarding alias such as `hello@customdiceroller.com`
→ the personal inbox is free on most registrars and removes the objection
permanently. It also fits the brand identity work in the publishing map
(PUB-01/PUB-02).

---

## Suggested order

1. **Resize / zoom** — small, 2 asks, immediate relief
2. **Single-die roll** — small, removes a genuinely awkward workaround
3. **In-app discoverability** — surface Share and per-face colour; ~a third of
   all feedback is people missing what exists
4. **Face `:val:` sentinel** — additive, unlocks Daniel and neek
5. **Images** — the large one, now unblocked: local-only, in backups, not in links
6. Reassess the rest against whatever feedback has arrived by then

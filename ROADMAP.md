# Roadmap — feature decisions from user feedback

Working document for the 2026-08-18 discussion. Built from the 24 responses in
the Customer Feedback form, deduplicated into 23 distinct asks. Status of every
request lives in the companion sheet, *Dice Roller — Feedback Status*.

Nothing here is committed to. The point is to have the arguments already made so
the conversation is about choosing, not discovering.

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

### 3. Let a face's label differ from its value
**Asked by:** Daniel (2024-10-09) directly; unlocks neek (2024-10-04)
**Effort:** medium — touches the face format, which is also the share format

The sleeper item. Daniel asked for a Marvel die where the face shows "M" but
scores 6. The current face format cannot express that: a face is a string, and
its value is whatever `parseInt` makes of it, so a symbol scores zero.

Generalising it — a face carries an optional value separate from its label —
also makes icon and colour faces properly scoreable, which is the missing half of
several other requests.

**This is the one item with real design risk.** Faces are encoded as strings with
`:icon:` and `:bg:` sentinels, and that format is not private: it appears in
share links and in exported backups. Changing it means versioning the format and
keeping a read path for the old one. Worth doing deliberately, not casually.

**Recommendation:** build the general capability. Do **not** ship a "Marvel
Multiverse" preset — the name is trademarked and this is a public app. A generic
symbol-die preset gets the same user there without the exposure.

---

## Tier 2 — worth discussing, lower conviction

### 4. Images on dice faces
**Asked by:** Zack Gotsch (2023-11-03), Tony (2024-09-25), Snato (2024-11-03) — 3 asks, the most of anything open
**Effort:** large, and blocked on a decision

The most-requested missing feature, and the one I would think hardest about
before starting, because it collides with two hard limits:

- **Storage.** `localStorage` is roughly 5MB for the whole origin, shared across
  saved sets, default set, autosave and history. Base64 images consume that fast.
- **Share links.** The set is compressed into the URL. A 300-dice link already
  runs about 5,600 characters; a single small base64 image would add thousands
  more, and browsers and chat clients start refusing long URLs.

**The decision to make first:** what happens to an image when the set is shared?
Either images are excluded from share links and degrade to a placeholder, or
images stay tiny and heavily compressed and sharing still gets fragile. There is
no third option that preserves both. Do not start building until this is settled.

**Also worth weighing:** the three requesters are teachers and hobbyists who
mostly want *recognisable* faces. The existing 63-icon set may already cover much
of the intent, which would make this a discoverability problem rather than a
build. Worth asking one of them before committing to it.

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

## The thing worth doing before any of it

**Seven of the twenty-four responses asked for features that already exist.**

- Four people asked for share links: Rob, Ben, Rhys, Jackson Wilson
- Three asked for per-face colours: Rafael, Klark, Flip — and Flip's exact use
  case, "roll a die and get a colour result", works today

That is a discoverability problem, not a backlog. Nothing on the roadmap will
help those users; a better empty state, a first-run hint, or a visible Share
affordance would.

**Cheapest version:** the Help modal already documents these. Getting people to
open Help at all is the actual problem.

---

## Suggested order

1. Reply to the seven people asking for shipped features (no code)
2. Resize / zoom — small, 2 asks, immediate relief
3. Single-die roll — small, removes a genuinely awkward workaround
4. Decide the images question — a conversation, not a build
5. Face label vs value — the format change, done deliberately
6. Then reassess Tier 2 against whatever feedback has arrived by then

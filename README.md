# Dice Roller

Customizable virtual dice for board games and tabletop RPGs, live at
**[customdiceroller.com](https://customdiceroller.com)**.

Every die is configurable — face count, custom text or icon faces, per-face
background colors, names, and hold/lock state — and a set can be shared as a
single URL with no account and no server.

## Features

- **Any die you need** — set face count, or replace faces entirely with custom
  text and icons. Per-face background colors with automatic contrast text.
- **Game presets** — Catan, Cities & Knights, Yahtzee, King of Tokyo, Zombie
  Dice, Fate/Fudge, LCR, Risk, Warhammer 40k, Blades in the Dark, Call of
  Cthulhu, and more.
- **RPG mode** — polyhedral dice shapes, a roll modifier, and Advantage /
  Disadvantage that keeps the highest (or lowest) among identical plain dice.
- **Hold dice** between rolls, individually or all at once.
- **Target highlight** — name totals you care about and get a celebration when
  a roll hits one.
- **Roll history** with a frequency chart ("luck meter"), persisted locally.
- **Share links** — a set is compressed into the URL hash; no backend involved.
- **Backup** — export and import your saved games and settings as JSON.
- **Four themes**, synthesized dice audio (no asset downloads), and haptics.
- **PWA** — installable and works offline.

## Development

Requires Node 22+.

```bash
npm install
npm run dev
```

The dev server is pinned to **port 4500** (`npm run preview` uses 4501) per the
workspace port registry; `strictPort` makes a conflict fail loudly instead of
silently hopping.

### Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Vite dev server on :4500 |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the production build on :4501 |
| `npm test` | Vitest suite (`npm run test:watch` to watch) |
| `npm run lint` | ESLint |
| `npm run precommit` | Full gate: lint, tests, build, layout guard |

`npm install` points git at `.githooks`, so `precommit` runs automatically on
every commit. See [PRE_COMMIT_PROTOCOL.md](PRE_COMMIT_PROTOCOL.md).

## Architecture

React 19 + TypeScript on Vite 8, CSS Modules, Framer Motion for animation,
lucide-react for icons, lz-string for share links. No backend — all state lives
in `localStorage`.

```
src/
  hooks/useDiceState.ts   roll resolution, advantage/disadvantage, history
  hooks/useStorage.ts     saved sets and autosave
  components/             Dice, ActionBar, SidebarMenu, modals/
  utils/                  dice math, presets, icons, audio, analytics
  test/                   Vitest suites
```

Custom faces are encoded as strings with `:icon:` and `:bg:` sentinels (e.g.
`":icon:Skull:bg:#D32F2F"`); this format also appears in share links and
backups, so treat it as a wire format when changing it.

## Privacy

Google Analytics is gated behind an in-app toggle (Customize → Anonymous Page
Metrics) using GA's official kill switch, and never loads on localhost.
Gameplay stats are computed and stored locally.

## Deployment

Pushing to `master` runs [the Pages workflow](.github/workflows/deploy.yml) —
tests, then build, then deploy to GitHub Pages on the custom domain in
`public/CNAME`.

## Docs

- [APP_REVIEW.md](APP_REVIEW.md) — full UI/UX, code, and architecture review
- [DEVELOPMENT_RECORD.md](DEVELOPMENT_RECORD.md) — decisions and gotchas
- [ANALYTICS_SETUP.md](ANALYTICS_SETUP.md) — analytics options
- `old_legacy/` — the original pre-React implementation, kept for reference

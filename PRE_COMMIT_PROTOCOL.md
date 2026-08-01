# 🛡️ Pre-Commit & Adversarial Code Review Protocol

This document defines the standard operating procedure (SOP), adversarial code review checklist, and automated regression test suite required before committing or pushing changes to the remote GitHub repository (`origin/master`).

---

## 🚀 Quick Execution Command

Before committing any changes, run:

```bash
npm run precommit
```

Or execute individual checks:

```bash
npm run lint       # 1. Adversarial ESLint Code Audit
npm test           # 2. Vitest Automated Regression Suite (19+ Tests)
npm run build      # 3. TypeScript Typecheck & Production Bundle
```

---

## 🔬 Adversarial Code Review Checklist

When reviewing pull requests or proposed edits, audit the codebase against these 5 invariant system rules:

### 1. 📐 Grid Math Protection
- **Rule**: `.dice` inside `src/components/Dice.module.css` MUST NEVER declare `margin`.
- **Rationale**: `calculateGridDimensions()` computes `--dice-size` assuming each die's total footprint equals the grid track cell width. Declaring `margin` expands the die bounding box beyond the grid track width, forcing CSS Grid to wrap dice onto extra rows and pushing dice off-screen.
- **Enforcement**: Automated regex check in `scripts/pre-commit-check.mjs` and `src/test/cssSanity.test.ts`.

### 2. 📏 Container Height Stability
- **Rule**: `App.tsx` main container `paddingBottom` MUST remain constant at `'120px'`.
- **Rationale**: Dynamic container height changes trigger `ResizeObserver` callbacks in `App.tsx`, causing `containerSize.height` to shrink, which forces `--dice-size` recalculation and stutters framer-motion row transition animations.
- **Enforcement**: Toolbar controls, Advantage pills, and Popover menus MUST render as `position: fixed` or `position: absolute` floating overlays.

### 3. 🔘 Action Button Scaling & Offsets
- **Rule**: Corner action buttons (`.actionBtn`) must use `padding: calc(var(--dice-size) * 0.05)` and `top/right/bottom/left: calc(var(--dice-size) * -0.04)`.
- **Rationale**: Avoid hardcoding fixed pixel sizes (`width: 50px`) that scale disproportionately on smaller or larger dice cards.

### 4. ✍️ Single-Path SVG Alpha Blending
- **Rule**: Wireframe 3D facet lines in `PolyhedralWireframe.tsx` MUST be defined as a single SVG `<path d="..." />`.
- **Rationale**: Multiple overlapping `<line>` elements with semi-transparent stroke (`rgba(255,255,255,0.22)`) accumulate alpha opacity at vertex intersections, creating bright white spots. Single-path SVGs rasterize in a single pass with uniform opacity.

### 5. 🔒 Git Push Safety & Authorization
- **Rule**: Never run `git push origin master` automatically.
- **Rationale**: Always require explicit user sign-off and approval after local manual testing.

---

## 🧪 Regression Test Suite (`src/test/`)

The automated regression test suite includes 19+ tests across 4 key test suites:

1. **`src/test/cssSanity.test.ts`**:
   - Asserts `.dice` does not contain `margin:` in CSS.
   - Asserts `App.tsx` container padding is constant.

2. **`src/test/useDiceLayout.test.ts`**:
   - Validates `calculateGridDimensions` across 1, 2, 6, 10, 20, 50 dice.
   - Tests desktop (1200x900) and mobile (375x667) screen dimensions.
   - Guarantees `--dice-size` and `--dice-columns` are always positive numbers without NaN values.

3. **`src/test/useDiceState.test.ts`**:
   - Tests initial state, adding/removing dice, and cloning dice.
   - Tests hold/lock toggling.
   - Tests Advantage / Disadvantage state modes (`normal`, `advantage`, `disadvantage`).
   - Tests modifier increments/decrements.

4. **`src/test/diceUtils.test.ts`**:
   - Tests WCAG contrast color calculations (`getContrastColor`).
   - Tests face parsing and `:icon:` prefixes.

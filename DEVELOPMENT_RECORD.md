# Development Record, Preferences & Lessons Learned

This file serves as a durable record of work done, experimental results, and user preferences for the Dice Roller project.

---

## 🎨 User Style & Preferences

- **Color Palettes**: Premium, curated, harmonious color palettes (avoiding standard browser default colors). Prefers rich dark themes and elegant micro-animations.
- **Icon Visibility**: The unlocked dice icon should not be visible by default unless the die is hovered.
- **Transitions**: Prefers deliberate, satisfying animations (e.g., 0.5s duration) with smooth ease curves.
- **Button Sizing**: All corner action buttons (Hold, Unlock, Settings, Remove) must share the exact same sizing variables and hover behaviors for a consistent, balanced appearance.

---

## 🧪 Experiments & Things We've Tried

- **Framer Motion Animations**: 
  - We tested 5 distinct Framer Motion animation variants for locking and unlocking the dice:
    1. Gentle Rock
    2. Snappy Snap
    3. Overshoot Tick (Winner)
    4. The Wiggle
    5. Slow Windup
  - We filtered the options down to the 2 strongest candidates (Overshoot Tick and The Wiggle) at a refined 0.5s duration. 
  - **The Winner**: **Overshoot Tick (0.5s)** with a wiggle from `0` to `-45` to `10` to `0` degrees.

---

## 🧠 Lessons Learned & Technical Gotchas

### 1. CSS Transitions vs. Framer Motion
- **Issue**: Mixing raw CSS `transition` rules (e.g., `transition: opacity 0.2s, transform 0.2s`) on elements being animated by Framer Motion causes stuttering, overrides, and breaks animations.
- **Solution**: Never combine raw CSS `transform` transitions with Framer Motion inline `rotate` or `scale` animations. Completely handle the property via Framer Motion, or remove the `transform` keyword from the CSS transition property.

### 2. Framer Motion Keyframe Caching
- **Issue**: Toggling a state back and forth immediately returns the same array of keyframes (e.g. `[0, -45, 10, 0]`). Framer Motion sees no change in the value and skips re-triggering the animation.
- **Solution**: Use a dynamic `key` prop on the `<motion.div>` (e.g., `key={`${dice.id}-${dice.held}`}`) to force a clean component remount on every click. This restarts the initial/animate states and wiggles flawlessly every single time.

### 3. State Management
- Recreated the main app state hook (`useDiceState.ts`) to resolve corrupt state. Always ensure clean, deterministic hook state when managing arrays of complex objects like dice.

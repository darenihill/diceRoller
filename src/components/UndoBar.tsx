import React from 'react';
import { Undo2, X } from 'lucide-react';
import type { UndoOffer } from '../hooks/useUndo';
import styles from './UndoBar.module.css';

/**
 * A press that starts this soon after the bar shows was meant for the button
 * that was there before it: the bar opens right where Remove, Clear all and
 * Delete sit, so a double tap used to land on × and throw the Undo away
 * (review 2026-11-09).
 */
export const UNDO_TAP_GUARD_MS = 500;
/** How long after an early press its click still counts as part of it */
const UNDO_PRESS_CLICK_MS = 1500;
/** How far a sideways swipe must go to dismiss the bar (Sitter's distance) */
export const SWIPE_DISMISS_PX = 96;
/** A quicker flick than this, in px per ms, dismisses however short (Sitter's speed) */
export const SWIPE_FLICK_PX_PER_MS = 0.5;
/** How long the bar takes to slide off before it goes */
export const SWIPE_EXIT_MS = 200;

interface UndoBarProps {
  offer: UndoOffer;
  windowMs: number;
  paused: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  onPause: () => void;
  onResume: () => void;
  className?: string;
}

/**
 * The one Undo bar (app standards, standard 2): what happened, a filled Undo
 * pill whose countdown line runs clockwise round its inside from the top and
 * drains away, then ×. A sideways swipe dismisses it too.
 */
export const UndoBar: React.FC<UndoBarProps> = ({ offer, windowMs, paused, onUndo, onDismiss, onPause, onResume, className }) => {
  // One unbroken line drawn as a path that starts and ends at the top middle,
  // like a clock hand. A rectangle's line starts at a corner and had to be
  // shifted round, which left a hairline seam on some screens (owner,
  // 2026-11-05: "the undo button still has a gap").
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [line, setLine] = React.useState('');
  React.useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const measure = () => {
      const box = svg.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const lw = parseFloat(getComputedStyle(svg).getPropertyValue('--line')) || 2;
      // Just outside the pill, a 2px gap from its edge (owner, 2026-11-10: "Line on the outside edge")
      const i = -(lw / 2 + 2);
      const w = box.width - 2 * i, h = box.height - 2 * i;
      const r = Math.min(h / 2, w / 2);
      const x0 = i, y0 = i, cx = i + w / 2;
      setLine(
        `M ${cx} ${y0} H ${x0 + w - r} A ${r} ${r} 0 0 1 ${x0 + w} ${y0 + r} V ${y0 + h - r} ` +
        `A ${r} ${r} 0 0 1 ${x0 + w - r} ${y0 + h} H ${x0 + r} A ${r} ${r} 0 0 1 ${x0} ${y0 + h - r} ` +
        `V ${y0 + r} A ${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`,
      );
    };
    measure();
    // Turning the phone or resizing the window changes the pill's size
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [offer.key]);
  // When this offer showed, and whether the press now under way started too soon after
  const shownAt = React.useRef(0);
  const early = React.useRef(false);
  const pressAt = React.useRef(0);
  React.useEffect(() => { shownAt.current = Date.now(); early.current = false; }, [offer.key]);
  const onPress = () => { pressAt.current = Date.now(); early.current = pressAt.current - shownAt.current < UNDO_TAP_GUARD_MS; };
  // Only the click that ends that early press is dropped; a press that never
  // clicked (a scroll, a tap on the words) doesn't swallow a later key press
  const unlessEarly = (act: () => void) => () => {
    const swallow = early.current && Date.now() - pressAt.current < UNDO_PRESS_CLICK_MS;
    early.current = false;
    if (swallow) return;
    act();
  };
  // A sideways swipe dismisses the bar, like × (owner, 2026-11-10), and works
  // as Sitter's does: the bar follows the finger and fades; past
  // SWIPE_DISMISS_PX, or on a quick flick, it slides off the screen and goes;
  // short of that it springs back. Taps on Undo and × still work as before.
  const swipe = React.useRef<{ x: number; y: number; id: number; on: boolean; lastX: number; lastT: number; v: number } | null>(null);
  // The drag belongs to one offer, so a new offer starts with the bar in place
  const [drag, setDrag] = React.useState({ key: offer.key, dx: 0, live: false });
  const dx = drag.key === offer.key ? drag.dx : 0;
  const live = drag.key === offer.key && drag.live;
  const swiped = React.useRef(false);
  const endSwipe = (dismiss: boolean) => {
    const was = swipe.current?.on;
    swipe.current = null;
    if (was) swiped.current = true;
    if (was && dismiss) {
      const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) { onDismiss(); return; }
      // Slide the rest of the way off the side it was swiped to, then go
      setDrag({ key: offer.key, dx: Math.sign(dx || 1) * window.innerWidth, live: false });
      window.setTimeout(onDismiss, SWIPE_EXIT_MS);
      return;
    }
    setDrag({ key: offer.key, dx: 0, live: false });
  };
  return (
  <div
    className={`${styles.bar} ${live ? styles.swiping : ''} ${className ?? ''}`}
    role="status"
    data-testid="undo-bar"
    style={dx ? { translate: `${dx}px 0`, opacity: live ? Math.max(0.3, 1 - Math.abs(dx) / 240) : 0 } : undefined}
    onPointerDown={(e) => { onPress(); onPause(); swiped.current = false; swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false, lastX: e.clientX, lastT: Date.now(), v: 0 }; }}
    onPointerMove={(e) => {
      const s = swipe.current;
      if (!s || s.id !== e.pointerId) return;
      const mx = e.clientX - s.x, my = e.clientY - s.y;
      if (!s.on) {
        // Only a mostly sideways move counts as a swipe
        if (Math.abs(mx) < 10 || Math.abs(mx) < Math.abs(my)) return;
        s.on = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }
      // Speed over the latest move, so a flick counts even if it is short
      const now = Date.now();
      s.v = (e.clientX - s.lastX) / Math.max(1, now - s.lastT);
      s.lastX = e.clientX;
      s.lastT = now;
      setDrag({ key: offer.key, dx: mx, live: true });
    }}
    onPointerUp={(e) => {
      const s = swipe.current;
      // A finger that stopped before lifting is not a flick
      if (s && Date.now() - s.lastT > 100) s.v = 0;
      if (s?.on) endSwipe(Math.abs(e.clientX - s.x) >= SWIPE_DISMISS_PX || Math.abs(s.v) > SWIPE_FLICK_PX_PER_MS);
      swipe.current = null;
      if (!e.currentTarget.contains(document.activeElement)) onResume();
    }}
    onClickCapture={(e) => {
      // The click that ends a swipe is not a tap on Undo or ×
      if (swiped.current) { swiped.current = false; e.stopPropagation(); e.preventDefault(); }
    }}
    onPointerCancel={() => { endSwipe(false); onResume(); }}
    onPointerLeave={() => { if (!swipe.current?.on) onResume(); }}
    onFocus={onPause}
    onBlur={onResume}
  >
    <span className={styles.message}>{offer.message}</span>
    <button type="button" className={styles.undo} onClick={unlessEarly(onUndo)}>
      <svg className={styles.ring} aria-hidden="true" ref={svgRef}>
        <path
          key={offer.key}
          className={styles.ringLine}
          d={line}
          pathLength={1}
          style={{ animationDuration: `${windowMs}ms`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      </svg>
      <Undo2 size={18} strokeWidth={2.5} aria-hidden="true" />
      Undo
    </button>
    {/* × on every bar, big changes too, so it is always there (owner, 2026-11-10) */}
    <button type="button" className={styles.close} onClick={unlessEarly(onDismiss)} aria-label="Dismiss">
      <X size={18} strokeWidth={2.5} aria-hidden="true" />
    </button>
  </div>
);
};

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
 * drains away, then × (left off after a big change, which keeps the full time).
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
      const i = lw / 2 + 1;
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
  React.useEffect(() => { shownAt.current = Date.now(); early.current = false; }, [offer.key]);
  const onPress = () => { early.current = Date.now() - shownAt.current < UNDO_TAP_GUARD_MS; };
  const unlessEarly = (act: () => void) => () => {
    if (early.current) { early.current = false; return; }
    act();
  };
  return (
  <div
    className={`${styles.bar} ${className ?? ''}`}
    role="status"
    data-testid="undo-bar"
    onPointerDown={() => { onPress(); onPause(); }}
    onPointerUp={(e) => { if (!e.currentTarget.contains(document.activeElement)) onResume(); }}
    onPointerCancel={onResume}
    onPointerLeave={onResume}
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
    {!offer.big && (
      <button type="button" className={styles.close} onClick={unlessEarly(onDismiss)} aria-label="Dismiss">
        <X size={18} strokeWidth={2.5} aria-hidden="true" />
      </button>
    )}
  </div>
);
};

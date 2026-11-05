import React from 'react';
import { Undo2, X } from 'lucide-react';
import type { UndoOffer } from '../hooks/useUndo';
import styles from './UndoBar.module.css';

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
  // The line starts and ends at the top middle, like a clock hand, so the part
  // already drained reads as time gone rather than a gap at the corner
  // (owner, 2026-11-05: "the undo button has a small gap")
  const lineRef = React.useRef<SVGRectElement>(null);
  const [start, setStart] = React.useState(0);
  React.useLayoutEffect(() => {
    const box = lineRef.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return;
    const r = Math.min(20, box.width / 2, box.height / 2);
    const perimeter = 2 * (box.width - 2 * r) + 2 * (box.height - 2 * r) + 2 * Math.PI * r;
    setStart((box.width / 2 - r) / perimeter);
  }, [offer.key]);
  return (
  <div
    className={`${styles.bar} ${className ?? ''}`}
    role="status"
    data-testid="undo-bar"
    onPointerDown={onPause}
    onPointerUp={(e) => { if (!e.currentTarget.contains(document.activeElement)) onResume(); }}
    onPointerCancel={onResume}
    onPointerLeave={onResume}
    onFocus={onPause}
    onBlur={onResume}
  >
    <span className={styles.message}>{offer.message}</span>
    <button type="button" className={styles.undo} onClick={onUndo}>
      <svg className={styles.ring} aria-hidden="true" preserveAspectRatio="none">
        <rect
          key={offer.key}
          className={styles.ringLine}
          pathLength={1}
          ref={lineRef}
          style={{ animationDuration: `${windowMs}ms`, animationPlayState: paused ? 'paused' : 'running', '--start': start } as React.CSSProperties}
        />
      </svg>
      <Undo2 size={18} strokeWidth={2.5} aria-hidden="true" />
      Undo
    </button>
    {!offer.big && (
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
        <X size={18} strokeWidth={2.5} aria-hidden="true" />
      </button>
    )}
  </div>
);
};

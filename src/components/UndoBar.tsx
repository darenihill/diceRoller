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
export const UndoBar: React.FC<UndoBarProps> = ({ offer, windowMs, paused, onUndo, onDismiss, onPause, onResume, className }) => (
  <div
    className={`${styles.bar} ${className ?? ''}`}
    role="status"
    data-testid="undo-bar"
    onPointerDown={onPause}
    onPointerUp={onResume}
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
          style={{ animationDuration: `${windowMs}ms`, animationPlayState: paused ? 'paused' : 'running' }}
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

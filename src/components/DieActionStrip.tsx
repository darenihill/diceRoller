import React from 'react';
import { Lock, Unlock, Settings, Trash2, Copy, Dices } from 'lucide-react';
import type { DiceData } from '../types';
import { parseFaceContent, faceLabel } from '../utils/diceUtils';
import styles from './DieActionStrip.module.css';

interface DieActionStripProps {
  die: DiceData;
  /** A row of chips sits above Roll: the sheet grows to cover it */
  rpgMode: boolean;
  onRollOne?: (id: string) => void;
  onToggleHold: (id: string) => void;
  onClone: (template: Partial<DiceData>) => void;
  onOpenSettings: (id: string) => void;
  onRemove: (id: string) => void;
  /** Any tap in the strip, so it stays open while in use */
  onInteract?: () => void;
  /** A swipe down closes the sheet (owner, 2026-11-10: "Allow that bar to swipe down") */
  onClose?: () => void;
}

/** How far a swipe down must go to close the sheet */
export const SHEET_CLOSE_PX = 60;
/** A quicker flick down than this, in px per ms, closes it however short */
export const SHEET_FLICK_PX_PER_MS = 0.5;
/** How long the sheet takes to slide down before it goes */
export const SHEET_EXIT_MS = 200;

/** What the die shows, in words, for the strip's heading */
const showing = (die: DiceData): string => {
  if (die.customFaces.length > 0) {
    const raw = die.customFaces[Math.min(die.currentFaceIndex ?? 0, die.customFaces.length - 1)] ?? '';
    const content = parseFaceContent(raw).content;
    return faceLabel(content);
  }
  return String(die.numberValue);
};

/**
 * With many small dice, a tapped die's buttons come out here as one row of
 * thumb-sized buttons above the bottom bar (owner, 2026-10-28), instead of
 * crowding round the die. It always opens in that one spot, never jumping to
 * the top (owner, 2026-11-10: "a more consistent spot. It moves around");
 * its heading names the die, so covering it doesn't lose which one.
 */
export const DieActionStrip: React.FC<DieActionStripProps> = ({ die, rpgMode, onRollOne, onToggleHold, onClone, onOpenSettings, onRemove, onInteract, onClose }) => {
  const name = die.name || `d${die.faces}`;
  // Swipe down to close, like a phone's bottom sheet: it follows the finger
  // down, and past SHEET_CLOSE_PX or on a quick flick it slides away; short of
  // that it springs back. A tap on a button is still a tap.
  const drag = React.useRef<{ y: number; x: number; id: number; on: boolean; lastY: number; lastT: number; v: number } | null>(null);
  const [dy, setDy] = React.useState(0);
  const [live, setLive] = React.useState(false);
  // When the last drag ended: only the click right after it is swallowed
  const dragged = React.useRef(0);
  const exitTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(exitTimer.current), []);
  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.on) return;
    dragged.current = Date.now();
    setLive(false);
    if (Date.now() - d.lastT > 100) d.v = 0;
    const moved = e.clientY - d.y;
    // A flick back up at the end means "keep it", as phone sheets do
    if (onClose && d.v > -0.1 && (moved >= SHEET_CLOSE_PX || d.v > SHEET_FLICK_PX_PER_MS)) {
      const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) { onClose(); return; }
      setDy(window.innerHeight);
      exitTimer.current = window.setTimeout(onClose, SHEET_EXIT_MS);
      return;
    }
    setDy(0);
  };
  return (
    <div
      onPointerDownCapture={onInteract}
      onPointerDown={(e) => { dragged.current = 0; drag.current = { y: e.clientY, x: e.clientX, id: e.pointerId, on: false, lastY: e.clientY, lastT: Date.now(), v: 0 }; }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const my = e.clientY - d.y, mx = e.clientX - d.x;
        if (!d.on) {
          // Only a mostly downward move counts
          if (my < 10 || my < Math.abs(mx)) return;
          d.on = true;
          setLive(true);
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }
        const now = Date.now();
        const step = (e.clientY - d.lastY) / Math.max(8, now - d.lastT);
        d.v = 0.6 * step + 0.4 * d.v;
        d.lastY = e.clientY;
        d.lastT = now;
        setDy(Math.max(0, my));
      }}
      onPointerUp={endDrag}
      onPointerCancel={() => { drag.current = null; setLive(false); setDy(0); }}
      onClickCapture={(e) => {
        // The click that ends a swipe is not a tap on a button
        if (dragged.current && Date.now() - dragged.current < 1000) { dragged.current = 0; e.stopPropagation(); e.preventDefault(); }
      }}
      style={dy ? { translate: `0 ${dy}px` } : undefined}
      className={`${styles.strip} ${rpgMode ? styles.rpg : ''} ${live ? styles.dragging : ''}`}
      role="group"
      aria-label={`Actions for ${name}`}
      data-die-actions={die.id}
    >
      <div className={styles.heading}>{name} showing {showing(die)}{die.held ? ', held' : ''}</div>
      <div className={styles.row}>
        <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => onRollOne?.(die.id)} disabled={!onRollOne || die.held} title={die.held ? 'Release it to roll it' : undefined}>
          <span className={styles.circle}><Dices size={22} aria-hidden="true" /></span>
          <span className={styles.label}>Roll one</span>
        </button>
        <button type="button" className={styles.btn} onClick={() => onToggleHold(die.id)} aria-pressed={die.held}>
          <span className={styles.circle}>{die.held ? <Lock size={22} aria-hidden="true" /> : <Unlock size={22} aria-hidden="true" />}</span>
          <span className={styles.label}>{die.held ? 'Release' : 'Hold'}</span>
        </button>
        <button type="button" className={styles.btn} onClick={() => onClone(die)}>
          <span className={styles.circle}><Copy size={22} aria-hidden="true" /></span>
          <span className={styles.label}>Copy</span>
        </button>
        <button type="button" className={styles.btn} onClick={() => onOpenSettings(die.id)}>
          <span className={styles.circle}><Settings size={22} aria-hidden="true" /></span>
          <span className={styles.label}>Settings</span>
        </button>
        <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={() => onRemove(die.id)}>
          <span className={styles.circle}><Trash2 size={22} aria-hidden="true" /></span>
          <span className={styles.label}>Remove</span>
        </button>
      </div>
    </div>
  );
};

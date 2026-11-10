import React from 'react';
import { Lock, Unlock, Settings, Trash2, Copy, Dices } from 'lucide-react';
import type { DiceData } from '../types';
import { parseFaceContent, faceLabel } from '../utils/diceUtils';
import styles from './DieActionStrip.module.css';

interface DieActionStripProps {
  die: DiceData;
  rpgMode: boolean;
  onRollOne?: (id: string) => void;
  onToggleHold: (id: string) => void;
  onClone: (template: Partial<DiceData>) => void;
  onOpenSettings: (id: string) => void;
  onRemove: (id: string) => void;
  /** Any tap in the strip, so it stays open while in use */
  onInteract?: () => void;
}

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
export const DieActionStrip: React.FC<DieActionStripProps> = ({ die, rpgMode, onRollOne, onToggleHold, onClone, onOpenSettings, onRemove, onInteract }) => {
  const name = die.name || `d${die.faces}`;
  return (
    <div
      onPointerDownCapture={onInteract}
      className={`${styles.strip} ${rpgMode ? styles.rpg : ''}`}
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

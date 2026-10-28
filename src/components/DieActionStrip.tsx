import React from 'react';
import { Lock, Unlock, Settings, X, Copy, Dices } from 'lucide-react';
import type { DiceData } from '../types';
import { parseFaceContent, FACE_ICON_PREFIX } from '../utils/diceUtils';
import styles from './DieActionStrip.module.css';

interface DieActionStripProps {
  die: DiceData;
  rpgMode: boolean;
  onRollOne?: (id: string) => void;
  onToggleHold: (id: string) => void;
  onClone: (template: Partial<DiceData>) => void;
  onOpenSettings: (id: string) => void;
  onRemove: (id: string) => void;
}

/** What the die shows, in words, for the strip's heading */
const showing = (die: DiceData): string => {
  if (die.customFaces.length > 0) {
    const raw = die.customFaces[Math.min(die.currentFaceIndex ?? 0, die.customFaces.length - 1)] ?? '';
    const content = parseFaceContent(raw).content;
    return content.startsWith(FACE_ICON_PREFIX) ? content.replace(FACE_ICON_PREFIX, '') : content;
  }
  return String(die.numberValue);
};

/**
 * With many small dice, a tapped die's buttons come out here as one row of
 * thumb-sized buttons above the bottom bar (owner, 2026-10-28), instead of
 * crowding round the die.
 */
export const DieActionStrip: React.FC<DieActionStripProps> = ({ die, rpgMode, onRollOne, onToggleHold, onClone, onOpenSettings, onRemove }) => {
  const name = die.name || `d${die.faces}`;
  return (
    <div
      className={`${styles.strip} ${rpgMode ? styles.rpg : ''}`}
      role="group"
      aria-label={`Actions for ${name}`}
      data-die-actions={die.id}
    >
      <div className={styles.heading}>{name} showing {showing(die)}{die.held ? ', held' : ''}</div>
      <div className={styles.row}>
        <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => onRollOne?.(die.id)} disabled={!onRollOne}>
          <span className={styles.circle}><Dices size={22} aria-hidden="true" /></span>
          <span className={styles.label}>Roll one</span>
        </button>
        <button type="button" className={styles.btn} onClick={() => onToggleHold(die.id)} aria-pressed={die.held}>
          <span className={styles.circle}>{die.held ? <Lock size={22} aria-hidden="true" /> : <Unlock size={22} aria-hidden="true" />}</span>
          <span className={styles.label}>{die.held ? 'Release' : 'Hold'}</span>
        </button>
        <button type="button" className={styles.btn} onClick={() => onClone(die)}>
          <span className={styles.circle}><Copy size={22} aria-hidden="true" /></span>
          <span className={styles.label}>Clone</span>
        </button>
        <button type="button" className={styles.btn} onClick={() => onOpenSettings(die.id)}>
          <span className={styles.circle}><Settings size={22} aria-hidden="true" /></span>
          <span className={styles.label}>Settings</span>
        </button>
        <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={() => onRemove(die.id)}>
          <span className={styles.circle}><X size={22} aria-hidden="true" /></span>
          <span className={styles.label}>Remove</span>
        </button>
      </div>
    </div>
  );
};

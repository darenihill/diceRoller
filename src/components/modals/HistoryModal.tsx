import React from 'react';
import { Modal } from '../Modal';
import type { RollHistoryItem, RollAdvantageMode } from '../../hooks/useDiceState';
import type { DiceData } from '../../types';
import { fairOdds, luckRows, furthestFromFair, luckSet } from '../../utils/fairOdds';
import styles from '../../App.module.css';
import modalStyles from './Modals.module.css';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rollHistory: RollHistoryItem[];
  onClearHistory: () => void;
  /** The dice on the table now, for the fair-dice marks */
  dice?: DiceData[];
  rpgMode?: boolean;
  modifier?: number;
  rollAdvantage?: RollAdvantageMode;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  rollHistory,
  onClearHistory,
  dice = [],
  rpgMode = false,
  modifier = 0,
  rollAdvantage = 'normal',
}) => {
  // The chart counts whole-set rolls only; a die rolled on its own stays in the log
  const counted = rollHistory.filter(item => !item.single);
  const counts = new Map<number, number>();
  counted.forEach(item => counts.set(item.total, (counts.get(item.total) ?? 0) + 1));

  // Fair-dice marks: the count each total would get, on average, from fair
  // dice like the ones on the table now
  const rows = luckRows(counts, fairOdds(dice, rpgMode, modifier, rollAdvantage), counted.length);
  const scale = Math.max(1, ...rows.map(r => Math.max(r.count, r.fair)));
  const showFair = dice.length > 0;
  const odd = showFair && counted.length >= 3 ? furthestFromFair(rows) : null;
  const nowSet = luckSet(dice);
  const diceChanged = showFair && counted.some(item => item.set !== undefined && item.set !== nowSet);
  const times = (n: number) => `${n} ${n === 1 ? 'time' : 'times'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Roll History & Frequency">
      {rollHistory.length === 0 ? (
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', padding: '16px 0' }}>No History Recorded Yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Session Frequency Histogram */}
          <div>
            <h3 className={modalStyles.sectionHeaderFirst}>Roll Frequency ("Luck Meter")</h3>
            <div className={modalStyles.freqCard}>
              {showFair && (
                <p className={modalStyles.freqNote}>
                  <span className={modalStyles.freqFairKey} aria-hidden="true" /> marks what fair dice would give
                  {diceChanged ? ', using the dice on the table now (they changed since some of these rolls)' : ''}.
                </p>
              )}
              {odd && (
                <p className={modalStyles.freqNote} data-furthest={odd.total}>
                  Furthest from fair: {odd.total} came up {times(odd.count)}; fair dice would give about {Math.round(odd.fair * 10) / 10}.
                </p>
              )}
              {rows.map(row => (
                <div key={row.total} className={modalStyles.freqRow}>
                  <span className={modalStyles.freqLabel}>
                    Total {row.total}:
                  </span>
                  <div className={modalStyles.freqBarContainer}>
                    <div
                      className={modalStyles.freqBarFill}
                      style={{ width: `${(row.count / scale) * 100}%` }}
                    />
                    {showFair && row.fair > 0 && (
                      <div
                        className={modalStyles.freqFairMark}
                        style={{ left: `${(row.fair / scale) * 100}%` }}
                        data-fair={row.fair.toFixed(2)}
                        title={`Fair dice: about ${Math.round(row.fair * 10) / 10}`}
                      />
                    )}
                  </div>
                  <span className={modalStyles.freqCount}>
                    {row.count}x
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.historyList}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className={modalStyles.sectionHeaderFirst} style={{ margin: 0 }}>Roll Log ({rollHistory.length})</h3>
              <button className="md-button md-button-surface md-button-compact" onClick={onClearHistory}>
                Clear History
              </button>
            </div>
            {rollHistory.map((roll, i) => (
              <div key={roll.id} className={styles.historyItem} style={{ borderLeft: roll.isTargetHit ? '4px solid var(--color-gold)' : 'none' }}>
                <div className={styles.historyIndex}>Roll {rollHistory.length - i}{roll.single ? ' · one die' : ''}{roll.typed ? ` · ${roll.typed}` : ''}</div>
                <div className={styles.historyDetails}>{roll.details.join(', ')}</div>
                <div className={styles.historyTotal}>
                  Total: {roll.total}
                  {roll.isTargetHit && <span style={{ marginLeft: 6, color: 'var(--color-gold)', fontSize: 12 }}>🎯 HIT!</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

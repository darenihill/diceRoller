import React from 'react';
import { Modal } from '../Modal';
import type { RollHistoryItem } from '../../hooks/useDiceState';
import styles from '../../App.module.css';
import modalStyles from './Modals.module.css';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rollHistory: RollHistoryItem[];
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  rollHistory,
  onClearHistory,
}) => {
  // Compute total roll frequency map for session histogram
  const frequencyMap: Record<number, number> = {};
  let maxFreq = 0;

  rollHistory.forEach(item => {
    const total = item.total;
    frequencyMap[total] = (frequencyMap[total] || 0) + 1;
    if (frequencyMap[total] > maxFreq) {
      maxFreq = frequencyMap[total];
    }
  });

  const sortedTotals = Object.keys(frequencyMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Roll History & Frequency">
      {rollHistory.length === 0 ? (
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', padding: '16px 0' }}>No History Recorded Yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Session Frequency Histogram */}
          <div>
            <h3 className={modalStyles.sectionHeaderFirst}>Session Frequency ("Luck Meter")</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, backgroundColor: 'var(--md-sys-color-surface-variant)', padding: 12, borderRadius: 8 }}>
              {sortedTotals.map(tot => {
                const count = frequencyMap[tot];
                const pct = maxFreq > 0 ? (count / maxFreq) * 100 : 0;
                return (
                  <div key={tot} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{ width: 48, fontWeight: 700, textAlign: 'right', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Total {tot}:
                    </span>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', height: 18, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                      <div 
                        style={{ 
                          width: `${pct}%`, 
                          height: '100%', 
                          backgroundColor: 'var(--md-sys-color-primary)', 
                          borderRadius: 4, 
                          transition: 'width 0.3s ease' 
                        }} 
                      />
                    </div>
                    <span style={{ width: 32, fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>
                      {count}x
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.historyList}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className={modalStyles.sectionHeaderFirst} style={{ margin: 0 }}>Roll Log ({rollHistory.length})</h3>
              <button className="md-button md-button-surface" onClick={onClearHistory} style={{ height: 32, padding: '0 12px', fontSize: 12 }}>
                Clear History
              </button>
            </div>
            {rollHistory.map((roll, i) => (
              <div key={roll.id} className={styles.historyItem} style={{ borderLeft: roll.isTargetHit ? '4px solid #FFD700' : 'none' }}>
                <div className={styles.historyIndex}>Roll {rollHistory.length - i}</div>
                <div className={styles.historyDetails}>{roll.details.join(', ')}</div>
                <div className={styles.historyTotal}>
                  Total: {roll.total}
                  {roll.isTargetHit && <span style={{ marginLeft: 6, color: '#FFD700', fontSize: 12 }}>🎯 HIT!</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

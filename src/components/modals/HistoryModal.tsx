import React from 'react';
import { Modal } from '../Modal';
import type { RollHistoryItem } from '../../hooks/useDiceState';
import styles from '../../App.module.css';

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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Roll History">
      {rollHistory.length === 0 ? (
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', padding: '16px 0' }}>No History Recorded Yet</p>
      ) : (
        <div className={styles.historyList}>
          <button className="md-button md-button-surface" onClick={onClearHistory}>Clear History</button>
          {rollHistory.map((roll, i) => (
            <div key={roll.id} className={styles.historyItem}>
              <div className={styles.historyIndex}>Roll {rollHistory.length - i}</div>
              <div className={styles.historyDetails}>{roll.details.join(', ')}</div>
              <div className={styles.historyTotal}>Total: {roll.total}</div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

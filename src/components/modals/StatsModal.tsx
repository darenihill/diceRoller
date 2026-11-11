import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '../Modal';
import { getLocalStats } from '../../utils/analytics';
import { countSaved, eraseQuestion } from '../../utils/erase';
import modalStyles from './Modals.module.css';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Erase all, once asked: takes everything off this phone and reloads */
  onEraseEverything?: () => void;
}

/**
 * The ask-first panel for Erase everything. It takes the dialog's place, so
 * Tab stays between Not now and Erase all (and the dialog's ×); Escape is
 * Not now. Focus starts on Not now, the safe one.
 */
const EraseAsk: React.FC<{ question: string; onErase: () => void; onCancel: () => void }> = ({ question, onErase, onCancel }) => {
  const notNow = useRef<HTMLButtonElement>(null);
  useEffect(() => { notNow.current?.focus(); }, []);
  return (
    <div
      role="group"
      aria-labelledby="erase-question"
      className={modalStyles.eraseAsk}
      data-testid="erase-ask"
      onKeyDown={(e) => {
        // Escape here is Not now, not "close Usage stats"
        if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onCancel(); }
      }}
    >
      <p id="erase-question" className={modalStyles.eraseQuestion}>{question}</p>
      <div className={modalStyles.eraseButtons}>
        <button ref={notNow} className="md-button md-button-surface" onClick={onCancel}>Not now</button>
        <button className="md-button md-button-danger" onClick={onErase}>Erase all</button>
      </div>
    </div>
  );
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
};

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, onEraseEverything }) => {
  // The question, counted when Erase everything is tapped; null while not asking
  const [asking, setAsking] = useState<string | null>(null);
  const eraseButton = useRef<HTMLButtonElement>(null);
  const backToErase = useRef(false);
  useEffect(() => { if (!isOpen) setAsking(null); }, [isOpen]); // eslint-disable-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (asking === null && backToErase.current) { backToErase.current = false; eraseButton.current?.focus(); }
  }, [asking]);

  // Read on open rather than on mount so the numbers are always current
  if (!isOpen) return null;

  if (asking !== null) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Usage stats">
        <EraseAsk
          question={asking}
          onErase={() => onEraseEverything?.()}
          onCancel={() => { backToErase.current = true; setAsking(null); }}
        />
      </Modal>
    );
  }

  const stats = getLocalStats();
  const averageRoll = stats.totalRolls > 0 ? (stats.totalSumRolled / stats.totalRolls).toFixed(1) : '—';

  const topPresets = Object.entries(stats.presetsLoadedCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const metrics: { label: string; value: string | number }[] = [
    { label: 'Total rolls', value: stats.totalRolls.toLocaleString() },
    { label: 'Dice rolled', value: stats.totalDiceRolled.toLocaleString() },
    { label: 'Highest roll', value: stats.highestRoll || '—' },
    { label: 'Average roll', value: averageRoll },
    { label: 'Sessions', value: stats.totalSessions.toLocaleString() },
    { label: 'Dice added', value: stats.customDiceAddedCount.toLocaleString() },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Usage stats">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className={modalStyles.metricsGrid}>
            {metrics.map(m => (
              <div key={m.label} className={modalStyles.metricCard}>
                <span className={modalStyles.metricValue}>{m.value}</span>
                <span className={modalStyles.metricLabel}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {topPresets.length > 0 && (
          <div>
            <h3 className={modalStyles.sectionHeader}>Most played games</h3>
            <div className={modalStyles.presetList}>
              {topPresets.map(([name, count]) => (
                <div key={name} className={modalStyles.presetRow}>
                  <span className={modalStyles.presetName}>{name}</span>
                  <span className={modalStyles.presetCount}>{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className={modalStyles.sectionHeader}>Activity</h3>
          <div className={modalStyles.presetList}>
            <div className={modalStyles.presetRow}>
              <span className={modalStyles.presetName}>First used</span>
              <span>{formatDate(stats.firstSessionTime)}</span>
            </div>
            <div className={modalStyles.presetRow}>
              <span className={modalStyles.presetName}>Last used</span>
              <span>{formatDate(stats.lastSessionTime)}</span>
            </div>
            <div className={modalStyles.presetRow}>
              <span className={modalStyles.presetName}>Backups exported</span>
              <span>{stats.backupsExportedCount}</span>
            </div>
            <div className={modalStyles.presetRow}>
              <span className={modalStyles.presetName}>Share links created</span>
              <span>{stats.shareLinksGeneratedCount}</span>
            </div>
          </div>
        </div>

        <p className={modalStyles.toggleDesc} style={{ margin: 0 }}>
          Your games, History, pictures and these stats stay on this phone.
        </p>
        {onEraseEverything && (
          <button ref={eraseButton} className={`md-button ${modalStyles.eraseEverything}`} onClick={() => setAsking(eraseQuestion(countSaved()))}>
            Erase everything
          </button>
        )}
      </div>
    </Modal>
  );
};

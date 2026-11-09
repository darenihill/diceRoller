import React from 'react';
import { Modal } from '../Modal';
import { getLocalStats } from '../../utils/analytics';
import modalStyles from './Modals.module.css';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
};

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  // Read on open rather than on mount so the numbers are always current
  if (!isOpen) return null;

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
          These stats stay on this device. Clearing your browser data resets them.
          They're never tied to an account.
        </p>
      </div>
    </Modal>
  );
};

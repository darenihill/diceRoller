import React from 'react';
import { Modal } from '../Modal';
import { getLocalStats } from '../../utils/analytics';
import modalStyles from './Modals.module.css';

interface MetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MetricsModal: React.FC<MetricsModalProps> = ({ isOpen, onClose }) => {
  const stats = getLocalStats();

  const avgDicePerRoll = stats.totalRolls > 0 ? (stats.totalDiceRolled / stats.totalRolls).toFixed(1) : '0';
  const avgSumPerRoll = stats.totalRolls > 0 ? Math.round(stats.totalSumRolled / stats.totalRolls) : 0;
  
  const presetsList = Object.entries(stats.presetsLoadedCount)
    .sort((a, b) => b[1] - a[1]);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Page Metrics & Usage Stats">
      <div className={modalStyles.formGroup}>
        <h3 className={modalStyles.sectionHeaderFirst}>Session Activity</h3>
        <div className={modalStyles.metricsGrid}>
          <div className={modalStyles.metricCard}>
            <div className={modalStyles.metricValue}>{stats.totalSessions}</div>
            <div className={modalStyles.metricLabel}>Total Sessions</div>
          </div>
          <div className={modalStyles.metricCard}>
            <div className={modalStyles.metricValue}>{formatDate(stats.firstSessionTime)}</div>
            <div className={modalStyles.metricLabel}>First Active</div>
          </div>
          <div className={modalStyles.metricCard}>
            <div className={modalStyles.metricValue}>{formatDate(stats.lastSessionTime)}</div>
            <div className={modalStyles.metricLabel}>Last Active</div>
          </div>
        </div>

        <h3 className={modalStyles.sectionHeader}>Dice Roll Metrics</h3>
        <div className={modalStyles.metricsGrid}>
          <div className={modalStyles.metricCard}>
            <div className={modalStyles.metricValue}>{stats.totalRolls}</div>
            <div className={modalStyles.metricLabel}>Total Rolls</div>
          </div>
          <div className={modalStyles.metricCard}>
            <div className={modalStyles.metricValue}>{stats.totalDiceRolled}</div>
            <div className={modalStyles.metricLabel}>Dice Rolled</div>
          </div>
          <div className={modalStyles.metricCard}>
            <div className={modalStyles.metricValue}>{stats.highestRoll}</div>
            <div className={modalStyles.metricLabel}>Highest Sum</div>
          </div>
          <div className={modalStyles.metricCard}>
            <div className={modalStyles.metricValue}>{avgDicePerRoll}</div>
            <div className={modalStyles.metricLabel}>Avg Dice / Roll</div>
          </div>
          <div className={modalStyles.metricCard}>
            <div className={modalStyles.metricValue}>{avgSumPerRoll}</div>
            <div className={modalStyles.metricLabel}>Avg Sum / Roll</div>
          </div>
        </div>

        <h3 className={modalStyles.sectionHeader}>Feature Usage & Exports</h3>
        <div className={modalStyles.metricsGrid}>
          <div className={modalStyles.metricCard}>
            <div className={modalStyles.metricValue}>{stats.customDiceAddedCount}</div>
            <div className={modalStyles.metricLabel}>Custom Dice</div>
          </div>
          <div className={modalStyles.metricCard}>
            <div className={modalStyles.metricValue}>{stats.shareLinksGeneratedCount}</div>
            <div className={modalStyles.metricLabel}>Links Shared</div>
          </div>
          <div className={modalStyles.metricCard}>
            <div className={modalStyles.metricValue}>{stats.backupsExportedCount}</div>
            <div className={modalStyles.metricLabel}>Backups Exported</div>
          </div>
        </div>

        {presetsList.length > 0 && (
          <>
            <h3 className={modalStyles.sectionHeader}>Preset Game Popularity</h3>
            <div className={modalStyles.presetList}>
              {presetsList.map(([name, count]) => (
                <div key={name} className={modalStyles.presetRow}>
                  <span className={modalStyles.presetName}>{name}</span>
                  <span className={modalStyles.presetCount}>{count} {count === 1 ? 'load' : 'loads'}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

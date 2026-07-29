import React from 'react';
import { Modal } from '../Modal';
import { dicePresets } from '../../utils/presets';
import type { DiceData, DiceConfig } from '../../types';
import { Trash2, FileDown, FileUp } from 'lucide-react';
import styles from '../../App.module.css';
import modalStyles from './Modals.module.css';

interface SetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedConfigs: Record<string, DiceConfig>;
  onLoadSet: (config: Partial<DiceData>[]) => void;
  onDeleteConfig: (name: string) => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SetsModal: React.FC<SetsModalProps> = ({
  isOpen,
  onClose,
  savedConfigs,
  onLoadSet,
  onDeleteConfig,
  onExportBackup,
  onImportBackup,
}) => {
  const userSaves = Object.values(savedConfigs).filter(c => c.name !== 'systemAutosave');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Games & Saves">
      <div className={styles.setsContainer}>
        <h3 className={modalStyles.sectionHeaderFirst}>Presets</h3>
        <div className={styles.setsGrid}>
          {dicePresets.map((preset) => (
            <button key={preset.name} className={`md-card ${styles.setCard}`} onClick={() => onLoadSet(preset.dice)}>
              {preset.name}
            </button>
          ))}
        </div>

        {userSaves.length > 0 && (
          <>
            <h3 className={modalStyles.sectionHeader}>Your Saves</h3>
            <div className={styles.setsGrid}>
              {userSaves.map((config) => (
                <div key={config.name} className={`md-card ${styles.setCard} ${styles.saveCard}`}>
                  <button className={styles.saveCardBtn} onClick={() => onLoadSet(config.config)}>
                    {config.name}
                  </button>
                  <button className="md-icon-button" onClick={(e) => { e.stopPropagation(); onDeleteConfig(config.name); }}>
                    <Trash2 size={16} color="var(--md-sys-color-error)" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className={modalStyles.sectionHeader}>Backup</h3>
        <div className={styles.setsGrid}>
          <button className={`md-card ${styles.setCard}`} onClick={onExportBackup} title="Export games & settings to a backup file" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <FileDown size={20} />
            <span>Export Backup</span>
          </button>
          <button className={`md-card ${styles.setCard}`} onClick={() => document.getElementById('import-backup-input-modal')?.click()} title="Import games & settings from a backup file" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <FileUp size={20} />
            <span>Import Backup</span>
          </button>
          <input 
            type="file" 
            id="import-backup-input-modal" 
            accept=".json" 
            onChange={onImportBackup} 
            style={{ display: 'none' }} 
          />
        </div>
      </div>
    </Modal>
  );
};

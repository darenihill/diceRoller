import React from 'react';
import { Modal } from '../Modal';
import { Volume2, VolumeX, ToggleLeft, ToggleRight, BarChart2 } from 'lucide-react';
import styles from '../../App.module.css';
import modalStyles from './Modals.module.css';

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  onSelectTheme: (theme: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  showModifier: boolean;
  onToggleModifier: () => void;
  telemetryEnabled: boolean;
  onToggleTelemetry: () => void;
  onOpenMetrics?: () => void;
}

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  soundEnabled,
  onToggleSound,
  showModifier,
  onToggleModifier,
  telemetryEnabled,
  onToggleTelemetry,
  onOpenMetrics,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customize App">
      <div className={modalStyles.formGroup}>
        <h3 className={modalStyles.sectionHeaderFirst}>Visual Themes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ margin: 0, padding: '16px 8px', backgroundColor: '#1E1E1E', color: '#FFF', border: theme === 'theme-dark' ? '2px solid var(--md-sys-color-primary)' : 'none' }}
            onClick={() => onSelectTheme('theme-dark')}
          >
            Default Dark
          </button>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ margin: 0, padding: '16px 8px', backgroundColor: '#F0F0F0', color: '#000', border: theme === 'theme-light' ? '2px solid var(--md-sys-color-primary)' : 'none' }}
            onClick={() => onSelectTheme('theme-light')}
          >
            Clean Light
          </button>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ margin: 0, padding: '16px 8px', backgroundColor: '#1B4D3E', color: '#FFF', border: theme === 'theme-felt' ? '2px solid #FFD700' : 'none' }}
            onClick={() => onSelectTheme('theme-felt')}
          >
            Casino Felt
          </button>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ margin: 0, padding: '16px 8px', backgroundColor: '#090B10', color: '#DFE0FF', border: theme === 'theme-midnight' ? '2px solid #8E99F3' : 'none' }}
            onClick={() => onSelectTheme('theme-midnight')}
          >
            Midnight
          </button>
        </div>

        <h3 className={modalStyles.sectionHeader}>Preferences</h3>
        <div className={modalStyles.formGroup}>
          {/* Sound Toggle */}
          <div className={modalStyles.toggleRow}>
            <div className={modalStyles.toggleLabelCol}>
              <span className={modalStyles.toggleTitle}>Sound Effects</span>
              <span className={modalStyles.toggleDesc}>Play synthesized rolling rattles & landing thuds</span>
            </div>
            <button 
              className="md-icon-button"
              onClick={onToggleSound}
              title={soundEnabled ? "Mute Sounds" : "Unmute Sounds"}
              style={{ padding: 8, borderRadius: '50%', background: soundEnabled ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-variant)' }}
            >
              {soundEnabled ? <Volume2 size={20} color="var(--md-sys-color-on-primary-container)" /> : <VolumeX size={20} />}
            </button>
          </div>

          {/* Modifier Toggle */}
          <div className={modalStyles.toggleRow}>
            <div className={modalStyles.toggleLabelCol}>
              <span className={modalStyles.toggleTitle}>Roll Modifier</span>
              <span className={modalStyles.toggleDesc}>Show mathematical offset adder bar</span>
            </div>
            <button 
              className="md-icon-button"
              onClick={onToggleModifier}
              title={showModifier ? "Hide Modifier" : "Show Modifier"}
              style={{ padding: 8, borderRadius: '50%', background: showModifier ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-variant)' }}
            >
              {showModifier ? <ToggleRight size={20} color="var(--md-sys-color-on-primary-container)" /> : <ToggleLeft size={20} />}
            </button>
          </div>

          {/* Usage Telemetry Privacy Toggle & Dashboard Access */}
          <div className={modalStyles.toggleRow}>
            <div className={modalStyles.toggleLabelCol}>
              <span className={modalStyles.toggleTitle}>Anonymous Page Metrics</span>
              <span className={modalStyles.toggleDesc}>Record anonymous feature usage stats & session telemetry</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onOpenMetrics && (
                <button 
                  className="md-button md-button-surface" 
                  onClick={onOpenMetrics}
                  style={{ padding: '6px 12px', fontSize: 12, height: 36 }}
                  title="View usage statistics dashboard"
                >
                  Stats
                </button>
              )}
              <button 
                className="md-icon-button"
                onClick={onToggleTelemetry}
                title={telemetryEnabled ? "Disable Telemetry" : "Enable Telemetry"}
                style={{ padding: 8, borderRadius: '50%', background: telemetryEnabled ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-variant)' }}
              >
                <BarChart2 size={20} color={telemetryEnabled ? "var(--md-sys-color-on-primary-container)" : "inherit"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

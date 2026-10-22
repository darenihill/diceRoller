import React from 'react';
import { Modal } from '../Modal';
import { Volume2, VolumeX, BarChart2 } from 'lucide-react';
import styles from '../../App.module.css';
import modalStyles from './Modals.module.css';
import { targetNote } from '../../utils/targets';
import { DICE_SCALE_DEFAULT, DICE_SCALE_MAX, DICE_SCALE_MIN } from '../../utils/diceUtils';

/** The selected theme gets the same ring as a focused die: the theme's accent, never gold. */
const SELECTED_OUTLINE = '3px solid var(--md-sys-color-primary)';

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  onSelectTheme: (theme: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  targetHighlight: string;
  onChangeTargetHighlight: (val: string) => void;
  telemetryEnabled: boolean;
  onToggleTelemetry: () => void;
  diceScale: number;
  onChangeDiceScale: (scale: number) => void;
}

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  soundEnabled,
  onToggleSound,
  targetHighlight,
  onChangeTargetHighlight,
  telemetryEnabled,
  onToggleTelemetry,
  diceScale,
  onChangeDiceScale,
}) => {
  const note = targetNote(targetHighlight);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customize App">
      <div className={modalStyles.formGroup}>
        <h3 className={modalStyles.sectionHeaderFirst}>Visual Themes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ margin: 0, padding: '16px 8px', backgroundColor: '#1E1E1E', color: '#FFF', outline: theme === 'theme-dark' ? SELECTED_OUTLINE : 'none', outlineOffset: 2 }}
            onClick={() => onSelectTheme('theme-dark')}
            aria-pressed={theme === 'theme-dark'}
          >
            Default Dark
          </button>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ margin: 0, padding: '16px 8px', backgroundColor: '#F0F0F0', color: '#000', outline: theme === 'theme-light' ? SELECTED_OUTLINE : 'none', outlineOffset: 2 }}
            onClick={() => onSelectTheme('theme-light')}
            aria-pressed={theme === 'theme-light'}
          >
            Clean Light
          </button>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ margin: 0, padding: '16px 8px', backgroundColor: '#1B4D3E', color: '#FFF', outline: theme === 'theme-felt' ? SELECTED_OUTLINE : 'none', outlineOffset: 2 }}
            onClick={() => onSelectTheme('theme-felt')}
            aria-pressed={theme === 'theme-felt'}
          >
            Casino Felt
          </button>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ margin: 0, padding: '16px 8px', backgroundColor: '#090B10', color: '#DFE0FF', outline: theme === 'theme-midnight' ? SELECTED_OUTLINE : 'none', outlineOffset: 2 }}
            onClick={() => onSelectTheme('theme-midnight')}
            aria-pressed={theme === 'theme-midnight'}
          >
            Midnight
          </button>
        </div>

        <h3 className={modalStyles.sectionHeader}>Preferences</h3>
        <div className={modalStyles.formGroup}>
          {/* Dice Size */}
          <div className={modalStyles.toggleLabelCol}>
            <div className={modalStyles.toggleRow}>
              <span className={modalStyles.toggleTitle} id="dice-size-label">Dice Size</span>
              {diceScale !== DICE_SCALE_DEFAULT && (
                <button className="md-button md-button-surface md-button-compact" onClick={() => onChangeDiceScale(DICE_SCALE_DEFAULT)}>
                  Reset
                </button>
              )}
            </div>
            <div className={modalStyles.sliderRow}>
              <span className={modalStyles.toggleDesc} aria-hidden="true">Smaller</span>
              <input
                type="range"
                min={DICE_SCALE_MIN}
                max={DICE_SCALE_MAX}
                step={0.1}
                value={diceScale}
                onChange={(e) => onChangeDiceScale(Number(e.target.value))}
                className={modalStyles.slider}
                aria-labelledby="dice-size-label"
                aria-valuetext={`${Math.round(diceScale * 100)}%`}
              />
              <span className={modalStyles.toggleDesc} aria-hidden="true">Bigger</span>
            </div>
          </div>

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
              aria-label="Sound effects"
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>

          {/* Target Total Highlight: a gentle note names any part that isn't a whole number */}
          <div>
            <div className={modalStyles.toggleRow}>
              <div className={modalStyles.toggleLabelCol}>
                <span className={modalStyles.toggleTitle}>Target Highlight</span>
                <span className={modalStyles.toggleDesc}>Celebrate when the roll total hits these numbers (comma-separated, e.g. 7, 11)</span>
              </div>
              <input
                type="text"
                value={targetHighlight}
                onChange={(e) => onChangeTargetHighlight(e.target.value)}
                placeholder="e.g. 7, 11"
                autoComplete="off"
                enterKeyHint="done"
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                className={`${modalStyles.formInput} ${note ? modalStyles.formInputInvalid : ''}`}
                style={{ width: 110, textAlign: 'center' }}
                aria-label="Target totals to highlight, comma-separated"
                aria-invalid={note ? true : undefined}
                aria-describedby={note ? 'target-note' : undefined}
              />
            </div>
            {note && (
              <p id="target-note" className={modalStyles.fieldNote} role="status">{note}</p>
            )}
          </div>

          {/* Usage Telemetry Privacy Toggle */}
          <div className={modalStyles.toggleRow}>
            <div className={modalStyles.toggleLabelCol}>
              <span className={modalStyles.toggleTitle}>Anonymous Page Metrics</span>
              <span className={modalStyles.toggleDesc}>Allow recording anonymous usage stats & session telemetry</span>
            </div>
            <button 
              className="md-icon-button"
              onClick={onToggleTelemetry}
              title={telemetryEnabled ? "Disable Telemetry" : "Enable Telemetry"}
              aria-label="Anonymous page metrics"
              aria-pressed={telemetryEnabled}
            >
              <BarChart2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

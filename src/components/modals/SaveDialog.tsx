import React from 'react';
import { Modal } from '../Modal';
import modalStyles from './Modals.module.css';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saveName: string;
  onChangeSaveName: (val: string) => void;
  /** Names of saves already on this device. */
  existingNames: string[];
  onSave: (mode: 'new' | 'keepBoth' | 'replace') => void;
}

export const SaveDialog: React.FC<SaveDialogProps> = ({
  isOpen,
  onClose,
  saveName,
  onChangeSaveName,
  existingNames,
  onSave,
}) => {
  const trimmed = saveName.trim();
  const taken = trimmed !== '' && existingNames.includes(trimmed);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Game">
      <div className={modalStyles.formGroup}>
        <label className={modalStyles.formLabel} htmlFor="save-game-name">Enter a name for this game:</label>
        <input 
          id="save-game-name"
          autoFocus
          autoComplete="off"
          enterKeyHint="done"
          type="text" 
          value={saveName} 
          onChange={(e) => onChangeSaveName(e.target.value)}
          className={modalStyles.formInput}
          aria-describedby={taken ? 'save-name-taken' : undefined}
          onKeyDown={(e) => e.key === 'Enter' && trimmed && !taken && onSave('new')}
        />
        {taken && (
          <p id="save-name-taken" className={modalStyles.formLabel} role="status" style={{ margin: 0 }}>
            You already have a save called “{trimmed}”.
          </p>
        )}
        <div className={modalStyles.buttonRow}>
          <button className="md-button md-button-surface" onClick={onClose}>Cancel</button>
          {taken ? (
            <>
              <button className="md-button md-button-surface" onClick={() => onSave('keepBoth')}>Keep both</button>
              <button className="md-button md-button-filled" onClick={() => onSave('replace')}>Replace it</button>
            </>
          ) : (
            <button className="md-button md-button-filled" onClick={() => onSave('new')} disabled={!trimmed}>Save</button>
          )}
        </div>
      </div>
    </Modal>
  );
};

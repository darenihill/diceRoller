import React from 'react';
import { Modal } from '../Modal';
import modalStyles from './Modals.module.css';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saveName: string;
  onChangeSaveName: (val: string) => void;
  onSave: () => void;
}

export const SaveDialog: React.FC<SaveDialogProps> = ({
  isOpen,
  onClose,
  saveName,
  onChangeSaveName,
  onSave,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Game">
      <div className={modalStyles.formGroup}>
        <label className={modalStyles.formLabel}>Enter a name for this game:</label>
        <input 
          autoFocus
          type="text" 
          value={saveName} 
          onChange={(e) => onChangeSaveName(e.target.value)}
          className={modalStyles.formInput}
          onKeyDown={(e) => e.key === 'Enter' && saveName.trim() && onSave()}
        />
        <div className={modalStyles.buttonRow}>
          <button className="md-button md-button-surface" onClick={onClose}>Cancel</button>
          <button className="md-button md-button-primary" onClick={onSave} disabled={!saveName.trim()}>Save</button>
        </div>
      </div>
    </Modal>
  );
};

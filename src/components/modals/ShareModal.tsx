import React from 'react';
import { Modal } from '../Modal';
import modalStyles from './Modals.module.css';

interface ShareModalProps {
  url: string | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ url, onClose }) => {
  return (
    <Modal isOpen={!!url} onClose={onClose} title="Share Link">
      <div className={modalStyles.formGroup}>
        <label className={modalStyles.formLabel}>Copy this link to share your dice configuration:</label>
        <input 
          type="text" 
          readOnly
          value={url || ''} 
          className={`${modalStyles.formInput} ${modalStyles.formInputReadOnly}`}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <div className={modalStyles.buttonRow}>
          <button className="md-button md-button-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </Modal>
  );
};

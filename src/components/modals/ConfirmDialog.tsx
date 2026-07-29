import React from 'react';
import { Modal } from '../Modal';
import modalStyles from './Modals.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "Are you sure you want to delete all dice?",
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={modalStyles.formGroup}>
        <p className={modalStyles.formLabel} style={{ margin: 0 }}>{message}</p>
        <div className={modalStyles.buttonRow}>
          <button className="md-button md-button-surface" onClick={onClose}>Cancel</button>
          <button 
            className="md-button" 
            style={{ backgroundColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error)' }} 
            onClick={onConfirm}
          >
            Delete All
          </button>
        </div>
      </div>
    </Modal>
  );
};

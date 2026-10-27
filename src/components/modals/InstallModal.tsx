import React from 'react';
import { Share, SquarePlus } from 'lucide-react';
import { Modal } from '../Modal';
import styles from './Modals.module.css';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** How to put Dice Roller on the home screen where the browser has no install box. */
export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Install Dice Roller">
    <p className={styles.installLead}>On iPhone or iPad, in Safari:</p>
    <ol className={styles.installSteps}>
      <li>
        <Share size={20} aria-hidden="true" />
        <span>Tap <strong>Share</strong> at the bottom of the screen.</span>
      </li>
      <li>
        <SquarePlus size={20} aria-hidden="true" />
        <span>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</span>
      </li>
    </ol>
    <p className={styles.installNote}>
      On other browsers, open the browser's menu and choose Install app or Add to Home Screen.
    </p>
    <button type="button" className="md-button md-button-filled" onClick={onClose}>Done</button>
  </Modal>
);

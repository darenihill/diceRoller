import React from 'react';
import { Modal } from '../Modal';
import modalStyles from './Modals.module.css';

interface ShareModalProps {
  url: string | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ url, onClose }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Remembers which link was copied, so a fresh link starts uncopied
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);
  const copied = !!url && copiedUrl === url;

  // Closing forgets the copy, so the box opens fresh next time
  const handleClose = () => { setCopiedUrl(null); onClose(); };

  const selectLink = () => inputRef.current?.select();

  const handleCopy = () => {
    if (!url) return;
    if (!navigator.clipboard) { selectLink(); return; }
    navigator.clipboard.writeText(url).then(
      () => setCopiedUrl(url),
      // Copy refused: select the link so a long-press or Ctrl+C copies it
      () => selectLink()
    );
  };

  return (
    <Modal isOpen={!!url} onClose={handleClose} title="Share Link">
      <div className={modalStyles.formGroup}>
        <label className={modalStyles.formLabel} htmlFor="share-link-url">Copy this link to share your dice configuration:</label>
        <input 
          id="share-link-url"
          ref={inputRef}
          type="text" 
          readOnly
          value={url || ''} 
          className={`${modalStyles.formInput} ${modalStyles.formInputReadOnly}`}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <div className={modalStyles.buttonRow}>
          <button className="md-button md-button-surface" onClick={handleClose}>Done</button>
          <button className="md-button md-button-filled" onClick={handleCopy} aria-live="polite">
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

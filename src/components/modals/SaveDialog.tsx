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
  // The filled-in name starts selected, so typing replaces it (owner, 2026-11-07)
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const box = inputRef.current;
      // setSelectionRange, since iOS Safari doesn't always honour select()
      box?.setSelectionRange(0, box.value.length);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);
  const taken = trimmed !== '' && existingNames.includes(trimmed);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save game">
      <div className={modalStyles.formGroup}>
        <label className={modalStyles.formLabel} htmlFor="save-game-name">Name for this game</label>
        <input 
          id="save-game-name"
          ref={inputRef}
          autoFocus
          data-autofocus
          autoComplete="off"
          enterKeyHint="done"
          type="text" 
          value={saveName} 
          onChange={(e) => onChangeSaveName(e.target.value)}
          className={modalStyles.formInput}
          aria-describedby={taken ? 'save-name-taken' : undefined}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            // Saving closes the dialog and hands focus to the menu button within
            // this key press, so the same Enter used to press that button and open
            // the menu (review 2026-11-10). Stopping its default keeps it to Save.
            e.preventDefault();
            // A taken name needs a choice, so Done just puts the keyboard away to show the buttons
            if (taken) e.currentTarget.blur();
            else if (trimmed) onSave('new');
          }}
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

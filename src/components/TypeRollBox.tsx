import { useState } from 'react';
import { parseRollNotation, type TypedRoll } from '../utils/rollNotation';
import styles from './TypeRollBox.module.css';

interface TypeRollBoxProps {
  onRoll: (roll: TypedRoll) => void;
  disabled?: boolean;
}

/** RPG mode: type 2d6+3, d20 adv or 1d8+2d6 and roll it in one go. */
export const TypeRollBox = ({ onRoll, disabled = false }: TypeRollBoxProps) => {
  const [text, setText] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const submit = (input: HTMLInputElement | null) => {
    const result = parseRollNotation(text);
    if (!result.ok) {
      setNote(result.note);
      return;
    }
    setNote(null);
    // Put the keyboard away so the dice are in view as they land
    input?.blur();
    onRoll(result.roll);
  };

  return (
    <form
      className={styles.box}
      aria-label="Type a roll"
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget.querySelector('input'));
      }}
    >
      <div className={styles.row}>
        <input
          className={`${styles.input} ${note ? styles.inputInvalid : ''}`}
          type="text"
          inputMode="text"
          enterKeyHint="go"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={40}
          placeholder="Type a roll: 2d6+3, d20 adv"
          aria-label="Type a roll, like 2d6+3 or d20 adv"
          aria-invalid={note ? true : undefined}
          aria-describedby={note ? 'type-roll-note' : undefined}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (note) setNote(null);
          }}
        />
        <button type="submit" className={`md-button md-button-filled ${styles.go}`} disabled={disabled || !text.trim()}>
          Roll
        </button>
      </div>
      <p id="type-roll-note" className={styles.note} role="status">{note ?? ''}</p>
    </form>
  );
};

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { parseRollNotation, type TypedRoll } from '../utils/rollNotation';
import { MAX_ROLL_NAME, type SavedRoll } from '../utils/savedRolls';
import styles from './TypeRollBox.module.css';

interface TypeRollBoxProps {
  /** A saved roll's button rolls it at once */
  onRoll: (roll: TypedRoll) => void;
  /** The box's + (and Enter) puts the typed dice out; the big Roll button rolls them */
  onPutOut?: (roll: TypedRoll) => void;
  disabled?: boolean;
  /** Rolls kept as buttons under the box */
  savedRolls?: SavedRoll[];
  onSaveRoll?: (roll: SavedRoll) => void;
  onRemoveSavedRoll?: (name: string) => void;
  /** A roll put back from History; a new `n` fills the box again */
  prefill?: { text: string; n: number };
  /** Hears what the box holds, so the big Roll button can roll it too */
  onTextChange?: (text: string) => void;
}

/** RPG mode: type 2d6+3, d20 adv or 1d8+2d6 and roll it in one go. */
export const TypeRollBox = ({ onRoll, onPutOut, disabled = false, savedRolls = [], onSaveRoll, onRemoveSavedRoll, prefill, onTextChange }: TypeRollBoxProps) => {
  const [text, setText] = useState('');
  // On a phone the box shares the top line with the name, so the hint is shorter
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 600px)').matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(max-width: 600px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  // A roll tapped in History lands in the box, ready to roll
  const [filledN, setFilledN] = useState<number | undefined>();
  if (prefill && prefill.n !== filledN) {
    setFilledN(prefill.n);
    setText(prefill.text);
  }
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => { onTextChange?.(text); }, [text, onTextChange]);
  // The roll being named, once Save this roll is tapped
  const [naming, setNaming] = useState<TypedRoll | null>(null);
  const [name, setName] = useState('');

  const submit = (input: HTMLInputElement | null) => {
    const result = parseRollNotation(text);
    if (!result.ok) {
      setNote(result.note);
      return;
    }
    setNote(null);
    // Put the keyboard away so the dice are in view
    input?.blur();
    // + puts the dice out to roll with the big Roll button (owner, 2026-11-10)
    (onPutOut ?? onRoll)(result.roll);
  };

  const startSave = () => {
    const result = parseRollNotation(text);
    if (!result.ok) {
      setNote(result.note);
      return;
    }
    setNote(null);
    setNaming(result.roll);
    setName('');
  };

  const finishSave = () => {
    if (!naming) return;
    // An empty name keeps the roll itself as the button's label
    const label = (name.trim() || naming.text).slice(0, MAX_ROLL_NAME);
    onSaveRoll?.({ name: label, text: naming.text });
    setNaming(null);
    setName('');
  };

  const rollSaved = (saved: SavedRoll) => {
    const result = parseRollNotation(saved.text);
    if (result.ok) onRoll(result.roll);
  };

  return (
    <div className={styles.box}>
      <form
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
            enterKeyHint={onPutOut ? 'done' : 'go'}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={40}
            placeholder={narrow ? 'Like 2d6+3' : 'Type a roll: 2d6+3, d20 adv'}
            aria-label="Type a roll, like 2d6+3 or d20 adv"
            aria-invalid={note ? true : undefined}
            aria-describedby={note ? 'type-roll-note' : undefined}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (note) setNote(null);
            }}
          />
          <button
            type="submit"
            className={`md-button md-button-surface ${onPutOut ? styles.add : styles.go}`}
            disabled={disabled || !text.trim()}
            aria-label={onPutOut ? 'Put out these dice' : undefined}
            title={onPutOut ? 'Put out these dice, then tap Roll' : undefined}
          >
            {onPutOut ? <Plus size={22} strokeWidth={2.5} aria-hidden="true" /> : 'Roll'}
          </button>
        </div>
        <p id="type-roll-note" className={styles.note} role="status">{note ?? ''}</p>
      </form>

      {onSaveRoll && text.trim() && !naming && (
        <button type="button" className={styles.saveLink} onClick={startSave}>
          Save this roll
        </button>
      )}

      {naming && (
        <form
          className={styles.nameRow}
          aria-label="Name this roll"
          onSubmit={(e) => {
            e.preventDefault();
            finishSave();
          }}
        >
          <input
            className={styles.input}
            type="text"
            enterKeyHint="done"
            autoComplete="off"
            maxLength={MAX_ROLL_NAME}
            placeholder={naming.text}
            aria-label={`Name for ${naming.text}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <button type="submit" className={`md-button md-button-surface ${styles.go}`}>Save</button>
          <button type="button" className={`md-button md-button-surface ${styles.go}`} onClick={() => setNaming(null)}>Cancel</button>
        </form>
      )}

      {savedRolls.length > 0 && (
        <ul className={styles.saved} aria-label="Saved rolls">
          {savedRolls.map(saved => (
            <li key={saved.name} className={styles.savedItem}>
              <button
                type="button"
                className={styles.savedRoll}
                onClick={() => rollSaved(saved)}
                disabled={disabled}
                title={saved.text}
                aria-label={saved.name === saved.text ? `Roll ${saved.text}` : `Roll ${saved.name}: ${saved.text}`}
              >
                <span className={styles.savedName}>{saved.name}</span>
                {saved.name !== saved.text && <span className={styles.savedText}>{saved.text}</span>}
              </button>
              {onRemoveSavedRoll && (
                <button
                  type="button"
                  className={styles.savedRemove}
                  onClick={() => onRemoveSavedRoll(saved.name)}
                  aria-label={`Remove ${saved.name}`}
                  title={`Remove ${saved.name}`}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

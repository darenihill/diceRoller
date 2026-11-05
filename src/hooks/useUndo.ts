import { useCallback, useEffect, useRef, useState } from 'react';

/** Seven seconds, the same in every app (app standards, standard 2) */
export const UNDO_WINDOW_MS = 7000;

export interface UndoOffer {
  message: string;
  undo: () => void;
  /** What to say once it is back, e.g. "d20 is back" */
  back: string;
  /** A big change (clearing many, loading a set): no ×, it keeps the full time */
  big: boolean;
  /** Changes with each new offer, so the countdown restarts */
  key: number;
}

export interface UndoOptions {
  back?: string;
  big?: boolean;
}

/** "Removed d20" → "d20 is back", "Cleared 4 rolls" → "4 rolls are back" */
export function backMessage(message: string): string {
  const cleared = message.match(/^Cleared (.+)$/);
  if (cleared) return `${cleared[1]} ${/^1 /.test(cleared[1]) ? 'is' : 'are'} back`;
  const gone = message.match(/^(?:Removed|Deleted) (.+)$/);
  // Names keep their own case (d20 stays d20); only "face" starts the sentence
  if (gone) return `${gone[1].replace(/^face /, 'Face ')} is back`;
  if (/^Replaced \d+ faces$/.test(message)) return 'Faces are back';
  if (/^(Loaded|Opened|Rolled) /.test(message) || message === 'Loaded dice') return 'Your dice are back';
  return 'Undone';
}

/**
 * One Undo offer at a time, open for seven seconds. The time pauses while the
 * bar is touched and a newer action replaces it (app standards, standard 2).
 */
export function useUndo(windowMs = UNDO_WINDOW_MS) {
  const [offer, setOffer] = useState<UndoOffer | null>(null);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const endsAt = useRef(0);
  const left = useRef(windowMs);
  const seq = useRef(0);

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    setOffer(null);
    setPaused(false);
  }, []);

  const offerUndo = useCallback((message: string, undo: () => void, options: UndoOptions = {}) => {
    window.clearTimeout(timer.current);
    seq.current += 1;
    setOffer({ message, undo, back: options.back ?? backMessage(message), big: !!options.big, key: seq.current });
    setPaused(false);
    left.current = windowMs;
    endsAt.current = Date.now() + windowMs;
    timer.current = window.setTimeout(() => setOffer(null), windowMs);
  }, [windowMs]);

  /** Touching the bar stops the clock; letting go starts it again */
  const pause = useCallback(() => {
    if (!offer || paused) return;
    window.clearTimeout(timer.current);
    left.current = Math.max(0, endsAt.current - Date.now());
    setPaused(true);
  }, [offer, paused]);

  const resume = useCallback(() => {
    if (!offer || !paused) return;
    endsAt.current = Date.now() + left.current;
    timer.current = window.setTimeout(() => setOffer(null), left.current);
    setPaused(false);
  }, [offer, paused]);

  /** Runs the undo and returns what to say ("d20 is back"), or null */
  const runUndo = useCallback((): string | null => {
    if (!offer) return null;
    offer.undo();
    dismiss();
    return offer.back;
  }, [offer, dismiss]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { offer, offerUndo, runUndo, dismiss, pause, resume, paused };
}

/** Short name for a die in messages: its own name, else d6, d20 and so on. */
export function dieLabel(die: { name?: string; faces: number }): string {
  return die.name?.trim() || `d${die.faces}`;
}

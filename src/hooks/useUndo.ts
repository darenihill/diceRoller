import { useCallback, useEffect, useRef, useState } from 'react';

export const UNDO_WINDOW_MS = 5000;

export interface UndoOffer {
  message: string;
  undo: () => void;
}

/** One "Removed X · Undo" offer at a time, open for five seconds. */
export function useUndo(windowMs = UNDO_WINDOW_MS) {
  const [offer, setOffer] = useState<UndoOffer | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    setOffer(null);
  }, []);

  const offerUndo = useCallback((message: string, undo: () => void) => {
    window.clearTimeout(timer.current);
    setOffer({ message, undo });
    timer.current = window.setTimeout(() => setOffer(null), windowMs);
  }, [windowMs]);

  const runUndo = useCallback(() => {
    if (!offer) return;
    offer.undo();
    dismiss();
  }, [offer, dismiss]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { offer, offerUndo, runUndo, dismiss };
}

/** Short name for a die in messages: its own name, else d6, d20 and so on. */
export function dieLabel(die: { name?: string; faces: number }): string {
  return die.name?.trim() || `d${die.faces}`;
}

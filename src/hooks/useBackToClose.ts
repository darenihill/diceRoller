import { useEffect, useRef } from 'react';

/*
 * Phone Back closes whatever is open (a dialog or the menu) before it leaves
 * the app. While anything is open, one extra history step sits on top; Back
 * removes it and closes only the top-most open thing. Closing any other way
 * (X, Escape, tapping outside) takes the extra step back off quietly.
 */

interface Entry {
  close: () => void;
  byBack: boolean;
}

const STATE_KEY = 'diceOverlay';
const stack: Entry[] = [];
let armed = false;
let ignorePops = 0;
let listening = false;

const ourStep = () => !!(window.history.state && window.history.state[STATE_KEY]);

const arm = () => {
  if (armed) return;
  window.history.pushState({ ...(window.history.state ?? {}), [STATE_KEY]: true }, '');
  armed = true;
};

const onPopState = () => {
  if (ignorePops > 0) {
    ignorePops--;
    return;
  }
  armed = false;
  const top = stack.pop();
  if (!top) return;
  top.byBack = true;
  // Something else is still open underneath: keep one step for it
  if (stack.length > 0) arm();
  top.close();
};

const disarmSoon = () => {
  // Wait a tick so a dialog that closes as another opens keeps the same step
  window.setTimeout(() => {
    if (stack.length > 0 || !armed) return;
    armed = false;
    if (ourStep()) {
      ignorePops++;
      window.history.back();
    }
  }, 0);
};

export function useBackToClose(isOpen: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (!listening) {
      window.addEventListener('popstate', onPopState);
      listening = true;
    }
    const entry: Entry = { close: () => closeRef.current(), byBack: false };
    stack.push(entry);
    arm();
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      if (!entry.byBack) disarmSoon();
    };
  }, [isOpen]);
}

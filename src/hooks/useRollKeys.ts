import { useEffect, useRef } from 'react';

/** Something the player is typing in, where Space and R are letters. */
const isTyping = (el: Element | null) =>
  !!el && (el.matches('input, textarea, select') || (el as HTMLElement).isContentEditable);

/**
 * Space or R rolls on a computer. It never rolls by surprise: not while typing,
 * not with a window or the menu open, not with a die or other button selected,
 * and not when a key is held down or pressed with Ctrl, Alt or Cmd.
 */
export function useRollKeys(onRoll: () => void, blocked: boolean) {
  const latest = useRef({ onRoll, blocked });
  useEffect(() => {
    latest.current = { onRoll, blocked };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isRollKey = e.code === 'Space' || e.key === ' ' || e.key === 'r' || e.key === 'R';
      if (!isRollKey || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      if (latest.current.blocked || document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      const focused = document.activeElement;
      // R also works with Roll selected; Space there is the button's own press
      const onRollButton = !!focused?.matches('[aria-label="Roll dice"]') && e.code !== 'Space' && e.key !== ' ';
      // Anything else selected other than the page itself keeps its own keys
      const onPage = !focused || focused === document.body || focused === document.documentElement;
      if (isTyping(focused) || (!onPage && !onRollButton)) return;
      e.preventDefault();
      latest.current.onRoll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

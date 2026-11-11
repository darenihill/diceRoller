import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** How far a swipe down must go to close a sheet */
export const SHEET_CLOSE_PX = 60;
/** A quicker flick down than this, in px per ms, closes it however short */
export const SHEET_FLICK_PX_PER_MS = 0.5;
/** How long a sheet takes to slide down before it goes */
export const SHEET_EXIT_MS = 200;

/** The app's phone width, as in the menu and bottom bar CSS */
export const PHONE_QUERY = '(max-width: 468px)';

const reducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Swipe down to close, like a phone's bottom sheet: the sheet follows the
 * finger down, and past SHEET_CLOSE_PX or on a quick flick it slides away;
 * short of that it springs back. A tap on a button is still a tap, and the
 * click that ends a swipe is swallowed. Shared by the die buttons' sheet,
 * every dialog and the menu on a phone (owner, 2026-11-10 and 2026-11-11).
 * Spread `handlers` on the grab bar, give the sheet `bodyRef` so a swipe
 * anywhere on it works too, put `dy` on the sheet
 * as `translate`, and turn its transition off while `dragging`.
 */
export function useSheetDrag(onClose?: () => void) {
  const drag = useRef<{ y: number; x: number; id: number; on: boolean; lastY: number; lastT: number; v: number } | null>(null);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  // When the last drag ended: only the click right after it is swallowed
  const dragged = useRef(0);
  const exitTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(exitTimer.current), []);
  const bodyCleanup = useRef<(() => void) | undefined>(undefined);

  // The drag itself, fed by the grab bar's pointer events and by touches
  // anywhere on the sheet (bodyRef)
  const begin = (x: number, y: number, id: number) => {
    dragged.current = 0;
    drag.current = { y, x, id, on: false, lastY: y, lastT: Date.now(), v: 0 };
  };
  /** True once the move is a drag down */
  const follow = (x: number, y: number) => {
    const d = drag.current;
    if (!d) return false;
    const my = y - d.y, mx = x - d.x;
    if (!d.on) {
      // Only a mostly downward move counts
      if (my < 10 || my < Math.abs(mx)) return false;
      d.on = true;
      setDragging(true);
    }
    const now = Date.now();
    const step = (y - d.lastY) / Math.max(8, now - d.lastT);
    d.v = 0.6 * step + 0.4 * d.v;
    d.lastY = y;
    d.lastT = now;
    setDy(Math.max(0, my));
    return true;
  };
  const finish = (y: number) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.on) return;
    dragged.current = Date.now();
    setDragging(false);
    if (Date.now() - d.lastT > 100) d.v = 0;
    const moved = y - d.y;
    // A flick back up at the end means "keep it", as phone sheets do
    if (onClose && d.v > -0.1 && (moved >= SHEET_CLOSE_PX || d.v > SHEET_FLICK_PX_PER_MS)) {
      if (reducedMotion()) { onClose(); return; }
      setDy(window.innerHeight);
      exitTimer.current = window.setTimeout(onClose, SHEET_EXIT_MS);
      return;
    }
    setDy(0);
  };
  const cancel = () => { drag.current = null; setDragging(false); setDy(0); };

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      begin(e.clientX, e.clientY, e.pointerId);
      // A finger keeps sending its moves here by itself; a mouse leaves a
      // short grab bar (the menu's is 28px) before the drag starts, so hold
      // it from the press. Never on a button or link, so their clicks stay
      // theirs (second read, 2026-11-11)
      if (e.pointerType !== 'touch' && !(e.target as Element).closest?.('button, a, input, select, textarea')) {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const was = d.on;
      if (follow(e.clientX, e.clientY) && !was) (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    onPointerUp: (e: React.PointerEvent) => finish(e.clientY),
    onPointerCancel: cancel,
    onClickCapture: (e: React.MouseEvent) => {
      if (dragged.current && Date.now() - dragged.current < 1000) { dragged.current = 0; e.stopPropagation(); e.preventDefault(); }
    },
  };

  // The latest drag steps for the touch listeners, which are set once
  const steps = useRef({ begin, follow, finish, cancel });
  useEffect(() => { steps.current = { begin, follow, finish, cancel }; });

  /**
   * Put on the whole sheet so a swipe down from anywhere on it closes it,
   * not only from the grab bar (owner, 2026-11-11: "swipe down the popup
   * menu from anywhere in the menu"). Its content still scrolls: the swipe
   * only takes over when nothing under the finger is scrolled down, and an
   * upward or sideways start is left to scroll. Touch only; a mouse drags
   * by the grab bar.
   */
  const bodyRef = useCallback((el: HTMLElement | null) => {
    bodyCleanup.current?.();
    bodyCleanup.current = undefined;
    if (!el) return;
    // Whether this touch belongs to the scroll, decided on its first move
    let scroll = false;
    const scrolledDown = (t: EventTarget | null) => {
      for (let n = t instanceof Element ? t : null; n && n !== el.parentElement; n = n.parentElement) {
        if (n.scrollTop > 0) return true;
      }
      return false;
    };
    const start = (e: TouchEvent) => {
      // The grab bar has its own pointer drag; a second finger is a pinch
      // and a text box, picker or slider keeps its own drags
      if (e.touches.length !== 1 || (e.target as Element).closest?.('[data-sheet-grab], input, textarea, select, [role="slider"], canvas')) { scroll = true; return; }
      scroll = scrolledDown(e.target);
      if (!scroll) { const t = e.touches[0]; steps.current.begin(t.clientX, t.clientY, t.identifier); }
    };
    const move = (e: TouchEvent) => {
      const d = drag.current;
      if (scroll || !d) return;
      const t = Array.from(e.touches).find(p => p.identifier === d.id);
      if (!t) return;
      const my = t.clientY - d.y, mx = t.clientX - d.x;
      if (!d.on && (my < 0 || Math.abs(mx) > my)) {
        // Up or sideways: the content's to scroll, not ours
        if (Math.abs(my) + Math.abs(mx) >= 10) { scroll = true; drag.current = null; }
        return;
      }
      // Down at the top: nothing to scroll, so keep the page from taking it
      if (e.cancelable) e.preventDefault();
      steps.current.follow(t.clientX, t.clientY);
    };
    const end = (e: TouchEvent) => {
      const d = drag.current;
      if (scroll || !d) return;
      const t = Array.from(e.changedTouches).find(p => p.identifier === d.id);
      if (!t) return;
      if (d.on && e.cancelable) e.preventDefault();
      steps.current.finish(t.clientY);
    };
    const stop = () => { if (!scroll && drag.current) steps.current.cancel(); };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', stop);
    bodyCleanup.current = () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', stop);
    };
  }, []);

  return { handlers, bodyRef, dy, dragging, style: dy ? { translate: `0 ${dy}px` } : undefined };
}

const subscribePhone = (cb: () => void) => {
  if (typeof window.matchMedia !== 'function') return () => {};
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener?.('change', cb);
  return () => mq.removeEventListener?.('change', cb);
};
const isPhone = () => typeof window.matchMedia === 'function' && window.matchMedia(PHONE_QUERY).matches;

/** True at the phone width, following rotation and resizing */
export const usePhoneWidth = () => useSyncExternalStore(subscribePhone, isPhone, () => false);

const subscribeViewport = (cb: () => void) => {
  const vv = window.visualViewport;
  if (!vv) return () => {};
  vv.addEventListener('resize', cb);
  vv.addEventListener('scroll', cb);
  return () => { vv.removeEventListener('resize', cb); vv.removeEventListener('scroll', cb); };
};
const keyboardHeight = () => {
  const vv = window.visualViewport;
  // Pinch zoom also shrinks the visible area; only an unzoomed one is the keyboard
  if (!vv || vv.scale > 1.01) return 0;
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
};

/**
 * How much of the screen's bottom the phone keyboard covers, so a sheet can
 * sit above it and a focused text box stays in sight (standard 20). Phones
 * that shrink the page for the keyboard report 0, as nothing is covered.
 */
export const useKeyboardInset = (on: boolean) => {
  const h = useSyncExternalStore(subscribeViewport, keyboardHeight, () => 0);
  return on ? h : 0;
};

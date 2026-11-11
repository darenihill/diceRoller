import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';

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
 * Spread `handlers` on the part that takes the drag, put `dy` on the sheet
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

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.on) return;
    dragged.current = Date.now();
    setDragging(false);
    if (Date.now() - d.lastT > 100) d.v = 0;
    const moved = e.clientY - d.y;
    // A flick back up at the end means "keep it", as phone sheets do
    if (onClose && d.v > -0.1 && (moved >= SHEET_CLOSE_PX || d.v > SHEET_FLICK_PX_PER_MS)) {
      if (reducedMotion()) { onClose(); return; }
      setDy(window.innerHeight);
      exitTimer.current = window.setTimeout(onClose, SHEET_EXIT_MS);
      return;
    }
    setDy(0);
  };

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      dragged.current = 0;
      drag.current = { y: e.clientY, x: e.clientX, id: e.pointerId, on: false, lastY: e.clientY, lastT: Date.now(), v: 0 };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const my = e.clientY - d.y, mx = e.clientX - d.x;
      if (!d.on) {
        // Only a mostly downward move counts
        if (my < 10 || my < Math.abs(mx)) return;
        d.on = true;
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
      const now = Date.now();
      const step = (e.clientY - d.lastY) / Math.max(8, now - d.lastT);
      d.v = 0.6 * step + 0.4 * d.v;
      d.lastY = e.clientY;
      d.lastT = now;
      setDy(Math.max(0, my));
    },
    onPointerUp: endDrag,
    onPointerCancel: () => { drag.current = null; setDragging(false); setDy(0); },
    onClickCapture: (e: React.MouseEvent) => {
      if (dragged.current && Date.now() - dragged.current < 1000) { dragged.current = 0; e.stopPropagation(); e.preventDefault(); }
    },
  };

  return { handlers, dy, dragging, style: dy ? { translate: `0 ${dy}px` } : undefined };
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

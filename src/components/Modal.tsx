import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import { useBackToClose } from '../hooks/useBackToClose';
import { useSheetDrag, usePhoneWidth, useKeyboardInset } from '../hooks/useSheetDrag';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Shown in the title bar in place of the title, e.g. tabs; the title still names the dialog */
  header?: React.ReactNode;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, header, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  // Phone Back closes the dialog instead of leaving the app
  useBackToClose(isOpen, onClose);

  // Close on Escape, and keep Tab inside the dialog while it is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(el => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // Wrap at both ends, and pull focus back in if it has escaped the panel
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Move focus into the dialog on open and hand it back to the trigger on close
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const openedPanel = panelRef.current;

    const id = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      // Prefer a real control the user is likely to want. React's autoFocus
      // leaves no attribute behind, so a field that should get the typing
      // also carries data-autofocus (fresh eyes, 2026-11-05: Save's name box)
      const target = panel.querySelector<HTMLElement>('[autofocus], [data-autofocus]')
        ?? panel.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 0);

    return () => {
      window.clearTimeout(id);
      // A dialog opened from the menu: the menu closed as it opened and its tile
      // is gone (or a field inside the dialog took focus first, as Save's name
      // box does), so focus goes to the menu button instead of falling to the
      // page's start (stories review, 2026-11-09)
      const lost = !previous || previous === document.body || !previous.isConnected
        || !!openedPanel?.contains(previous);
      const back = lost ? document.querySelector<HTMLElement>('[data-return-focus]') : previous;
      back?.focus?.();
    };
  }, [isOpen]);

  const phone = usePhoneWidth();
  const keyboard = useKeyboardInset(isOpen && phone);

  // When the phone keyboard comes up, keep the text box being typed in in sight
  useEffect(() => {
    if (!keyboard) return;
    const active = document.activeElement as HTMLElement | null;
    if (active && panelRef.current?.contains(active) && active.matches('input, textarea, select, [contenteditable="true"]')) {
      active.scrollIntoView?.({ block: 'nearest' });
    }
  }, [keyboard]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
          style={keyboard ? ({ '--keyboard': `${keyboard}px` } as React.CSSProperties) : undefined}
        >
          <ModalPanel panelRef={panelRef} phone={phone} title={title} header={header} onClose={onClose}>
            {children}
          </ModalPanel>
        </div>
      )}
    </AnimatePresence>
  );
};

interface PanelProps {
  panelRef: React.RefObject<HTMLDivElement | null>;
  phone: boolean;
  title: string;
  header?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * The dialog itself. On a phone it is a bottom sheet (owner, 2026-11-10,
 * Build "sheet"): full width from the bottom edge, a grab bar on top, and a
 * drag down on the grab bar or title bar closes it, as the die buttons'
 * sheet does. It mounts fresh on each open, so a drag never carries over.
 * On a computer it stays the box in the middle.
 */
const ModalPanel: React.FC<PanelProps> = ({ panelRef, phone, title, header, onClose, children }) => {
  const sheet = useSheetDrag(phone ? onClose : undefined);
  const motionProps = phone
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] as const } }
    : { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 }, transition: { duration: 0.2, ease: 'easeOut' as const } };
  const head = (
    <div className={styles.header}>
      {header ?? <h2 className={styles.title}>{title}</h2>}
      <button className="md-icon-button" onClick={onClose} aria-label="Close dialog" style={{ width: 48, height: 48 }}>
        <X size={20} />
      </button>
    </div>
  );
  return (
    <motion.div
      ref={panelRef}
      className={`${styles.modal} ${phone ? styles.sheet : ''} ${sheet.dragging ? styles.dragging : ''} md-card`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-sheet={phone ? '' : undefined}
      {...motionProps}
      style={sheet.style}
      onClick={(e) => e.stopPropagation()}
    >
      {phone ? (
        <div className={styles.grab} data-sheet-grab="" {...sheet.handlers}>
          <div className={styles.handle} aria-hidden="true" />
          {head}
        </div>
      ) : head}
      <div className={styles.content}>
        {children}
      </div>
    </motion.div>
  );
};

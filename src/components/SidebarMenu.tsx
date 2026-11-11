import React, { useEffect, useRef } from 'react';
import styles from './SidebarMenu.module.css';
import { useBackToClose } from '../hooks/useBackToClose';
import { useSheetDrag, usePhoneWidth } from '../hooks/useSheetDrag';
import { Coffee, Lightbulb, HelpCircle, History, Dice6, Trash2, Save, Share2, Palette, Pin, ToggleLeft, ToggleRight, BarChart2, Download } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Material 3 "emphasized" easing for the menu icon turning into a close icon
const ICON_EASE = [0.2, 0, 0, 1] as const;

/** Three-line menu icon that turns into a close X when the menu is open. */
const MenuIcon: React.FC<{ open: boolean }> = ({ open }) => {
  const reduce = useReducedMotion();
  const transition = { duration: reduce ? 0 : 0.3, ease: ICON_EASE };
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <motion.line initial={false} animate={open ? { x1: 6, y1: 6, x2: 18, y2: 18 } : { x1: 4, y1: 6, x2: 20, y2: 6 }} transition={transition} />
      <motion.line initial={false} x1={4} y1={12} x2={20} y2={12} animate={{ opacity: open ? 0 : 1 }} transition={transition} />
      <motion.line initial={false} animate={open ? { x1: 6, y1: 18, x2: 18, y2: 6 } : { x1: 4, y1: 18, x2: 20, y2: 18 }} transition={transition} />
    </svg>
  );
};

interface SidebarMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onDonate: () => void;
  onIdeas: () => void;
  onHelp: () => void;
  onHistory: () => void;
  onStats: () => void;
  onSets: () => void;
  onCustomize: () => void;
  onDeleteAll: () => void;
  onSave: () => void;
  onShare: () => void;
  onSetDefault: () => void;
  rpgMode: boolean;
  onToggleRpgMode: () => void;
  tableView: boolean;
  onToggleTableView: () => void;
  /** Install app tile; left out once the app runs from the home screen */
  onInstall?: () => void;
  /** A dialog is open: a menu closing because a tile opened one goes at once,
      so on a phone the dialog's sheet takes its place in the same spot */
  dialogOpen?: boolean;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen, onToggle, onDonate, onIdeas, onHelp, onHistory, onStats, onSets, onCustomize, onDeleteAll, onSave, onShare, onSetDefault, rpgMode, onToggleRpgMode, tableView, onToggleTableView, onInstall, dialogOpen = false
}) => {
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Escape closes the menu, as it does every dialog, and focus goes back to the menu button
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      // A dialog opened from the menu takes Escape first
      if (e.key !== 'Escape' || document.querySelector('[aria-modal="true"]')) return;
      onToggle();
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onToggle]);

  // Phone Back closes the menu instead of leaving the app
  useBackToClose(isOpen, onToggle);
  // On a phone the menu is the same bottom sheet as the dialogs (the Desk
  // card's answer to Daren's "Does it slide up from the bottom as well?",
  // 2026-11-11): from the bottom edge, with a grab bar to drag it down
  const phone = usePhoneWidth();
  return (
    <>
      <div className={styles.toggleContainer}>
        <button ref={toggleRef} className={`md-icon-button control-ring ${styles.toggleBtn} ${isOpen ? styles.toggleBtnOpen : ''}`} onClick={onToggle}
          title="Menu"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          data-return-focus
        >
          <MenuIcon open={isOpen} />
        </button>
      </div>

      <AnimatePresence custom={{ phone, swap: dialogOpen }}>
        {isOpen && (
          <>
            <div 
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 98, cursor: 'default' }} 
              onClick={onToggle}
            />
            <MenuPanel phone={phone} dialogOpen={dialogOpen} onClose={onToggle}>
              {/* Three groups of four, so the columns line up (owner, 2026-11-02).
                  On a phone each group shows its heading word and a light tint, so
                  groups read without relying on color (owner, 2026-11-07; way A).
                  The shapes beside the headings came out (owner, 2026-11-10).
                  Most used sits far right (owner, 2026-11-02): Saves is the right-hand
                  group, and each group ends with its most used tile, which is the
                  right-hand tile of its row on a phone */}
              <div className={`${styles.menuColumn} ${styles.groupApp}`}>
                <div className={styles.menuColumnHeader}>App</div>
                <button className={styles.menuItem} onClick={onDonate}><Coffee size={18} /> <span>Donate</span></button>
                <button className={styles.menuItem} onClick={onIdeas}><Lightbulb size={18} /> <span>Feedback</span></button>
                <button className={styles.menuItem} onClick={onShare}><Share2 size={18} /> <span>Share</span></button>
                <button className={styles.menuItem} onClick={onHelp}><HelpCircle size={18} /> <span>Help</span></button>
              </div>

              <div className={`${styles.menuColumn} ${styles.groupSettings}`}>
                <div className={styles.menuColumnHeader}>Settings</div>
                <button className={styles.menuItem} onClick={onStats}><BarChart2 size={18} /> <span>Usage stats</span></button>
                <button className={styles.menuItem} onClick={onCustomize}><Palette size={18} /> <span>Customize</span></button>
                <button className={styles.menuItem} onClick={onToggleTableView} aria-pressed={tableView}
                  title="Show each roll's total big for the whole table">
                  {tableView ? <ToggleRight size={18} color="var(--md-sys-color-primary)" /> : <ToggleLeft size={18} />}
                  <span>Table view</span>
                </button>
                <button className={styles.menuItem} onClick={onToggleRpgMode} title="RPG mode: D&D dice, modifier and advantage" aria-pressed={rpgMode}>
                  {rpgMode ? <ToggleRight size={18} color="var(--md-sys-color-primary)" /> : <ToggleLeft size={18} />}
                  <span>RPG mode</span>
                </button>
              </div>

              <div className={`${styles.menuColumn} ${styles.groupSaves}`}>
                <div className={styles.menuColumnHeader}>Saves</div>
                <button className={styles.menuItem} onClick={onSetDefault} title="Open with these dice every time"><Pin size={18} /> <span>Set default</span></button>
                <button className={styles.menuItem} onClick={onSave}><Save size={18} /> <span>Save</span></button>
                <button className={styles.menuItem} onClick={onHistory}><History size={18} /> <span>History</span></button>
                <button className={styles.menuItem} onClick={onSets}><Dice6 size={18} /> <span>Games</span></button>
              </div>

              {/* Full-width bottom row: Install app (until the app is on the home
                  screen) beside Clear all, so the groups above stay four each */}
              <div className={styles.menuFooterRow}>
                {onInstall && (
                  <button className={`${styles.menuItem} ${styles.menuFooterItem} ${styles.menuInstallItem}`} onClick={onInstall} title="Put Dice Roller on your home screen">
                    <Download size={18} /> <span>Install app</span>
                  </button>
                )}
                <button
                  className={`${styles.menuItem} ${styles.menuFooterItem}`}
                  onClick={onDeleteAll}
                >
                  <Trash2 size={18} /> <span>Clear all</span>
                </button>
              </div>
            </MenuPanel>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/** Opening and closing: a short rise on a computer; on a phone the sheet
    slides up from the bottom edge and back down, or goes at once when a tile
    opened a dialog, whose sheet comes up in its place */
const panelVariants = {
  hidden: ({ phone, swap }: { phone: boolean; swap: boolean }) =>
    swap ? { opacity: 0, transition: { duration: 0 } }
      : phone ? { y: '100%', transition: { duration: 0.2 } }
      : { y: 20, opacity: 0, transition: { duration: 0.2 } },
  shown: ({ phone }: { phone: boolean }) =>
    phone ? { y: 0, opacity: 1, transition: { duration: 0.25, ease: ICON_EASE } } : { y: 0, opacity: 1, transition: { duration: 0.2 } },
};

const MenuPanel: React.FC<{ phone: boolean; dialogOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ phone, dialogOpen, onClose, children }) => {
  // Mounts fresh on each open, so a drag never carries over
  const sheet = useSheetDrag(phone ? onClose : undefined);
  return (
    <motion.div
      className={`${styles.menu} ${phone ? styles.sheet : ''} ${sheet.dragging ? styles.dragging : ''} md-card`}
      data-sheet={phone ? '' : undefined}
      custom={{ phone, swap: dialogOpen }}
      variants={panelVariants}
      initial="hidden"
      animate="shown"
      exit="hidden"
      style={{ zIndex: 120, ...sheet.style }}
      ref={phone ? sheet.bodyRef : undefined}
    >
      {phone && (
        <div className={styles.grab} data-sheet-grab="" aria-hidden="true" {...sheet.handlers}>
          <div className={styles.handle} />
        </div>
      )}
      {children}
    </motion.div>
  );
};

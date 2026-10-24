import React from 'react';
import styles from './SidebarMenu.module.css';
import { Coffee, Lightbulb, HelpCircle, History, Dice6, Trash2, Save, Share2, Palette, Pin, ToggleLeft, ToggleRight, BarChart2 } from 'lucide-react';
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
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen, onToggle, onDonate, onIdeas, onHelp, onHistory, onStats, onSets, onCustomize, onDeleteAll, onSave, onShare, onSetDefault, rpgMode, onToggleRpgMode, tableView, onToggleTableView
}) => {
  return (
    <>
      <div className={styles.toggleContainer}>
        <button className={`md-icon-button ${styles.toggleBtn} ${isOpen ? styles.toggleBtnOpen : ''}`} onClick={onToggle}
          title="Menu"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          <MenuIcon open={isOpen} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 98, cursor: 'default' }} 
              onClick={onToggle}
            />
            <motion.div 
              className={`${styles.menu} md-card`}
              style={{ zIndex: 120 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.menuColumn}>
                <div className={styles.menuColumnHeader}>App</div>
                <button className={styles.menuItem} onClick={onIdeas}><Lightbulb size={18} /> <span>Feedback</span></button>
                <button className={styles.menuItem} onClick={onDonate}><Coffee size={18} /> <span>Donate</span></button>
                <button className={styles.menuItem} onClick={onShare}><Share2 size={18} /> <span>Share</span></button>
                <button className={styles.menuItem} onClick={onHelp}><HelpCircle size={18} /> <span>Help</span></button>
              </div>

              <div className={styles.menuColumn}>
                <div className={styles.menuColumnHeader}>Saves</div>
                <button className={styles.menuItem} onClick={onSets}><Dice6 size={18} /> <span>Games</span></button>
                <button className={styles.menuItem} onClick={onSave}><Save size={18} /> <span>Save</span></button>
                <button className={styles.menuItem} onClick={onSetDefault} title="Pin as startup default"><Pin size={18} /> <span>Set Default</span></button>
              </div>

              <div className={styles.menuColumn}>
                <div className={styles.menuColumnHeader}>Tools</div>
                <button className={styles.menuItem} onClick={onHistory}><History size={18} /> <span>History</span></button>
                <button className={styles.menuItem} onClick={onStats}><BarChart2 size={18} /> <span>Usage Stats</span></button>
                <button className={styles.menuItem} onClick={onCustomize}><Palette size={18} /> <span>Customize</span></button>
                <button className={styles.menuItem} onClick={onToggleRpgMode} title="Toggle RPG Mode (Advantage & Modifiers)">
                  {rpgMode ? <ToggleRight size={18} color="var(--md-sys-color-primary)" /> : <ToggleLeft size={18} />}
                  <span>RPG Mode</span>
                </button>
                <button className={styles.menuItem} onClick={onToggleTableView} aria-pressed={tableView}
                  title="Show each roll's total big for the whole table">
                  {tableView ? <ToggleRight size={18} color="var(--md-sys-color-primary)" /> : <ToggleLeft size={18} />}
                  <span>Table view</span>
                </button>
              </div>

              {/* Destructive action gets its own full-width row so the three
                  columns stay even at four items each. */}
              <button
                className={`${styles.menuItem} ${styles.menuFooterItem}`}
                onClick={onDeleteAll}
              >
                <Trash2 size={18} /> <span>Clear All</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

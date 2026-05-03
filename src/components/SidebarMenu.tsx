import React from 'react';
import styles from './SidebarMenu.module.css';
import { Coffee, Lightbulb, HelpCircle, History, Dice6, Trash2, Save, Download, ChevronUp, ChevronDown, Share2, Palette, ToggleLeft, ToggleRight, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onDonate: () => void;
  onIdeas: () => void;
  onHelp: () => void;
  onHistory: () => void;
  onSets: () => void;
  onThemes: () => void;
  onDeleteAll: () => void;
  onSave: () => void;
  onLoad: () => void;
  onShare: () => void;
  onSetDefault: () => void;
  showModifier: boolean;
  onToggleModifier: () => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen, onToggle, onDonate, onIdeas, onHelp, onHistory, onSets, onThemes, onDeleteAll, onSave, onLoad, onShare, onSetDefault, showModifier, onToggleModifier
}) => {
  return (
    <>
      <div className={styles.toggleContainer}>
        <button className={`md-icon-button ${styles.toggleBtn}`} onClick={onToggle} title="Toggle Menu">
          {isOpen ? <ChevronDown size={28} /> : <ChevronUp size={28} />}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, paddingLeft: 4, color: 'var(--md-sys-color-on-surface)' }}>Saves</div>
                <button className={styles.menuItem} onClick={onSets}><Dice6 size={18} /> <span>Sets</span></button>
                <button className={styles.menuItem} onClick={onSave}><Save size={18} /> <span>Save</span></button>
                <button className={styles.menuItem} onClick={onLoad}><Download size={18} /> <span>Load</span></button>
                <button className={styles.menuItem} onClick={onSetDefault} title="Pin as startup default"><Pin size={18} /> <span>Set Default</span></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, paddingLeft: 4, color: 'var(--md-sys-color-on-surface)' }}>Tools</div>
                <button className={styles.menuItem} onClick={onHistory}><History size={18} /> <span>History</span></button>
                <button className={styles.menuItem} onClick={onThemes}><Palette size={18} /> <span>Themes</span></button>
                <button className={styles.menuItem} onClick={onToggleModifier}>
                  {showModifier ? <ToggleRight size={18} color="var(--md-sys-color-primary)" /> : <ToggleLeft size={18} />}
                  <span>Modifier</span>
                </button>
                <button className={styles.menuItem} style={{ color: 'var(--md-sys-color-error)' }} onClick={onDeleteAll}><Trash2 size={18} /> <span>Clear All</span></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, paddingLeft: 4, color: 'var(--md-sys-color-on-surface)' }}>App</div>
                <button className={styles.menuItem} onClick={onIdeas}><Lightbulb size={18} /> <span>Feedback</span></button>
                <button className={styles.menuItem} onClick={onDonate}><Coffee size={18} /> <span>Donate</span></button>
                <button className={styles.menuItem} onClick={onShare}><Share2 size={18} /> <span>Share</span></button>
                <button className={styles.menuItem} onClick={onHelp}><HelpCircle size={18} /> <span>Help</span></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

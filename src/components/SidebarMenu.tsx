import React from 'react';
import styles from './SidebarMenu.module.css';
import { Coffee, Lightbulb, HelpCircle, History, Dice6, Trash2, Save, ChevronUp, ChevronDown, Share2, Palette, ToggleLeft, ToggleRight, Pin, Volume2, VolumeX } from 'lucide-react';
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
  onShare: () => void;
  onSetDefault: () => void;
  showModifier: boolean;
  onToggleModifier: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen, onToggle, onDonate, onIdeas, onHelp, onHistory, onSets, onThemes, onDeleteAll, onSave, onShare, onSetDefault, showModifier, onToggleModifier, soundEnabled, onToggleSound
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
                <button className={styles.menuItem} onClick={onThemes}><Palette size={18} /> <span>Themes</span></button>
                <button className={styles.menuItem} onClick={onToggleModifier}>
                  {showModifier ? <ToggleRight size={18} color="var(--md-sys-color-primary)" /> : <ToggleLeft size={18} />}
                  <span>Modifier</span>
                </button>
                <button className={styles.menuItem} onClick={onToggleSound}>
                  {soundEnabled ? <Volume2 size={18} color="var(--md-sys-color-primary)" /> : <VolumeX size={18} />}
                  <span>Sounds</span>
                </button>
                <button className={styles.menuItem} style={{ color: 'var(--md-sys-color-error)' }} onClick={onDeleteAll}><Trash2 size={18} /> <span>Clear All</span></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

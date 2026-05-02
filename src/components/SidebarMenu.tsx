import React from 'react';
import styles from './SidebarMenu.module.css';
import { Coffee, Lightbulb, HelpCircle, History, Dice6, Trash2, Save, Download, ChevronUp, ChevronDown, Share2, Palette } from 'lucide-react';
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
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen, onToggle, onDonate, onIdeas, onHelp, onHistory, onSets, onThemes, onDeleteAll, onSave, onLoad, onShare
}) => {
  return (
    <>
      <div className={styles.toggleContainer}>
        <button className="md-icon-button" onClick={onToggle}>
          {isOpen ? <ChevronDown size={28} /> : <ChevronUp size={28} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={`${styles.menu} md-card`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button className={styles.menuItem} onClick={onDonate}>
              <Coffee size={20} /> <span>Donate</span>
            </button>
            <button className={styles.menuItem} onClick={onIdeas}>
              <Lightbulb size={20} /> <span>Ideas</span>
            </button>
            <button className={styles.menuItem} onClick={onHelp}>
              <HelpCircle size={20} /> <span>Help</span>
            </button>
            <button className={styles.menuItem} onClick={onHistory}>
              <History size={20} /> <span>History</span>
            </button>
            <button className={styles.menuItem} onClick={onSets}>
              <Dice6 size={20} /> <span>Sets</span>
            </button>
            <button className={styles.menuItem} onClick={onThemes}>
              <Palette size={20} /> <span>Themes</span>
            </button>
            <button className={styles.menuItem} onClick={onDeleteAll}>
              <Trash2 size={20} /> <span>Clear All</span>
            </button>
            <button className={styles.menuItem} onClick={onSave}>
              <Save size={20} /> <span>Save</span>
            </button>
            <button className={styles.menuItem} onClick={onLoad}>
              <Download size={20} /> <span>Load</span>
            </button>
            <button className={styles.menuItem} onClick={onShare}>
              <Share2 size={20} /> <span>Share Link</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

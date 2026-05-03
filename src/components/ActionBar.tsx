import React from 'react';
import styles from './ActionBar.module.css';
import { Plus, Minus, Dice5, Lock, Unlock, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionBarProps {
  onAdd: () => void;
  onRoll: () => void;
  onHoldAll: () => void;
  allHeld: boolean;
  totalVisible: boolean;
  lastTotal: number;
  modifier: number;
  showModifier: boolean;
  onChangeModifier: (val: number) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ 
  onAdd, onRoll, onHoldAll, allHeld, totalVisible, lastTotal, modifier, showModifier, onChangeModifier
}) => {
  return (
    <div className={styles.actionBar} style={{ alignItems: 'flex-end' }}>
      <motion.button 
        className={`md-icon-button ${styles.actionBtn} ${styles.lockBtn}`} 
        onClick={onHoldAll} 
        title="Toggle Hold All"
        key={String(allHeld)}
        initial={{ rotate: 0 }}
        animate={{
          rotate: [0, -45, 10, 0],
          color: allHeld ? "#FFD700" : "currentColor"
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {allHeld ? <Unlock size={24} strokeWidth={2.5} /> : <Lock size={24} strokeWidth={2.5} />}
      </motion.button>
      
      <button className={`md-icon-button ${styles.actionBtn}`} onClick={onAdd} title="Add Dice">
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 156, alignItems: 'flex-end' }}>
        {showModifier && (
          <motion.div 
            className={styles.modifierColumn}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <button
              className="md-icon-button"
              style={{ width: 72, height: 72, backgroundColor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface)', boxShadow: 'var(--elevation-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onChangeModifier(modifier + 1)}
              title="Increase modifier"
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
            <button
              className="md-icon-button"
              style={{ width: 72, height: 72, backgroundColor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface)', opacity: modifier === 0 ? 0.4 : 1, boxShadow: 'var(--elevation-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onChangeModifier(0)}
              title="Reset modifier"
              disabled={modifier === 0}
            >
              <RotateCcw size={22} />
            </button>
            <button
              className="md-icon-button"
              style={{ width: 72, height: 72, backgroundColor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface)', boxShadow: 'var(--elevation-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onChangeModifier(modifier - 1)}
              title="Decrease modifier"
            >
              <Minus size={28} strokeWidth={2.5} />
            </button>
          </motion.div>
        )}

        <motion.button 
          className={`md-button md-button-filled ${styles.rollBtn}`} 
          onClick={onRoll}
          whileTap={{ scale: 0.95 }}
          style={{ width: '100%', margin: 0 }}
        >
          <Dice5 size={24} strokeWidth={2.5} />
          <span>{totalVisible ? lastTotal : "Roll"}{modifier !== 0 ? ` (${modifier > 0 ? '+' : ''}${modifier})` : ''}</span>
        </motion.button>
      </div>
    </div>
  );
};

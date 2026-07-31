import React from 'react';
import styles from './ActionBar.module.css';
import { Plus, Minus, Dice5, Lock, Unlock, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RollAdvantageMode } from '../hooks/useDiceState';

interface ActionBarProps {
  onAdd: () => void;
  onRoll: () => void;
  onHoldAll: () => void;
  allHeld: boolean;
  totalVisible: boolean;
  lastTotal: number;
  modifier: number;
  onChangeModifier: (val: number) => void;
  rpgMode: boolean;
  rollAdvantage: RollAdvantageMode;
  onChangeRollAdvantage: (mode: RollAdvantageMode) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ 
  onAdd, onRoll, onHoldAll, allHeld, totalVisible, lastTotal, modifier, onChangeModifier,
  rpgMode, rollAdvantage, onChangeRollAdvantage
}) => {
  return (
    <div className={styles.actionBar}>
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

      <div className={styles.rollGroup}>
        {rpgMode && (
          <motion.div 
            className={styles.advGroup}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button 
              className={`${styles.advPill} ${rollAdvantage === 'normal' ? styles.advPillActive : ''}`}
              onClick={() => onChangeRollAdvantage('normal')}
            >
              NORM
            </button>
            <button 
              className={`${styles.advPill} ${rollAdvantage === 'advantage' ? styles.advPillActive : ''}`}
              onClick={() => onChangeRollAdvantage('advantage')}
              title="Advantage: Keep Highest"
            >
              ADV
            </button>
            <button 
              className={`${styles.advPill} ${rollAdvantage === 'disadvantage' ? styles.advPillActive : ''}`}
              onClick={() => onChangeRollAdvantage('disadvantage')}
              title="Disadvantage: Drop Highest"
            >
              DIS
            </button>
          </motion.div>
        )}

        {rpgMode && (
          <motion.div 
            className={styles.modifierColumn}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <button
              className={`md-icon-button ${styles.modifierBtn}`}
              onClick={() => onChangeModifier(modifier + 1)}
              title="Increase modifier"
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
            <button
              className={`md-icon-button ${styles.modifierBtn} ${modifier === 0 ? styles.modifierBtnDisabled : ''}`}
              onClick={() => onChangeModifier(0)}
              title="Reset modifier"
              disabled={modifier === 0}
            >
              <RotateCcw size={22} />
            </button>
            <button
              className={`md-icon-button ${styles.modifierBtn}`}
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
        >
          <Dice5 size={24} strokeWidth={2.5} />
          <span>{totalVisible ? lastTotal : "Roll"}{rpgMode && modifier !== 0 ? ` (${modifier > 0 ? '+' : ''}${modifier})` : ''}</span>
        </motion.button>
      </div>
    </div>
  );
};

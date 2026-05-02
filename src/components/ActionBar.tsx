import React from 'react';
import styles from './ActionBar.module.css';
import { Plus, Dice5, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionBarProps {
  onAdd: () => void;
  onRoll: () => void;
  onHoldAll: () => void;
  allHeld: boolean;
  totalVisible: boolean;
  lastTotal: number;
}

export const ActionBar: React.FC<ActionBarProps> = ({ 
  onAdd, onRoll, onHoldAll, allHeld, totalVisible, lastTotal 
}) => {
  return (
    <div className={styles.actionBar}>
      <button className={`md-icon-button ${styles.actionBtn}`} onClick={onHoldAll} title="Toggle Hold All">
        {allHeld ? <Unlock size={24} /> : <Lock size={24} />}
      </button>
      
      <button className={`md-icon-button ${styles.actionBtn}`} onClick={onAdd} title="Add Dice">
        <Plus size={24} />
      </button>

      <motion.button 
        className={`md-button md-button-filled ${styles.rollBtn}`} 
        onClick={onRoll}
        whileTap={{ scale: 0.95 }}
      >
        <Dice5 size={24} />
        <span>{totalVisible ? lastTotal : "Roll"}</span>
      </motion.button>
    </div>
  );
};

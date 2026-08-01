import React, { useState } from 'react';
import styles from './ActionBar.module.css';
import { Plus, Minus, Dice5, Lock, Unlock, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RollAdvantageMode } from '../hooks/useDiceState';
import type { DiceData } from '../types';

interface ActionBarProps {
  onAdd: (template?: Partial<DiceData>) => void;
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

const DND_GRID_DICE = [
  { label: '⬟ d12', faces: 12, name: 'd12', color: '#384050' },
  { label: '🛡️ d10', faces: 10, name: 'd10', color: '#384050' },
  { label: '💯 d00', faces: 10, name: 'd10 (tens)', customFaces: ["00", "10", "20", "30", "40", "50", "60", "70", "80", "90"], color: '#384050' },
  { label: '💎 d8', faces: 8, name: 'd8', color: '#384050' },
  { label: '🎲 d6', faces: 6, name: 'd6', color: '#384050' },
  { label: '🔺 d4', faces: 4, name: 'd4', color: '#384050' }
];

const D20_OPTION = { label: '🔷 d20', faces: 20, name: 'd20', color: '#384050' };

export const ActionBar: React.FC<ActionBarProps> = ({ 
  onAdd, onRoll, onHoldAll, allHeld, totalVisible, lastTotal, modifier, onChangeModifier,
  rpgMode, rollAdvantage, onChangeRollAdvantage
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleAddClick = () => {
    if (rpgMode) {
      setPopoverOpen(prev => !prev);
    } else {
      onAdd();
    }
  };

  const handleSelectDndDice = (opt: { faces: number; name: string; customFaces?: string[]; color: string }) => {
    onAdd({
      numberValue: 1,
      faces: opt.faces,
      name: opt.name,
      customFaces: opt.customFaces ? [...opt.customFaces] : [],
      color: opt.color
    });
    setPopoverOpen(false);
  };

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

      {/* Add Button & Quick D&D Popover */}
      <div className={styles.addPopoverContainer}>
        <AnimatePresence>
          {rpgMode && popoverOpen && (
            <>
              <div className={styles.addPopoverBackdrop} onClick={() => setPopoverOpen(false)} />
              <motion.div 
                className={styles.addPopover}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.15 }}
              >
                <div className={styles.addPopoverTitle}>Add D&D Die</div>
                <div className={styles.dndGrid}>
                  {DND_GRID_DICE.map(opt => (
                    <button 
                      key={opt.label} 
                      className={styles.dndOptionBtn}
                      onClick={() => handleSelectDndDice(opt)}
                    >
                      {opt.label}
                    </button>
                  ))}
                  
                  {/* Double-wide Primary Colored d20 at the Bottom */}
                  <button 
                    className={styles.d20OptionBtn}
                    onClick={() => handleSelectDndDice(D20_OPTION)}
                  >
                    {D20_OPTION.label}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <button 
          className={`md-icon-button ${styles.actionBtn}`} 
          onClick={handleAddClick} 
          title={rpgMode ? "Add D&D Dice Menu" : "Add Dice"}
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      <div className={styles.rollGroup}>
        {rpgMode && (
          <motion.div 
            className={styles.rpgColumns}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {/* Left Vertical Column: Advantage / Disadvantage FABs */}
            <div className={styles.verticalColumn}>
              <button
                className={`${styles.rpgFabBtn} ${rollAdvantage === 'advantage' ? styles.rpgFabActive : ''}`}
                onClick={() => onChangeRollAdvantage('advantage')}
                title="Advantage: Keep Highest"
              >
                ADV
              </button>
              <button
                className={`${styles.rpgFabBtn} ${rollAdvantage === 'normal' ? styles.rpgFabActive : ''}`}
                onClick={() => onChangeRollAdvantage('normal')}
                title="Normal Roll"
              >
                NORM
              </button>
              <button
                className={`${styles.rpgFabBtn} ${rollAdvantage === 'disadvantage' ? styles.rpgFabActive : ''}`}
                onClick={() => onChangeRollAdvantage('disadvantage')}
                title="Disadvantage: Keep Lowest"
              >
                DIS
              </button>
            </div>

            {/* Right Vertical Column: Modifier Stepper FABs */}
            <div className={styles.verticalColumn}>
              <button
                className={`md-icon-button ${styles.rpgFabBtn}`}
                onClick={() => onChangeModifier(modifier + 1)}
                title="Increase modifier"
              >
                <Plus size={28} strokeWidth={2.5} />
              </button>
              <button
                className={`md-icon-button ${styles.rpgFabBtn} ${modifier === 0 ? styles.modifierBtnDisabled : ''}`}
                onClick={() => onChangeModifier(0)}
                title="Reset modifier"
                disabled={modifier === 0}
              >
                <RotateCcw size={22} />
              </button>
              <button
                className={`md-icon-button ${styles.rpgFabBtn}`}
                onClick={() => onChangeModifier(modifier - 1)}
                title="Decrease modifier"
              >
                <Minus size={28} strokeWidth={2.5} />
              </button>
            </div>
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

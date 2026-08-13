import React, { useState, useRef, useEffect } from 'react';
import styles from './ActionBar.module.css';
import { Plus, Minus, Dice5, Lock, Unlock, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import type { RollAdvantageMode } from '../hooks/useDiceState';
import type { DiceData } from '../types';
import { DndShapeIcon } from './DndShapeIcon';

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
  { label: 'D10', faces: 10, name: 'd10', color: '#384050' },
  { label: 'D00', faces: 10, isD00: true, name: 'd10 (tens)', customFaces: ["00", "10", "20", "30", "40", "50", "60", "70", "80", "90"], color: '#384050' },
  { label: 'D6', faces: 6, name: 'd6', color: '#384050' },
  { label: 'D12', faces: 12, name: 'd12', color: '#384050' },
  { label: 'D4', faces: 4, name: 'd4', color: '#384050' },
  { label: 'D8', faces: 8, name: 'd8', color: '#384050' }
];

const D20_OPTION = { label: 'D20', faces: 20, name: 'd20', color: '#384050' };

export const ActionBar: React.FC<ActionBarProps> = ({ 
  onAdd, onRoll, onHoldAll, allHeld, totalVisible, lastTotal, modifier, onChangeModifier,
  rpgMode, rollAdvantage, onChangeRollAdvantage
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Wiggle the lock only when allHeld actually changes — not on initial page load.
  // Imperative controls replace the old keyed-remount pattern so the mount render
  // stays static. NOTE: the mount-flag effect must be declared AFTER this one so
  // the first run of this effect sees mountedRef=false and skips the wiggle.
  const lockControls = useAnimationControls();
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) return;
    lockControls.start({
      rotate: [0, -45, 10, 0],
      color: allHeld ? '#FFD700' : 'var(--md-sys-color-on-surface)',
      transition: { duration: 0.5, ease: 'easeInOut' }
    });
  }, [allHeld, lockControls]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
        initial={{ rotate: 0 }}
        animate={lockControls}
        style={{ color: allHeld ? '#FFD700' : undefined }}
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
                      <DndShapeIcon faces={opt.faces} isD00={opt.isD00} size={18} />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                  
                  {/* Double-wide Primary Colored d20 at the Bottom */}
                  <button 
                    className={styles.d20OptionBtn}
                    onClick={() => handleSelectDndDice(D20_OPTION)}
                  >
                    <DndShapeIcon faces={20} size={20} color="currentColor" />
                    <span>{D20_OPTION.label}</span>
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
          aria-label="Roll dice"
        >
          <Dice5 size={24} strokeWidth={2.5} className={styles.rollBtnIcon} />
          <span className={styles.rollBtnLabel}>{totalVisible ? lastTotal : "Roll"}{rpgMode && modifier !== 0 ? ` (${modifier > 0 ? '+' : ''}${modifier})` : ''}</span>
        </motion.button>
      </div>
    </div>
  );
};

import React, { useRef } from 'react';
import type { DiceData } from '../types';
import styles from './Dice.module.css';
import { Lock, Unlock, Settings, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ALL_ICONS } from '../utils/iconUtils';

interface DiceProps {
  dice: DiceData;
  isRolling: boolean;
  onToggleHold: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenSettings: (id: string) => void;
}

export const Dice: React.FC<DiceProps> = React.memo(({ dice, isRolling, onToggleHold, onRemove, onOpenSettings }) => {
  const diceRef = useRef<HTMLDivElement>(null);

  // Determine text color based on background
  const isLightBg = dice.color.toUpperCase() === '#E9EAEC' || dice.color.toUpperCase() === '#FBFB3C';
  const textColor = isLightBg ? '#000000' : '#FFFFFF';

  const getDisplayText = () => {
    if (dice.customFaces.length > 0) {
      return dice.customFaces[dice.currentFaceIndex ?? 0];
    }
    return dice.numberValue.toString();
  };
  const displayText = getDisplayText();

  let backgroundColor = dice.color;
  let faceContent = displayText;
  if (displayText.includes(':bg:')) {
    const parts = displayText.split(':bg:');
    faceContent = parts[0];
    backgroundColor = parts[1];
  }

  // Calculate font size using CSS calc instead of DOM measurements to prevent layout thrashing
  let longestFace = 1;
  if (dice.customFaces.length > 0) {
    const textFaces = dice.customFaces.filter(f => !f.split(':bg:')[0].startsWith(':icon:'));
    if (textFaces.length > 0) {
      longestFace = Math.max(...textFaces.map(f => f.length));
    }
  } else {
    longestFace = dice.numberValue.toString().length;
  }
  
  // Max height 70% of box. Char width is ~0.6 of height, so max size based on width is width / (chars * 0.6) = width * 1.66 / chars
  const fontScale = `min(calc(var(--dice-size) * 0.7), calc(var(--dice-size) * 1.66 / ${longestFace || 1}))`;

  const renderFace = (faceStr: string) => {
    if (!faceStr) return null;
    if (faceStr.startsWith(':icon:')) {
      const iconName = faceStr.replace(':icon:', '');
      const IconComp = ALL_ICONS.find(i => i.name === iconName)?.icon;
      if (IconComp) return <IconComp size="1em" color={textColor} />;
    }
    return faceStr;
  };

  return (
    <motion.div 
      ref={diceRef}
      className={`${styles.dice} ${isRolling && !dice.held ? 'dice-shake' : ''}`}
      style={{ backgroundColor }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onToggleHold(dice.id);
      }}
      layout
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
    >
      <div className={styles.number} style={{ fontSize: fontScale, color: textColor }}>
        {renderFace(faceContent)}
      </div>

      {dice.name && (
        <div style={{
          position: 'absolute',
          bottom: '8%',
          left: '4%',
          right: '4%',
          textAlign: 'center',
          color: textColor,
          fontSize: 'calc(var(--dice-size) * 0.1)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontWeight: 500,
          pointerEvents: 'none',
          opacity: 0.8
        }}>
          {dice.name}
        </div>
      )}

      <motion.div 
        animate={{
          rotate: [0, -45 + (Math.random() * 0.1 - 0.05), 10, 0],
          color: dice.held ? "#FFD700" : "#FFFFFF"
        }}
        transition={{ duration: 0.5, ease: "easeInOut" } as any}
        className={`${styles.actionBtn} ${dice.held ? styles.holdIcon : styles.unlockIcon}`}
      >
        <div style={{ position: 'relative', width: 20, height: 20 }}>
          <motion.div 
            animate={{ opacity: dice.held ? 1 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Lock size={20} color="currentColor" />
          </motion.div>
          <motion.div 
            animate={{ opacity: dice.held ? 0 : 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Unlock size={20} color="currentColor" />
          </motion.div>
        </div>
      </motion.div>

      <button className={`${styles.actionBtn} ${styles.settingsBtn}`} onClick={(e) => {
        e.stopPropagation();
        onOpenSettings(dice.id);
      }}>
        <Settings size={20} color="currentColor" />
      </button>

      <button 
        className={`${styles.actionBtn} ${styles.removeBtn}`} 
        onClick={(e) => { e.stopPropagation(); onRemove(dice.id); }}
      >
        <X size={20} color="currentColor" />
      </button>
    </motion.div>
  );
});

import React, { useRef, useState, useEffect } from 'react';
import type { DiceData } from '../types';
import styles from './Dice.module.css';
import { Lock, Unlock, Settings, X, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { ALL_ICONS } from '../utils/iconUtils';
import { parseFaceContent, FACE_ICON_PREFIX, getContrastColor } from '../utils/diceUtils';

interface DiceProps {
  dice: DiceData;
  isRolling: boolean;
  isRevealed: boolean;
  onReveal: () => void;
  onToggleHold: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenSettings: (id: string) => void;
  onClone?: (template: Partial<DiceData>) => void;
  rpgMode?: boolean;
}

const DiceComponent: React.FC<DiceProps> = ({ 
  dice, isRolling, isRevealed, onReveal, onToggleHold, onRemove, onOpenSettings, onClone, rpgMode 
}) => {
  const diceRef = useRef<HTMLDivElement>(null);

  const [tempValue, setTempValue] = useState<number | null>(null);
  const [tempFaceIndex, setTempFaceIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isRolling || dice.held) return;

    let tickCount = 0;

    const intervalId = setInterval(() => {
      tickCount++;
      
      if (tickCount === 3) {
        if (dice.targetValue !== undefined) {
          if (dice.customFaces.length > 0 && dice.targetFaceIndex !== undefined) {
            setTempFaceIndex(dice.targetFaceIndex);
          } else {
            setTempValue(dice.targetValue);
          }
        }
      } else {
        if (dice.customFaces.length > 0) {
          const idx = Math.floor(Math.random() * dice.customFaces.length);
          setTempFaceIndex(idx);
        } else {
          const val = Math.floor(Math.random() * dice.faces) + 1;
          setTempValue(val);
        }
      }
    }, 200);

    return () => {
      clearInterval(intervalId);
      setTempValue(null);
      setTempFaceIndex(null);
    };
  }, [isRolling, dice.held, dice.faces, dice.customFaces, dice.targetValue, dice.targetFaceIndex]);

  const getDisplayText = () => {
    if (isRolling && !dice.held) {
      if (dice.customFaces.length > 0 && tempFaceIndex !== null) {
        return dice.customFaces[tempFaceIndex];
      } else if (tempValue !== null) {
        return tempValue.toString();
      }
    }
    if (dice.customFaces.length > 0) {
      return dice.customFaces[dice.currentFaceIndex ?? 0];
    }
    return dice.numberValue.toString();
  };
  const displayText = getDisplayText();

  const parsed = parseFaceContent(displayText, dice.color);
  const backgroundColor = parsed.bgColor;
  const faceContent = parsed.content;

  const textColor = getContrastColor(backgroundColor);

  let longestFace = 1;
  if (dice.customFaces.length > 0) {
    const textFaces = dice.customFaces.map(f => parseFaceContent(f).content).filter(f => !f.startsWith(FACE_ICON_PREFIX));
    if (textFaces.length > 0) {
      longestFace = Math.max(...textFaces.map(f => f.length));
    }
  } else {
    longestFace = dice.numberValue.toString().length;
  }
  
  const fontScale = `min(calc(var(--dice-size) * 0.7), calc(var(--dice-size) * 1.66 / ${longestFace || 1}))`;

  const renderFace = (faceStr: string) => {
    if (!faceStr) return null;
    if (faceStr.startsWith(FACE_ICON_PREFIX)) {
      const iconName = faceStr.replace(FACE_ICON_PREFIX, '');
      const IconComp = ALL_ICONS.find(i => i.name === iconName)?.icon;
      if (IconComp) return <IconComp size="calc(var(--dice-size) * 0.58)" strokeWidth={2.5} color={textColor} />;
    }
    return faceStr;
  };

  // Determine polyhedral RPG shape when rpgMode is active and faces match d4, d8, d10, d12, d20
  let shapeClass = '';
  if (rpgMode && dice.customFaces.length === 0) {
    if (dice.faces === 4) shapeClass = styles.shapeD4;
    else if (dice.faces === 8) shapeClass = styles.shapeD8;
    else if (dice.faces === 10) shapeClass = styles.shapeD10;
    else if (dice.faces === 12) shapeClass = styles.shapeD12;
    else if (dice.faces === 20) shapeClass = styles.shapeD20;
  }

  const extraClass = [
    dice.dropped ? styles.dropped : '',
    dice.isCrit20 ? styles.crit20 : '',
    dice.isCrit1 ? styles.crit1 : ''
  ].filter(Boolean).join(' ');

  return (
    <motion.div 
      ref={diceRef}
      className={`${styles.dice} ${isRolling && !dice.held ? 'dice-shake' : ''} ${isRevealed ? styles.revealed : ''} ${extraClass}`}
      data-dice-id={dice.id}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onReveal();
        onToggleHold(dice.id);
      }}
      onTouchStart={() => onReveal()}
      layout
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
    >
      {/* Background shape container so clip-path does NOT clip action buttons */}
      <div className={`${styles.diceShapeBg} ${shapeClass}`} style={{ backgroundColor }} />

      <div className={styles.number} style={{ fontSize: fontScale, color: textColor }}>
        {renderFace(faceContent)}
      </div>

      {dice.dropped && (
        <div className={styles.droppedBadge}>
          DROPPED
        </div>
      )}

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
          opacity: 0.8,
          zIndex: 3
        }}>
          {dice.name}
        </div>
      )}

      <motion.div 
        key={`${dice.id}-${dice.held}`}
        initial={{ rotate: 0 }}
        animate={{
          rotate: [0, -45, 10, 0],
          color: dice.held ? "#FFD700" : "#FFFFFF"
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className={`${styles.actionBtn} ${dice.held ? styles.holdIcon : styles.unlockIcon}`}
      >
        <div style={{ position: 'relative', width: 20, height: 20 }}>
          <motion.div 
            animate={{ opacity: dice.held ? 1 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Lock size={20} strokeWidth={2.5} color="currentColor" />
          </motion.div>
          <motion.div 
            animate={{ opacity: dice.held ? 0 : 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Unlock size={20} strokeWidth={2.5} color="currentColor" />
          </motion.div>
        </div>
      </motion.div>

      {/* Settings Button (Bottom-Right) */}
      <button className={`${styles.actionBtn} ${styles.settingsBtn}`} onClick={(e) => {
        e.stopPropagation();
        onOpenSettings(dice.id);
      }} title="Dice Settings">
        <Settings size={20} strokeWidth={2.5} color="currentColor" />
      </button>

      {/* Clone Button (Bottom-Left) */}
      {onClone && (
        <button 
          className={`${styles.actionBtn} ${styles.cloneBtn}`} 
          onClick={(e) => { e.stopPropagation(); onClone(dice); }}
          title="Clone Die"
        >
          <Copy size={20} strokeWidth={2.5} color="currentColor" />
        </button>
      )}

      {/* Remove Button (Top-Left) */}
      <button 
        className={`${styles.actionBtn} ${styles.removeBtn}`} 
        onClick={(e) => { e.stopPropagation(); onRemove(dice.id); }}
        title="Remove Die"
      >
        <X size={20} strokeWidth={2.5} color="currentColor" />
      </button>
    </motion.div>
  );
};

export const Dice = React.memo(DiceComponent);
Dice.displayName = 'Dice';

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import type { DiceData } from '../types';
import styles from './Dice.module.css';
import { Lock, Unlock, Settings, Trash2, Copy, Dices } from 'lucide-react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { ALL_ICONS } from '../utils/iconUtils';
import { parseFaceContent, FACE_ICON_PREFIX, getContrastColor } from '../utils/diceUtils';
import { useFaceImage } from '../utils/faceImages';
import { MAX_SHAPED_FACE_LENGTH } from '../utils/constants';
import { PolyhedralWireframe } from './PolyhedralWireframe';
import { randomBelow } from '../utils/fairRandom';

/** Material 3 emphasized easing, as on the menu icon */
const EMPHASIZED = [0.2, 0, 0, 1] as const;
/** How far a dropped die sinks back */
const DROPPED_SCALE = 0.88;
/** How far a held die lifts, as a share of its size */
const HELD_LIFT = '-5%';

interface DiceProps {
  dice: DiceData;
  isRolling: boolean;
  isRevealed: boolean;
  onReveal: () => void;
  onToggleHold: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenSettings: (id: string) => void;
  onClone?: (template: Partial<DiceData>) => void;
  onRollOne?: (id: string) => void;
  /** This die is rolling on its own, so it animates even when held */
  rollingAlone?: boolean;
  rpgMode?: boolean;
  /** Many small dice: the buttons move to the strip above the bottom bar, and the tapped die gets an outline */
  compactActions?: boolean;
  /** Asked once when the die appears: where the + button was, if it was just tapped */
  takeGlide?: (id: string) => GlideOrigin | null;
}

/** The centre of the + button a new die glides out of, and when it was tapped */
export interface GlideOrigin { x: number; y: number; at: number; claimedBy?: string }

const DiceComponent: React.FC<DiceProps> = ({ 
  dice, isRolling, isRevealed, onReveal, onToggleHold, onRemove, onOpenSettings, onClone, onRollOne, rollingAlone, rpgMode, compactActions, takeGlide 
}) => {
  const diceRef = useRef<HTMLDivElement>(null);

  const [tempValue, setTempValue] = useState<number | null>(null);
  const [tempFaceIndex, setTempFaceIndex] = useState<number | null>(null);

  // The HELD tag drops onto the die only when held actually changes — not when
  // the die mounts (page load, preset load). NOTE: the mount-flag effect must be
  // declared AFTER this one so the first run sees lockMountedRef=false and skips it.
  const lockControls = useAnimationControls();
  const lockMountedRef = useRef(false);
  useEffect(() => {
    if (!lockMountedRef.current || !dice.held) return;
    lockControls.start({
      y: ['-180%', '0%'],
      opacity: [0, 1],
      transition: { type: 'spring', stiffness: 520, damping: 22 }
    });
  }, [dice.held, lockControls]);
  useEffect(() => {
    lockMountedRef.current = true;
    return () => {
      lockMountedRef.current = false;
    };
  }, []);

  const rollingNow = isRolling && (!dice.held || !!rollingAlone);
  // A dropped die sinks back, dims and gets its stamp once it lands, not mid-tumble
  const sunk = !!dice.dropped && !rollingNow;
  // With the phone's Reduce motion on, a rolling die stays still and its
  // number fades in, instead of shaking through random faces
  const calm = !!useReducedMotion();

  // Added from the + button: rise out of it into this slot (Material 3 emphasized easing)
  const [glided] = useState(() => takeGlide?.(dice.id) ?? null);
  useLayoutEffect(() => {
    const el = diceRef.current;
    if (!glided || calm || !el || typeof el.animate !== 'function') return;
    const box = el.getBoundingClientRect();
    const dx = glided.x - (box.left + box.width / 2);
    const dy = glided.y - (box.top + box.height / 2);
    const glide = el.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.4 }, { transform: 'none', opacity: 1 }],
      { duration: 450, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
    );
    // Strict mode runs this twice: stop the first so the second measures the settled slot
    return () => glide.cancel();
  }, [glided, calm]);

  useEffect(() => {
    if (!rollingNow || calm) return;

    let tickCount = 0;

    const intervalId = setInterval(() => {
      tickCount++;
      
      // Clamp all ticks from the 3rd onward to the final value so a late tick
      // firing near the roll-finalize timeout can't flash a random face.
      if (tickCount >= 3) {
        if (dice.targetValue !== undefined) {
          if (dice.customFaces.length > 0 && dice.targetFaceIndex !== undefined) {
            setTempFaceIndex(dice.targetFaceIndex);
          } else {
            setTempValue(dice.targetValue);
          }
        }
      } else {
        if (dice.customFaces.length > 0) {
          const idx = randomBelow(dice.customFaces.length);
          setTempFaceIndex(idx);
        } else {
          const val = randomBelow(dice.faces) + 1;
          setTempValue(val);
        }
      }
    }, 200);

    return () => {
      clearInterval(intervalId);
      setTempValue(null);
      setTempFaceIndex(null);
    };
  }, [rollingNow, calm, dice.faces, dice.customFaces, dice.targetValue, dice.targetFaceIndex]);

  const getDisplayText = () => {
    if (rollingNow) {
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
  // A picture kept on this device; where it's missing (a shared link) the face's text shows
  const faceImage = useFaceImage(parsed.image);

  const textColor = getContrastColor(backgroundColor);
  // Names the die in every button around it, so a screen reader hears "Remove Red", not five "Remove Die"
  const dieName = dice.name || `d${dice.faces}`;
  const spokenFace = faceContent.startsWith(FACE_ICON_PREFIX) ? faceContent.replace(FACE_ICON_PREFIX, '') : faceContent;

  let longestFace = 1;
  // Letters run wider than digits, so word faces ("YES", "MAYBE") get a little
  // more room per character and stay on one line
  let wordFaces = false;
  if (dice.customFaces.length > 0) {
    const textFaces = dice.customFaces.map(f => parseFaceContent(f).content).filter(f => !f.startsWith(FACE_ICON_PREFIX));
    if (textFaces.length > 0) {
      longestFace = Math.max(...textFaces.map(f => f.length));
      wordFaces = textFaces.some(f => /[^\d\s.+-]/.test(f));
    }
  } else {
    longestFace = dice.numberValue.toString().length;
  }
  
  const fontScale = `min(calc(var(--dice-size) * 0.7), calc(var(--dice-size) * ${wordFaces ? 1.3 : 1.66} / ${longestFace || 1}))`;

  const renderFace = (faceStr: string) => {
    if (!faceStr) return null;
    if (faceStr.startsWith(FACE_ICON_PREFIX)) {
      const iconName = faceStr.replace(FACE_ICON_PREFIX, '');
      const IconComp = ALL_ICONS.find(i => i.name === iconName)?.icon;
      if (IconComp) return <IconComp size="calc(var(--dice-size) * 0.58)" strokeWidth={2.5} color={textColor} />;
    }
    return faceStr;
  };

  // Custom-faced dice normally stay plain tiles, because a long label like
  // "Barbarian" would clip inside a pointed silhouette. Short numeric faces are
  // safe though, which is what lets a percentile pair (00-90 plus 0-9) render
  // as the two d10s it actually is.
  const customFacesFitShape =
    dice.customFaces.length > 0 &&
    dice.customFaces.every(f => {
      const content = parseFaceContent(f).content;
      return !content.startsWith(FACE_ICON_PREFIX) && !parseFaceContent(f).image && content.trim().length <= MAX_SHAPED_FACE_LENGTH;
    });

  // Determine polyhedral RPG shape when rpgMode is active and faces match d4, d6, d8, d10, d12, d20
  const shapeEligible = rpgMode && (dice.customFaces.length === 0 || customFacesFitShape);

  let shapeClass = '';
  if (shapeEligible) {
    if (dice.faces === 4) shapeClass = styles.shapeD4;
    else if (dice.faces === 6) shapeClass = styles.shapeD6;
    else if (dice.faces === 8) shapeClass = styles.shapeD8;
    else if (dice.faces === 10) shapeClass = styles.shapeD10;
    else if (dice.faces === 12) shapeClass = styles.shapeD12;
    else if (dice.faces === 20) shapeClass = styles.shapeD20;
  }

  const extraClass = [
    sunk ? styles.dropped : '',
    // The natural 20 / natural 1 glow waits for the die to land: the result is
    // known when the roll starts, but showing it then gave it away (owner, 2026-11-05)
    dice.isCrit20 && !rollingNow ? styles.crit20 : '',
    dice.isCrit1 && !rollingNow ? styles.crit1 : ''
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      ref={diceRef}
      className={`${styles.dice} ${shapeClass ? styles.shaped : ''} ${rollingNow && !calm ? 'dice-shake' : ''} ${isRevealed ? styles.revealed : ''} ${compactActions && isRevealed ? styles.outlined : ''} ${dice.held ? styles.held : ''} ${extraClass}`}
      data-dice-id={dice.id}
      // A group, not a button: a button's inner buttons are hidden from screen
      // readers, so settings, copy, roll-one and remove couldn't be reached.
      // Holding moves to its own (visually hidden) button below.
      role="group"
      aria-label={`${dieName} showing ${spokenFace}${dice.held ? ', held' : ''}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onReveal();
        onToggleHold(dice.id);
      }}
      onTouchStart={() => onReveal()}
      layout
      initial={glided && !calm ? false : { scale: 0 }}
      // A die dropped by Advantage or Disadvantage sinks back a little (Material 3 emphasized easing)
      // A held die lifts off the table (owner's pick, 2026-11-03: "Lift and tag")
      animate={{ scale: sunk && !calm ? DROPPED_SCALE : 1, y: dice.held && !calm ? HELD_LIFT : 0 }}
      transition={sunk ? { duration: 0.4, ease: EMPHASIZED } : undefined}
      exit={{ scale: 0 }}
    >
      {/* Keyboard and screen-reader way to hold; a tap on the die does the same */}
      <button
        className={styles.holdBtn}
        aria-pressed={!!dice.held}
        aria-label={`Hold ${dieName}`}
        onClick={() => { onReveal(); onToggleHold(dice.id); }}
      />

      {/* Background shape container so clip-path does NOT clip action buttons */}
      <div className={`${styles.diceShapeBg} ${shapeClass}`} style={{ backgroundColor }}>
        {/* 3D Wireframe Facet Lines Overlay - placed INSIDE diceShapeBg to match silhouette bounds perfectly */}
        {shapeEligible && (
          <PolyhedralWireframe faces={dice.faces} textColor={textColor} />
        )}
      </div>

      {faceImage ? (
        <img src={faceImage} alt="" className={`${styles.faceImage} ${calm ? styles.calmFace : ''} ${calm && rollingNow ? styles.calmRolling : ''}`} draggable={false} />
      ) : (
        <div className={`${styles.number} ${calm ? styles.calmFace : ''} ${calm && rollingNow ? styles.calmRolling : ''}`} data-calm={calm ? (rollingNow ? 'rolling' : 'still') : undefined} style={{ fontSize: fontScale, color: textColor, zIndex: 2 }}>
          {renderFace(faceContent)}
        </div>
      )}

      {sunk && (
        <div className={styles.droppedBadge} data-testid="dropped-stamp">
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

      {dice.held ? (
        // Held: a gold HELD tag sits on the top edge (it drops in when you hold the die)
        <motion.div
          className={styles.heldTag}
          data-testid="held-tag"
          aria-hidden="true"
          initial={false}
          animate={calm ? { y: '0%', opacity: 1 } : lockControls}
        >
          <Lock size="1em" strokeWidth={3} />
          HELD
        </motion.div>
      ) : (
        <div className={`${styles.actionBtn} ${styles.unlockIcon}`} aria-hidden="true">
          <Unlock size={20} strokeWidth={2.5} color="currentColor" />
        </div>
      )}

      {!compactActions && (<>
      {/* Settings Button (Bottom-Right) */}
      <button className={`${styles.actionBtn} ${styles.settingsBtn}`} onClick={(e) => {
        e.stopPropagation();
        onOpenSettings(dice.id);
      }} title="Dice Settings" aria-label={`Settings for ${dieName}`}>
        <Settings size={20} strokeWidth={2.5} color="currentColor" />
      </button>

      {/* Clone Button (Bottom-Left) */}
      {onClone && (
        <button 
          className={`${styles.actionBtn} ${styles.cloneBtn}`} 
          onClick={(e) => { e.stopPropagation(); onClone(dice); }}
          title="Clone Die"
          aria-label={`Copy ${dieName}`}
        >
          <Copy size={20} strokeWidth={2.5} color="currentColor" />
        </button>
      )}

      {/* Roll This Die (Bottom-Centre) */}
      {onRollOne && (
        <button 
          className={`${styles.actionBtn} ${styles.rollOneBtn}`} 
          onClick={(e) => { e.stopPropagation(); onRollOne(dice.id); }}
          title="Roll This Die"
          aria-label={`Roll only ${dieName}`}
        >
          <Dices size={20} strokeWidth={2.5} color="currentColor" />
        </button>
      )}

      {/* Remove Button (Top-Left) */}
      <button 
        className={`${styles.actionBtn} ${styles.removeBtn}`} 
        onClick={(e) => { e.stopPropagation(); onRemove(dice.id); }}
        title="Remove Die"
        aria-label={`Remove ${dieName}`}
      >
        <Trash2 size={18} strokeWidth={2.5} color="currentColor" />
      </button>
      </>)}
    </motion.div>
  );
};

export const Dice = React.memo(DiceComponent);
Dice.displayName = 'Dice';

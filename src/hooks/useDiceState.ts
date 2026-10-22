import { useState, useEffect, useCallback } from 'react';
import type { DiceData } from '../types';
import { generateId, parseFaceContent, faceNumericValue, FACE_ICON_PREFIX, isNumberedFaces } from '../utils/diceUtils';
import { MAX_DICE_LIMIT, MAX_HISTORY_LENGTH, ROLL_DURATION_MS, TOAST_DURATION_MS } from '../utils/constants';

export interface RollHistoryItem {
  id: string;
  total: number;
  details: string[];
  isTargetHit?: boolean;
  /** One die rolled on its own; kept out of the main total and the frequency chart */
  single?: boolean;
}

export interface RollSummary {
  total: number;
  diceCount: number;
  isTargetHit: boolean;
}

export type RollAdvantageMode = 'normal' | 'advantage' | 'disadvantage';

const loadStoredHistory = (): RollHistoryItem[] => {
  try {
    const stored = localStorage.getItem('rollHistory');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load roll history', e);
  }
  return [];
};

export const useDiceState = () => {
  const [diceList, setDiceList] = useState<DiceData[]>([]);
  const [rollHistory, setRollHistory] = useState<RollHistoryItem[]>(loadStoredHistory);

  // Persist roll history (capped) so it survives reloads and is included in backups
  useEffect(() => {
    try {
      localStorage.setItem('rollHistory', JSON.stringify(rollHistory.slice(0, MAX_HISTORY_LENGTH)));
    } catch (e) {
      console.error('Failed to save roll history', e);
    }
  }, [rollHistory]);
  const [isRolling, setIsRolling] = useState(false);
  // The die rolling on its own, or null when the whole set rolls
  const [rollingId, setRollingId] = useState<string | null>(null);
  const [modifier, setModifier] = useState<number>(0);
  const [rpgMode, setRpgMode] = useState<boolean>(() => localStorage.getItem('rpgMode') === 'true');
  const [rollAdvantage, setRollAdvantage] = useState<RollAdvantageMode>('normal');
  const [targetHighlight, setTargetHighlightState] = useState<string>(() => localStorage.getItem('targetHighlight') || '');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const toggleRpgMode = useCallback(() => {
    setRpgMode(prev => {
      const next = !prev;
      localStorage.setItem('rpgMode', String(next));
      if (!next) {
        setRollAdvantage('normal');
      }
      return next;
    });
  }, []);

  const setTargetHighlight = useCallback((val: string) => {
    setTargetHighlightState(val);
    localStorage.setItem('targetHighlight', val);
  }, []);

  const addDice = useCallback((template?: Partial<DiceData>) => {
    setDiceList(prev => {
      if (prev.length >= MAX_DICE_LIMIT) {
        showToast(`Maximum of ${MAX_DICE_LIMIT} dice reached.`);
        return prev;
      }
      const newDice: DiceData = {
        id: generateId(),
        numberValue: template?.numberValue ?? 1,
        faces: template?.faces ?? 6,
        currentFaceIndex: template?.currentFaceIndex ?? 0,
        name: template?.name ?? '',
        customFaces: template?.customFaces ? [...template.customFaces] : [],
        color: template?.color ?? '#E9EAEC',
        held: false,
      };
      return [...prev, newDice];
    });
  }, [showToast]);

  const removeDice = useCallback((id: string) => {
    setDiceList(prev => prev.filter(d => d.id !== id));
  }, []);

  const updateDice = useCallback((id: string, updates: Partial<DiceData>) => {
    setDiceList(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const toggleHold = useCallback((id: string) => {
    setDiceList(prev => prev.map(d => d.id === id ? { ...d, held: !d.held } : d));
  }, []);

  const toggleHoldAll = useCallback(() => {
    setDiceList(prev => {
      const allHeld = prev.length > 0 && prev.every(d => d.held);
      return prev.map(d => ({ ...d, held: !allHeld }));
    });
  }, []);

  const clearAllDice = useCallback(() => {
    setDiceList([]);
  }, []);

  /** Puts a removed die back where it was (used by Undo). */
  const insertDiceAt = useCallback((die: DiceData, index: number) => {
    setDiceList(prev => {
      if (prev.some(d => d.id === die.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(Math.max(index, 0), next.length), 0, die);
      return next;
    });
  }, []);

  /** Brings back a whole set of dice (used by Undo after Clear All). */
  const restoreDice = useCallback((list: DiceData[]) => {
    setDiceList(list);
  }, []);

  const rollDice = useCallback((onComplete?: (summary: RollSummary) => void, onlyId?: string) => {
    // With no dice there is nothing to roll; a modifier alone used to log a phantom total
    if (diceList.length === 0) return;
    setIsRolling(true);
    setRollingId(onlyId ?? null);
    
    let rollTotal = 0;
    const details: string[] = [];
    
    // 1. Pre-calculate final targets immediately at 0ms
    const rawTargetList = diceList.map(d => {
      // Held dice keep their value, except the one die asked to roll on its own;
      // every other die keeps its value during that single roll
      const keep = onlyId !== undefined ? d.id !== onlyId : d.held;
      if (keep) {
        let val = d.numberValue;
        if (d.customFaces.length > 0) {
          val = faceNumericValue(d.customFaces[d.currentFaceIndex ?? 0]);
        }
        return {
          ...d,
          targetValue: val,
          targetFaceIndex: d.currentFaceIndex,
          dropped: false,
          isCrit20: d.faces === 20 && val === 20,
          isCrit1: d.faces === 20 && val === 1
        };
      }

      let val = Math.floor(Math.random() * d.faces) + 1;
      let idx = 0;
      if (d.customFaces.length > 0) {
        idx = Math.floor(Math.random() * d.customFaces.length);
      }
      
      if (d.customFaces.length > 0) {
        val = faceNumericValue(d.customFaces[idx]);
      }

      return {
        ...d,
        targetValue: val,
        targetFaceIndex: idx,
        dropped: false,
        isCrit20: d.faces === 20 && val === 20,
        isCrit1: d.faces === 20 && val === 1
      };
    });

    // Handle Advantage / Disadvantage drop logic if rollAdvantage is active across any matching dice pool
    const processedList = [...rawTargetList];
    if (onlyId === undefined && rpgMode && rollAdvantage !== 'normal' && processedList.length > 1) {
      // Group PLAIN dice by face count (e.g. 2d20s, 4d6s). Custom-faced dice are excluded:
      // a percentile pair (tens + units) is two different dice that both report faces=10,
      // and grouping them would silently drop one half of every d100 roll. A die
      // whose faces are just 1..n in colour still counts as plain.
      const faceGroups: Record<number, { index: number; val: number }[]> = {};
      processedList.forEach((d, i) => {
        if (d.customFaces.length > 0 && !isNumberedFaces(d.customFaces)) return;
        if (!faceGroups[d.faces]) {
          faceGroups[d.faces] = [];
        }
        faceGroups[d.faces].push({ index: i, val: d.targetValue ?? 0 });
      });

      Object.values(faceGroups).forEach(group => {
        if (group.length >= 2) {
          if (rollAdvantage === 'advantage') {
            // Keep highest, drop lower ones
            const maxVal = Math.max(...group.map(x => x.val));
            let kept = false;
            group.forEach(item => {
              if (item.val === maxVal && !kept) {
                kept = true;
              } else {
                processedList[item.index].dropped = true;
              }
            });
          } else if (rollAdvantage === 'disadvantage') {
            // Keep lowest, drop higher ones
            const minVal = Math.min(...group.map(x => x.val));
            let kept = false;
            group.forEach(item => {
              if (item.val === minVal && !kept) {
                kept = true;
              } else {
                processedList[item.index].dropped = true;
              }
            });
          }
        }
      });
    }

    // Calculate sum total from non-dropped dice.
    // Every die gets a history line — unnamed dice fall back to a dN label, so
    // the default 2d6 no longer produce blank rows in the roll log. Custom-faced
    // dice show the face they landed on, since their numeric value is often 0.
    const ordinals: Record<number, number> = {};
    processedList.forEach(d => {
      const val = d.targetValue ?? d.numberValue;
      ordinals[d.faces] = (ordinals[d.faces] || 0) + 1;
      if (onlyId !== undefined && d.id !== onlyId) return;
      if (!d.dropped) {
        rollTotal += val;
      }

      const label = d.name || `d${d.faces} #${ordinals[d.faces]}`;

      let shown = String(val);
      if (d.customFaces.length > 0) {
        const idx = d.targetFaceIndex ?? d.currentFaceIndex ?? 0;
        const parsedFace = parseFaceContent(d.customFaces[idx] ?? '');
        const face = parsedFace.content;
        shown = face.startsWith(FACE_ICON_PREFIX) ? face.replace(FACE_ICON_PREFIX, '') : (face || String(val));
        // A symbol or word that counts as a number shows both, e.g. "Star (6)"
        if (parsedFace.value !== undefined && shown !== String(parsedFace.value)) shown = `${shown} (${parsedFace.value})`;
      }

      const dropSuffix = d.dropped ? ' (dropped)' : '';
      details.push(`${label}: ${shown}${dropSuffix}`);
    });

    const activeModifier = rpgMode && onlyId === undefined ? modifier : 0;
    const finalTotal = rollTotal + activeModifier;
    if (rpgMode && activeModifier !== 0) {
      details.push(`Modifier: ${activeModifier > 0 ? '+' : ''}${activeModifier}`);
    }

    // Evaluate Target Highlight Match (e.g. "7" or "6, 8")
    let isTargetHit = false;
    if (onlyId === undefined && targetHighlight.trim()) {
      const targets = targetHighlight.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      if (targets.includes(finalTotal)) {
        isTargetHit = true;
      }
    }

    setDiceList(processedList);

    // 2. Set timeout to finalize and reveal history
    setTimeout(() => {
      setDiceList(prev => prev.map(d => {
        return {
          ...d,
          numberValue: d.targetValue ?? d.numberValue,
          currentFaceIndex: d.targetFaceIndex ?? d.currentFaceIndex,
          targetValue: undefined,
          targetFaceIndex: undefined
        };
      }));

      setRollHistory(h => [{
        id: generateId(),
        total: finalTotal,
        details,
        isTargetHit,
        ...(onlyId !== undefined ? { single: true } : {})
      }, ...h].slice(0, MAX_HISTORY_LENGTH));
      setIsRolling(false);
      setRollingId(null);

      if (isTargetHit) {
        showToast(`🎯 Target Hit: ${finalTotal}!`);
      }

      onComplete?.({
        total: finalTotal,
        diceCount: onlyId !== undefined ? 1 : diceList.filter(d => !d.held).length,
        isTargetHit
      });
    }, ROLL_DURATION_MS);
  }, [diceList, modifier, rpgMode, rollAdvantage, targetHighlight, showToast]);

  const clearHistory = useCallback(() => {
    setRollHistory([]);
    try {
      localStorage.removeItem('rollHistory');
    } catch (e) {
      console.error(e);
    }
  }, []);

  return {
    diceList,
    setDiceList,
    rollHistory,
    isRolling,
    rollingId,
    modifier,
    setModifier,
    rpgMode,
    toggleRpgMode,
    rollAdvantage,
    setRollAdvantage,
    targetHighlight,
    setTargetHighlight,
    addDice,
    removeDice,
    updateDice,
    toggleHold,
    toggleHoldAll,
    clearAllDice,
    rollDice,
    clearHistory,
    toast,
    showToast,
    insertDiceAt,
    restoreDice
  };
};
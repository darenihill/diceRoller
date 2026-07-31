import { useState, useCallback } from 'react';
import type { DiceData } from '../types';
import { generateId, parseFaceContent, FACE_ICON_PREFIX } from '../utils/diceUtils';
import { MAX_DICE_LIMIT, ROLL_DURATION_MS, TOAST_DURATION_MS } from '../utils/constants';

export interface RollHistoryItem {
  id: string;
  total: number;
  details: string[];
  isTargetHit?: boolean;
}

export type RollAdvantageMode = 'normal' | 'advantage' | 'disadvantage';

export const useDiceState = () => {
  const [diceList, setDiceList] = useState<DiceData[]>([]);
  const [rollHistory, setRollHistory] = useState<RollHistoryItem[]>([]);
  const [isRolling, setIsRolling] = useState(false);
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

  const rollDice = useCallback(() => {
    setIsRolling(true);
    
    let rollTotal = 0;
    const details: string[] = [];
    
    // 1. Pre-calculate final targets immediately at 0ms
    const rawTargetList = diceList.map(d => {
      if (d.held) {
        let val = d.numberValue;
        if (d.customFaces.length > 0) {
          const idx = d.currentFaceIndex ?? 0;
          const parsed = parseFaceContent(d.customFaces[idx]);
          if (!parsed.content.startsWith(FACE_ICON_PREFIX)) {
            const num = parseInt(parsed.content);
            if (!isNaN(num)) val = num;
            else val = 0;
          } else {
            val = 0;
          }
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
        const parsed = parseFaceContent(d.customFaces[idx]);
        if (parsed.content.startsWith(FACE_ICON_PREFIX)) {
          val = 0;
        } else {
          const num = parseInt(parsed.content);
          if (!isNaN(num)) val = num;
          else val = 0;
        }
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

    // Handle Advantage / Disadvantage drop logic if rollAdvantage is active
    const processedList = [...rawTargetList];
    if (rpgMode && rollAdvantage !== 'normal' && processedList.length > 1) {
      // Find matching faces group (e.g. d20s)
      const d20Indices = processedList
        .map((d, i) => ({ index: i, val: d.targetValue ?? 0, faces: d.faces }))
        .filter(x => x.faces === 20);

      if (d20Indices.length >= 2) {
        if (rollAdvantage === 'advantage') {
          // Keep highest, drop lower ones
          const maxVal = Math.max(...d20Indices.map(x => x.val));
          let kept = false;
          d20Indices.forEach(item => {
            if (item.val === maxVal && !kept) {
              kept = true;
            } else {
              processedList[item.index].dropped = true;
            }
          });
        } else if (rollAdvantage === 'disadvantage') {
          // Keep lowest, drop higher ones
          const minVal = Math.min(...d20Indices.map(x => x.val));
          let kept = false;
          d20Indices.forEach(item => {
            if (item.val === minVal && !kept) {
              kept = true;
            } else {
              processedList[item.index].dropped = true;
            }
          });
        }
      }
    }

    // Calculate sum total from non-dropped dice
    processedList.forEach(d => {
      const val = d.targetValue ?? d.numberValue;
      if (!d.dropped) {
        rollTotal += val;
      }
      if (d.name) {
        const dropSuffix = d.dropped ? ' (dropped)' : '';
        details.push(`${d.name}: ${val}${dropSuffix}`);
      }
    });

    const activeModifier = rpgMode ? modifier : 0;
    const finalTotal = rollTotal + activeModifier;
    if (rpgMode && activeModifier !== 0) {
      details.push(`Modifier: ${activeModifier > 0 ? '+' : ''}${activeModifier}`);
    }

    // Evaluate Target Highlight Match (e.g. "7" or "6, 8")
    let isTargetHit = false;
    if (targetHighlight.trim()) {
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
        isTargetHit
      }, ...h]);
      setIsRolling(false);

      if (isTargetHit) {
        showToast(`🎯 Target Hit: ${finalTotal}!`);
      }
    }, ROLL_DURATION_MS);
  }, [diceList, modifier, rpgMode, rollAdvantage, targetHighlight, showToast]);

  const clearHistory = useCallback(() => {
    setRollHistory([]);
  }, []);

  return {
    diceList,
    setDiceList,
    rollHistory,
    isRolling,
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
    showToast
  };
};
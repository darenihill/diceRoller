import { useState, useCallback } from 'react';
import type { DiceData } from '../types';
import { generateId, parseFaceContent, FACE_ICON_PREFIX } from '../utils/diceUtils';

export interface RollHistoryItem {
  id: string;
  total: number;
  details: string[];
}

export const useDiceState = () => {
  const [diceList, setDiceList] = useState<DiceData[]>([]);
  const [rollHistory, setRollHistory] = useState<RollHistoryItem[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [modifier, setModifier] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const addDice = useCallback((template?: Partial<DiceData>) => {
    setDiceList(prev => {
      if (prev.length >= 50) {
        showToast("Maximum of 50 dice reached.");
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
    setTimeout(() => {
      setDiceList(prev => {
        let rollTotal = 0;
        const details: string[] = [];
        
        const nextList = prev.map(d => {
          if (d.held) {
            let val = d.numberValue;
            let display = val.toString();
            if (d.customFaces.length > 0) {
              const idx = d.currentFaceIndex ?? 0;
              const parsed = parseFaceContent(d.customFaces[idx]);
              display = parsed.content;
              if (!parsed.content.startsWith(FACE_ICON_PREFIX)) {
                const num = parseInt(parsed.content);
                if (!isNaN(num)) val = num;
                else val = 0;
              } else {
                val = 0;
              }
            }
            rollTotal += val;
            if (d.name) details.push(`${d.name}: ${display}`);
            return d;
          }

          let val = Math.floor(Math.random() * d.faces) + 1;
          let idx = 0;
          if (d.customFaces.length > 0) {
            idx = Math.floor(Math.random() * d.customFaces.length);
          }
          
          let display = val.toString();
          if (d.customFaces.length > 0) {
            const parsed = parseFaceContent(d.customFaces[idx]);
            display = parsed.content;
            if (parsed.content.startsWith(FACE_ICON_PREFIX)) {
              val = 0;
            } else {
              const num = parseInt(parsed.content);
              if (!isNaN(num)) val = num;
              else val = 0;
            }
          }
          
          rollTotal += val;
          if (d.name) details.push(`${d.name}: ${display}`);

          return {
            ...d,
            numberValue: val,
            currentFaceIndex: idx
          };
        });

        const finalTotal = rollTotal + modifier;
        if (modifier !== 0) {
          details.push(`Modifier: ${modifier > 0 ? '+' : ''}${modifier}`);
        }

        setRollHistory(h => [{
          id: generateId(),
          total: finalTotal,
          details
        }, ...h]);

        return nextList;
      });
      setIsRolling(false);
    }, 600);
  }, [modifier]);

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
    addDice,
    removeDice,
    updateDice,
    toggleHold,
    toggleHoldAll,
    clearAllDice,
    rollDice,
    clearHistory,
    toast
  };
};
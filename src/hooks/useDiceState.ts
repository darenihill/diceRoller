import { useState, useCallback } from 'react';
import type { DiceData } from '../types';
import { generateId } from '../utils/diceUtils';

export interface RollHistoryItem {
  id: string;
  total: number;
  details: string[];
}

export const useDiceState = () => {
  const [diceList, setDiceList] = useState<DiceData[]>([]);
  const [rollHistory, setRollHistory] = useState<RollHistoryItem[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  const addDice = useCallback((template?: Partial<DiceData>) => {
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
    setDiceList(prev => [...prev, newDice]);
  }, []);

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
                display = d.customFaces[idx];
                const parts = display.split(':bg:');
                if (!parts[0].startsWith(':icon:')) {
                   const parsed = parseInt(parts[0]);
                   if (!isNaN(parsed)) val = parsed;
                } else {
                   val = 0;
                }
            }
            rollTotal += val;
            if (d.name) details.push(`${d.name}: ${display.split(':bg:')[0]}`);
            return d;
          }

          let val = Math.floor(Math.random() * d.faces) + 1;
          let idx = 0;
          if (d.customFaces.length > 0) {
            idx = Math.floor(Math.random() * d.customFaces.length);
          }
          
          let display = val.toString();
          if (d.customFaces.length > 0) {
              display = d.customFaces[idx];
              const parts = display.split(':bg:');
              if (parts[0].startsWith(':icon:')) {
                  val = 0;
              } else {
                  const parsed = parseInt(parts[0]);
                  if (!isNaN(parsed)) val = parsed;
              }
          }
          
          rollTotal += val;
          if (d.name) details.push(`${d.name}: ${display.split(':bg:')[0]}`);

          return {
            ...d,
            numberValue: val,
            currentFaceIndex: idx
          };
        });

        setRollHistory(h => [{
          id: generateId(),
          total: rollTotal,
          details
        }, ...h]);

        return nextList;
      });
      setIsRolling(false);
    }, 600);
  }, []);

  const clearHistory = useCallback(() => {
    setRollHistory([]);
  }, []);

  return {
    diceList,
    setDiceList,
    rollHistory,
    isRolling,
    addDice,
    removeDice,
    updateDice,
    toggleHold,
    toggleHoldAll,
    clearAllDice,
    rollDice,
    clearHistory
  };
};
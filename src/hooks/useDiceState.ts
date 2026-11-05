import { useState, useEffect, useCallback, useRef } from 'react';
import type { DiceData } from '../types';
import { generateId, parseFaceContent, faceNumericValue, faceLabel, isNumberedFaces, percentileBonus } from '../utils/diceUtils';
import { luckSet } from '../utils/fairOdds';
import { MAX_DICE_LIMIT, MAX_HISTORY_LENGTH, MAX_NAME_LENGTH, ROLL_DURATION_MS, TOAST_DURATION_MS } from '../utils/constants';
import { randomBelow } from '../utils/fairRandom';
import { saveItem, readItem, removeItem } from '../utils/safeStorage';
import { SAVED } from '../utils/savedValues';

export interface RollHistoryItem {
  id: string;
  total: number;
  details: string[];
  isTargetHit?: boolean;
  /** One die rolled on its own; kept out of the main total and the frequency chart */
  single?: boolean;
  /** The RPG modifier already counted in total, so the button can show its math */
  modifier?: number;
  /** What was typed in the "Type a roll" box, e.g. "2d6+3" */
  typed?: string;
  /** Which dice the roll used (faces, held values, RPG settings), so the Luck Meter can tell when they changed */
  set?: string;
  /** The game's name when the dice matched one (Catan), for sorting history by game */
  game?: string;
  /** When it was rolled (ms), for the "Switched to …" lines in the log */
  at?: number;
}

export interface RollSummary {
  total: number;
  diceCount: number;
  isTargetHit: boolean;
  /** Ids of d20s that rolled a 20 in RPG Mode and count (not held, not dropped) */
  natural20Ids: string[];
}

export type RollAdvantageMode = 'normal' | 'advantage' | 'disadvantage';

export const MODIFIER_KEY = 'rollModifier';
export const ADVANTAGE_KEY = 'rollAdvantage';
const MAX_STORED_MODIFIER = 999;

function readStored(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function storeQuietly(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage full or blocked: the setting just isn't kept */ }
}

function readStoredModifier(): number {
  const n = Number(readStored(MODIFIER_KEY));
  return Number.isInteger(n) && Math.abs(n) <= MAX_STORED_MODIFIER ? n : 0;
}

function readStoredAdvantage(): RollAdvantageMode {
  const v = readStored(ADVANTAGE_KEY);
  return v === 'advantage' || v === 'disadvantage' ? v : 'normal';
}

/** A roll typed in the box: the dice to put out, then roll straight away */
export interface TypedRollSetup {
  text: string;
  dice: DiceData[];
  modifier: number;
  advantage: RollAdvantageMode;
}

/**
 * Roll history can come from a backup file, which anyone can hand-edit, so
 * keep only well-formed rolls. A malformed one would break the History screen.
 */
export function sanitizeRollHistory(input: unknown): RollHistoryItem[] {
  if (!Array.isArray(input)) return [];
  const out: RollHistoryItem[] = [];
  for (const raw of input.slice(0, MAX_HISTORY_LENGTH)) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const total = Number(r.total);
    if (typeof r.total !== 'number' || !Number.isFinite(total) || !Array.isArray(r.details)) continue;
    const item: RollHistoryItem = {
      id: typeof r.id === 'string' && r.id ? r.id.slice(0, 64) : generateId(),
      total,
      details: r.details.filter((d): d is string => typeof d === 'string').map(d => d.slice(0, 200)).slice(0, MAX_DICE_LIMIT + 1), // every die, plus the Modifier line
    };
    if (r.isTargetHit === true) item.isTargetHit = true;
    if (r.single === true) item.single = true;
    if (typeof r.modifier === 'number' && Number.isFinite(r.modifier)) item.modifier = r.modifier;
    if (typeof r.typed === 'string' && r.typed) item.typed = r.typed.slice(0, 40);
    // Kept across reloads, so the Luck Meter and the per-game history still know the dice
    if (typeof r.set === 'string' && r.set.length <= 20000) item.set = r.set;
    if (typeof r.game === 'string' && r.game) item.game = r.game.slice(0, MAX_NAME_LENGTH);
    if (typeof r.at === 'number' && Number.isFinite(r.at) && r.at > 0) item.at = r.at;
    out.push(item);
  }
  return out;
}

const loadStoredHistory = (): RollHistoryItem[] => {
  try {
    const stored = readItem(SAVED.rollHistory);
    if (stored) return sanitizeRollHistory(JSON.parse(stored));
  } catch (e) {
    console.error('Failed to load roll history', e);
  }
  return [];
};

export const useDiceState = () => {
  const [diceList, setDiceList] = useState<DiceData[]>([]);
  const [rollHistory, setRollHistory] = useState<RollHistoryItem[]>(loadStoredHistory);
  /** The game name for the dice on screen, kept up to date by App, so a roll can record it */
  const gameNameRef = useRef<string | null>(null);

  // Persist roll history (capped) so it survives reloads and is included in backups
  useEffect(() => {
    saveItem(SAVED.rollHistory, JSON.stringify(rollHistory.slice(0, MAX_HISTORY_LENGTH)));
  }, [rollHistory]);
  const [isRolling, setIsRolling] = useState(false);
  // The die rolling on its own, or null when the whole set rolls
  const [rollingId, setRollingId] = useState<string | null>(null);
  // The +2 and the ADV / NORM / DIS pick are kept on this device, like RPG mode,
  // so they are still set when someone comes back to the app
  const [modifier, setModifier] = useState<number>(readStoredModifier);
  const [rpgMode, setRpgMode] = useState<boolean>(() => readItem(SAVED.rpgMode) === 'true');
  const [rollAdvantage, setRollAdvantage] = useState<RollAdvantageMode>(readStoredAdvantage);
  useEffect(() => { storeQuietly(MODIFIER_KEY, String(modifier)); }, [modifier]);
  useEffect(() => { storeQuietly(ADVANTAGE_KEY, rollAdvantage); }, [rollAdvantage]);
  const [targetHighlight, setTargetHighlightState] = useState<string>(() => readItem(SAVED.targetHighlight) || '');
  const [toast, setToast] = useState<string | null>(null);

  // One timer for the one message, so an older message's timer never cuts a newer one short
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const toggleRpgMode = useCallback(() => {
    setRpgMode(prev => {
      const next = !prev;
      saveItem(SAVED.rpgMode, String(next));
      if (!next) {
        setRollAdvantage('normal');
      }
      return next;
    });
  }, []);

  const setTargetHighlight = useCallback((val: string) => {
    setTargetHighlightState(val);
    saveItem(SAVED.targetHighlight, val);
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

  const releaseAll = useCallback(() => {
    setDiceList(prev => prev.map(d => (d.held ? { ...d, held: false } : d)));
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

  // The roll that is tumbling now: its timer and the step that lands it
  const tumbleRef = useRef<{ timer: ReturnType<typeof setTimeout>; land: () => void } | null>(null);

  /** Rolls the dice; returns 'landed' when the tap only landed a tumbling roll.
   *  `landed` holds what the 3D tray's dice came to rest on: those dice take
   *  that value and the roll lands at once, since the tray already tumbled it. */
  const rollDice = useCallback((onComplete?: (summary: RollSummary) => void, onlyId?: string, typed?: TypedRollSetup, landed?: Record<string, number>): 'rolled' | 'landed' | 'none' => {
    // A typed roll brings its own dice, modifier and advantage, so it rolls
    // what was typed now rather than waiting a render for the state to catch up
    const list = typed?.dice ?? diceList;
    const rollModifier = typed ? typed.modifier : modifier;
    const advantageMode = typed ? typed.advantage : rollAdvantage;
    // With no dice there is nothing to roll; a modifier alone used to log a phantom total
    if (list.length === 0) return 'none';
    // A second tap during the tumble lands the dice at once. The result was
    // picked when the roll started, so it stays the same and History gets one entry
    if (tumbleRef.current) {
      clearTimeout(tumbleRef.current.timer);
      tumbleRef.current.land();
      return 'landed';
    }
    setIsRolling(true);
    setRollingId(onlyId ?? null);
    
    let rollTotal = 0;
    const details: string[] = [];
    
    // 1. Pre-calculate final targets immediately at 0ms
    const rawTargetList = list.map(d => {
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

      let val = landed?.[d.id] ?? randomBelow(d.faces) + 1;
      let idx = 0;
      if (d.customFaces.length > 0) {
        idx = randomBelow(d.customFaces.length);
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
    if (onlyId === undefined && rpgMode && advantageMode !== 'normal' && processedList.length > 1) {
      // Group PLAIN dice by face count (e.g. 2d20s, 4d6s). Custom-faced dice are excluded:
      // a percentile pair (tens + units) is two different dice that both report faces=10,
      // and grouping them would silently drop one half of every d100 roll. A die
      // whose faces are just 1..n in color still counts as plain.
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
          if (advantageMode === 'advantage') {
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
          } else if (advantageMode === 'disadvantage') {
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
        shown = faceLabel(face) || String(val);
        // A symbol or word that counts as a number shows both, e.g. "Star (6)"
        if (parsedFace.value !== undefined && shown !== String(parsedFace.value)) shown = `${shown} (${parsedFace.value})`;
      }

      const dropSuffix = d.dropped ? ' (dropped)' : '';
      details.push(`${label}: ${shown}${dropSuffix}`);
    });

    if (onlyId === undefined) {
      rollTotal += percentileBonus(processedList.map(d => ({ ...d, value: d.targetValue ?? d.numberValue })));
    }

    const activeModifier = rpgMode && onlyId === undefined ? rollModifier : 0;
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

    // A natural 20 earns the confetti only when it was rolled now (not a held
    // die keeping its 20) and counts (not the die Disadvantage drops)
    const natural20Ids = rpgMode
      ? processedList
          .filter(d => d.isCrit20 && !d.dropped && (onlyId !== undefined ? d.id === onlyId : !d.held))
          .map(d => d.id)
      : [];

    // 2. Land the dice and reveal history once the tumble ends
    const land = () => {
      tumbleRef.current = null;
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
        ...(onlyId !== undefined ? { single: true } : {}),
        ...(activeModifier !== 0 ? { modifier: activeModifier } : {}),
        ...(typed && onlyId === undefined ? { typed: typed.text } : {}),
        ...(onlyId === undefined ? { set: luckSet(list, rpgMode, rollModifier, advantageMode) } : {}),
        ...(onlyId === undefined && !typed && gameNameRef.current ? { game: gameNameRef.current } : {}),
        at: Date.now(),
      }, ...h].slice(0, MAX_HISTORY_LENGTH));
      setIsRolling(false);
      setRollingId(null);

      if (isTargetHit) {
        showToast(`🎯 Target Hit: ${finalTotal}!`);
      }

      onComplete?.({
        total: finalTotal,
        diceCount: onlyId !== undefined ? 1 : list.filter(d => !d.held).length,
        isTargetHit,
        natural20Ids
      });
    };
    if (landed) {
      land();
      return 'rolled';
    }
    tumbleRef.current = { timer: setTimeout(land, ROLL_DURATION_MS), land };
    return 'rolled';
  }, [diceList, modifier, rpgMode, rollAdvantage, targetHighlight, showToast]);

  const clearHistory = useCallback(() => {
    setRollHistory([]);
    try {
      removeItem(SAVED.rollHistory);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Undo for Clear History; the history save effect writes it back to storage
  const restoreHistory = useCallback((list: RollHistoryItem[]) => setRollHistory(list), []);

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
    releaseAll,
    clearAllDice,
    rollDice,
    clearHistory,
    gameNameRef,
    restoreHistory,
    toast,
    showToast,
    insertDiceAt,
    restoreDice
  };
};
import { useState, useEffect, useCallback } from 'react';
import type { DiceConfig, DiceData } from '../types';
import { readItem, saveItem } from '../utils/safeStorage';
import { SAVED } from '../utils/savedValues';

/**
 * Saved games can come from a backup file, which anyone can hand-edit. Keep
 * only entries the Games screen can show: a text name and a list of dice.
 * A name that isn't text would crash that screen every time it opened.
 */
export function sanitizeSavedConfigs(input: unknown): Record<string, DiceConfig> {
  const out: Record<string, DiceConfig> = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = raw as Record<string, unknown>;
    out[key] = {
      ...(entry as object),
      name: typeof entry.name === 'string' ? entry.name : key,
      config: Array.isArray(entry.config) ? entry.config as DiceData[] : [],
    } as DiceConfig;
  }
  return out;
}

// Set once a backup has been put back and the page is about to reload: the
// leaving page's autosave used to write its old games over the imported ones
// (review 2026-11-06), so nothing more is saved from this page.
let savesFrozen = false;
export function freezeSaves(): void { savesFrozen = true; }
/** For tests */
export function unfreezeSavesForTests(): void { savesFrozen = false; }

export function useStorage() {
  const [savedConfigs, setSavedConfigs] = useState<Record<string, DiceConfig>>({});

  // Load from local storage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = readItem(SAVED.games);
        if (stored) {
          setSavedConfigs(sanitizeSavedConfigs(JSON.parse(stored)));
        }
      } catch (e) {
        console.error("Failed to load configs", e);
      }
    };
    loadFromStorage();
  }, []);

  const saveConfig = useCallback((name: string, config: DiceData[]) => {
    setSavedConfigs((prev) => {
      if (savesFrozen) return prev;
      const updated = { ...prev, [name]: { name, config } };
      saveItem(SAVED.games, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteConfig = useCallback((name: string) => {
    setSavedConfigs((prev) => {
      if (savesFrozen) return prev;
      const updated = { ...prev };
      delete updated[name];
      saveItem(SAVED.games, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /** Puts a deleted game back in the place it had in the list (used by Undo) */
  const restoreConfig = useCallback((entry: DiceConfig, at: number) => {
    setSavedConfigs((prev) => {
      if (savesFrozen) return prev;
      const entries = Object.entries(prev).filter(([key]) => key !== entry.name);
      entries.splice(Math.min(Math.max(at, 0), entries.length), 0, [entry.name, entry]);
      const updated = Object.fromEntries(entries);
      saveItem(SAVED.games, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getSystemAutosave = useCallback((): DiceConfig | null => {
    try {
      const stored = readItem(SAVED.games);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed['systemAutosave']) {
          // Intentionally NOT deleted after reading: mobile browsers frequently
          // skip unload events, so a delete-on-read would lose the autosave if
          // the next session ends without a successful re-save.
          return parsed['systemAutosave'];
        }
      }
    } catch (e) {
      console.error("Failed to load system autosave", e);
    }
    return null;
  }, []);

  return {
    savedConfigs,
    saveConfig,
    deleteConfig,
    restoreConfig,
    getSystemAutosave
  };
}

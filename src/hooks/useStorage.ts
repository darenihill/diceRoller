import { useState, useEffect, useCallback, useRef } from 'react';
import type { DiceConfig, DiceData } from '../types';
import { readItem, saveItem } from '../utils/safeStorage';
import { SAVED } from '../utils/savedValues';

/**
 * Saved games can come from a backup file, which anyone can hand-edit. Keep
 * only entries the Games screen can show: a text name and a list of dice.
 * A name that isn't text would crash that screen every time it opened.
 */
export function sanitizeSavedConfigs(input: unknown): Record<string, DiceConfig> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const entries: [string, DiceConfig][] = [];
  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = raw as Record<string, unknown>;
    entries.push([key, {
      ...(entry as object),
      name: typeof entry.name === 'string' ? entry.name : key,
      config: Array.isArray(entry.config) ? entry.config as DiceData[] : [],
    } as DiceConfig]);
  }
  // fromEntries, not out[key] = …: a game named __proto__ set the object's
  // prototype instead and vanished on reload (code review 2026-11-21)
  return Object.fromEntries(entries);
}

/** The saved games as storage holds them now, or null when it can't be read */
function readStoredGames(): Record<string, DiceConfig> | null {
  try {
    const stored = readItem(SAVED.games);
    return stored ? sanitizeSavedConfigs(JSON.parse(stored)) : {};
  } catch (e) {
    console.error("Failed to load configs", e);
    return null;
  }
}

// Set once a backup has been put back and the page is about to reload: the
// leaving page's autosave used to write its old games over the imported ones
// (review 2026-11-06), so nothing more is saved from this page.
let savesFrozen = false;
export function freezeSaves(): void { savesFrozen = true; }
/** For tests */
export function unfreezeSavesForTests(): void { savesFrozen = false; }

export function useStorage() {
  // Read when the hook first runs, so a save never starts from an empty list
  const [savedConfigs, setSavedConfigs] = useState<Record<string, DiceConfig>>(() => readStoredGames() ?? {});
  const latest = useRef(savedConfigs);
  // Games whose save storage refused: still shown, and kept by the next save
  const unsaved = useRef<Record<string, DiceConfig | null>>({});

  const show = useCallback((games: Record<string, DiceConfig>) => {
    latest.current = games;
    setSavedConfigs(games);
  }, []);

  /** What storage holds, with this tab's refused saves laid over it */
  const current = useCallback((): Record<string, DiceConfig> => {
    const stored = readStoredGames();
    if (stored === null) return latest.current;
    const out = { ...stored };
    for (const [name, entry] of Object.entries(unsaved.current)) {
      if (entry) Object.defineProperty(out, name, { value: entry, enumerable: true, writable: true, configurable: true });
      else delete out[name];
    }
    return out;
  }, []);

  // Another tab saved or deleted a game: show the list as it is now
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SAVED.games || (e.storageArea && e.storageArea !== localStorage)) return;
      if (!savesFrozen) show(current());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [current, show]);

  /**
   * Each change starts from what storage holds now, not this tab's copy from
   * when it opened: a second open tab's autosave used to write its old list
   * over games saved in the other tab (code review 2026-11-21).
   */
  const change = useCallback((edit: (games: Record<string, DiceConfig>) => Record<string, DiceConfig>, touched: string, entry: DiceConfig | null) => {
    if (savesFrozen) return;
    const updated = edit(current());
    if (saveItem(SAVED.games, JSON.stringify(updated))) unsaved.current = {};
    else unsaved.current = { ...unsaved.current, [touched]: entry };
    show(updated);
  }, [current, show]);

  const saveConfig = useCallback((name: string, config: DiceData[]) => {
    const entry = { name, config };
    change(games => ({ ...games, [name]: entry }), name, entry);
  }, [change]);

  const deleteConfig = useCallback((name: string) => {
    change(games => {
      const updated = { ...games };
      delete updated[name];
      return updated;
    }, name, null);
  }, [change]);

  /** Puts a deleted game back in the place it had in the list (used by Undo) */
  const restoreConfig = useCallback((entry: DiceConfig, at: number) => {
    change(games => {
      const entries = Object.entries(games).filter(([key]) => key !== entry.name);
      entries.splice(Math.min(Math.max(at, 0), entries.length), 0, [entry.name, entry]);
      return Object.fromEntries(entries);
    }, entry.name, entry);
  }, [change]);

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

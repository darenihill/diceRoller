import { useState, useEffect, useCallback } from 'react';
import type { DiceConfig, DiceData } from '../types';

export function useStorage() {
  const [savedConfigs, setSavedConfigs] = useState<Record<string, DiceConfig>>({});

  // Load from local storage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem('diceConfigs');
        if (stored) {
          setSavedConfigs(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load configs", e);
      }
    };
    loadFromStorage();
  }, []);

  const saveConfig = useCallback((name: string, config: DiceData[]) => {
    setSavedConfigs((prev) => {
      const updated = { ...prev, [name]: { name, config } };
      localStorage.setItem('diceConfigs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteConfig = useCallback((name: string) => {
    setSavedConfigs((prev) => {
      const updated = { ...prev };
      delete updated[name];
      localStorage.setItem('diceConfigs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getSystemAutosave = useCallback((): DiceConfig | null => {
    try {
      const stored = localStorage.getItem('diceConfigs');
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
    getSystemAutosave
  };
}

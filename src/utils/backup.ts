/**
 * The Export backup file and how it comes back in. It carries every saved
 * value in savedValues.ts, so a restore brings back your games and all your
 * settings, RPG Mode and shake to roll included. Older backups, which lack the
 * newer fields, still import: what they don't carry stays as it is.
 */
import { sanitizeDiceList, sanitizeDiceScale } from './diceUtils';
import { usedFaceImages, importFaceImages } from './faceImages';
import { MAX_HISTORY_LENGTH } from './constants';
import { readItem, saveItem } from './safeStorage';
import { SAVED } from './savedValues';

export const BACKUP_VERSION = '1.1';

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = readItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

/** Everything saved on this device, as one backup object */
export function buildBackup(onScreen: { customFaces: string[] }[] = []) {
  return {
    version: BACKUP_VERSION,
    configs: readJson<Record<string, unknown>>(SAVED.games, {}),
    defaultSet: readJson<unknown[]>(SAVED.defaultSet, []),
    rollHistory: readJson<unknown[]>(SAVED.rollHistory, []),
    theme: readItem(SAVED.theme) || 'theme-dark',
    soundEnabled: readItem(SAVED.sound) === 'true',
    diceScale: sanitizeDiceScale(readItem(SAVED.diceScale)),
    rpgMode: readItem(SAVED.rpgMode) === 'true',
    shakeToRoll: readItem(SAVED.shakeToRoll) === 'true',
    targetHighlight: readItem(SAVED.targetHighlight) || '',
    telemetryEnabled: readItem(SAVED.telemetry) !== 'false',
    usageStats: readJson<Record<string, unknown> | null>(SAVED.usageStats, null),
    // Only pictures a face still names, on screen or in a saved set
    faceImages: usedFaceImages(onScreen),
  };
}

/** What happened to a restore: done, not a backup, too big, or done without some pictures */
export type RestoreResult = 'ok' | 'invalid' | 'full' | 'pictures';

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Puts a backup's values back on this device; nothing is saved from a file that isn't a backup */
export function restoreBackup(input: unknown): RestoreResult {
  if (!isObject(input)) return 'invalid';
  const data = input;

  // A backup that doesn't fit stops here: no reload, no false "Imported"
  let fits = true;
  const keep = (key: string, value: string) => { fits = saveItem(key, value) && fits; };

  if (isObject(data.configs)) {
    // Sanitize every dice list inside the backup before it reaches storage
    const configs: Record<string, unknown> = {};
    for (const [name, entry] of Object.entries(data.configs)) {
      if (isObject(entry)) configs[name] = { ...entry, config: sanitizeDiceList(entry.config) };
    }
    keep(SAVED.games, JSON.stringify({ ...readJson<Record<string, unknown>>(SAVED.games, {}), ...configs }));
  }
  if (data.defaultSet) keep(SAVED.defaultSet, JSON.stringify(sanitizeDiceList(data.defaultSet)));
  if (Array.isArray(data.rollHistory)) keep(SAVED.rollHistory, JSON.stringify(data.rollHistory.slice(0, MAX_HISTORY_LENGTH)));
  if (typeof data.theme === 'string' && data.theme) keep(SAVED.theme, data.theme);
  if (data.soundEnabled !== undefined) keep(SAVED.sound, String(data.soundEnabled === true));
  // Older backups have no dice size; they import at the default
  keep(SAVED.diceScale, String(sanitizeDiceScale(data.diceScale)));
  // Added in 1.1: older backups leave these settings as they are
  if (typeof data.rpgMode === 'boolean') keep(SAVED.rpgMode, String(data.rpgMode));
  if (typeof data.shakeToRoll === 'boolean') keep(SAVED.shakeToRoll, String(data.shakeToRoll));
  if (typeof data.targetHighlight === 'string') keep(SAVED.targetHighlight, data.targetHighlight);
  if (typeof data.telemetryEnabled === 'boolean') keep(SAVED.telemetry, String(data.telemetryEnabled));
  if (isObject(data.usageStats)) keep(SAVED.usageStats, JSON.stringify(data.usageStats));

  if (!fits) return 'full';
  // Pictures on faces; older backups have none
  if (isObject(data.faceImages) && Object.keys(data.faceImages).length > 0 && !importFaceImages(data.faceImages)) return 'pictures';
  return 'ok';
}

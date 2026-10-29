/**
 * Every value Dice Roller keeps on this device, in one list, so a backup can
 * carry all of them and a new setting is not forgotten.
 */
export const SAVED = {
  /** Saved games, plus the dice that were out last time (systemAutosave) */
  games: 'diceConfigs',
  defaultSet: 'defaultDiceSet',
  rollHistory: 'rollHistory',
  theme: 'appTheme',
  sound: 'soundEnabled',
  diceScale: 'diceScale',
  rpgMode: 'rpgMode',
  shakeToRoll: 'shakeToRoll',
  targetHighlight: 'targetHighlight',
  telemetry: 'telemetryEnabled',
  usageStats: 'diceAnalyticsStats',
  /** Pictures on faces, kept apart because they are large (faceImages.ts) */
  faceImages: 'diceFaceImages',
} as const;

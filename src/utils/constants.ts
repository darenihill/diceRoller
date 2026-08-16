export const MAX_DICE_LIMIT = 50;
export const MAX_HISTORY_LENGTH = 200;

// Bounds applied to untrusted dice payloads (share links, backups, autosave)
export const MIN_FACES = 1;
export const MAX_FACES = 1000;
export const MAX_CUSTOM_FACES = 100;
export const MAX_FACE_TEXT_LENGTH = 60;
export const MAX_NAME_LENGTH = 40;

/** Longest custom face text that still fits inside a polyhedral silhouette. */
export const MAX_SHAPED_FACE_LENGTH = 3;
export const GA_MEASUREMENT_ID = 'G-LF0JH7CVP6';
export const ROLL_TICK_INTERVAL_MS = 200;
export const ROLL_DURATION_MS = 800;
export const TOAST_DURATION_MS = 3000;
export const DEFAULT_DEV_PORT = 4500; // block 4500 per aiprojects/PORTS.md

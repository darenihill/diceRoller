import type { DiceData } from '../types';
import {
  MAX_DICE_LIMIT, MIN_FACES, MAX_FACES, MAX_CUSTOM_FACES,
  MAX_FACE_TEXT_LENGTH, MAX_NAME_LENGTH
} from './constants';

export const FACE_BG_DELIMITER = ':bg:';
export const FACE_ICON_PREFIX = ':icon:';
/** Optional suffix giving a symbol or word face a number to count as, e.g. ':icon:Star:bg:#FFD700:val:6' */
export const FACE_VALUE_DELIMITER = ':val:';
const FACE_VALUE_RE = /:val:(-?\d{1,4})$/;
/**
 * Optional marker naming a picture kept on this device, e.g. '3:img:k2x9a1:bg:#FFD700'.
 * The picture itself lives in local storage (utils/faceImages.ts), never in the
 * face string, so share links stay short; the face's text shows wherever the
 * picture is missing.
 */
export const FACE_IMAGE_DELIMITER = ':img:';
const FACE_IMAGE_RE = /:img:([a-z0-9]{1,16})$/;
/** Trailing parts a face may carry after its text: picture, colour, Counts as. */
const FACE_SUFFIX_RE = /(?::img:[a-z0-9]{1,16})?(?::bg:#[0-9a-fA-F]{3,8}|:bg:transparent)?(?::val:-?\d{1,4})?$/;

export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export interface ParsedFace {
  content: string;
  bgColor: string;
  /** The number this face counts as, when one was set */
  value?: number;
  /** Id of a picture kept on this device, when one was chosen */
  image?: string;
}

export function parseFaceContent(faceStr: string, defaultBg: string = 'transparent'): ParsedFace {
  if (!faceStr) {
    return { content: '', bgColor: defaultBg };
  }
  const valueMatch = faceStr.match(FACE_VALUE_RE);
  const rest = valueMatch ? faceStr.slice(0, valueMatch.index) : faceStr;
  const parts = rest.split(FACE_BG_DELIMITER);
  const imageMatch = parts[0].match(FACE_IMAGE_RE);
  return {
    content: imageMatch ? parts[0].slice(0, imageMatch.index) : parts[0],
    bgColor: parts[1] || defaultBg,
    ...(valueMatch ? { value: Number(valueMatch[1]) } : {}),
    ...(imageMatch ? { image: imageMatch[1] } : {})
  };
}

/** Builds a face string; leaves out the parts that aren't set. */
export function buildFace(content: string, bgColor?: string, value?: number, image?: string): string {
  const img = image && /^[a-z0-9]{1,16}$/.test(image) ? `${FACE_IMAGE_DELIMITER}${image}` : '';
  const bg = bgColor && bgColor !== 'transparent' ? `${FACE_BG_DELIMITER}${bgColor}` : '';
  const val = value !== undefined && Number.isInteger(value) ? `${FACE_VALUE_DELIMITER}${value}` : '';
  return `${content}${img}${bg}${val}`;
}

/**
 * The dice as a share link carries them: pictures stay on this device, so
 * each picture face travels as its text, colour and number only.
 */
export function withoutFaceImages(dice: DiceData[]): DiceData[] {
  return dice.map(d => d.customFaces.some(f => f.includes(FACE_IMAGE_DELIMITER))
    ? {
        ...d,
        customFaces: d.customFaces.map(f => {
          const p = parseFaceContent(f, '');
          return p.image ? buildFace(p.content, p.bgColor || undefined, p.value) : f;
        })
      }
    : d);
}

/** What a face adds to a total: its Counts as number, else its number text, else 0. */
export function faceNumericValue(faceStr: string): number {
  const parsed = parseFaceContent(faceStr);
  if (parsed.value !== undefined) return parsed.value;
  if (parsed.content.startsWith(FACE_ICON_PREFIX)) return 0;
  const num = parseInt(parsed.content);
  return isNaN(num) ? 0 : num;
}

/** Parse a hex color string and return its perceived brightness (0-255). */
function getColorBrightness(hex: string): number {
  if (!hex || hex === 'transparent') return 0;
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  let r: number, g: number, b: number;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  } else {
    return 0;
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) return 0;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/** Returns '#000000' or '#FFFFFF' for maximum contrast against the given hex color. */
export function getContrastColor(hex: string): string {
  return getColorBrightness(hex) > 125 ? '#000000' : '#FFFFFF';
}

/**
 * Coerces an untrusted dice payload (share link, saved default, autosave,
 * imported backup) into well-formed DiceData. Anything from those sources is
 * attacker-controllable in practice — a share link is just a URL someone can
 * hand-craft — so every field is clamped rather than trusted, and the list is
 * capped at MAX_DICE_LIMIT, which the in-app add path already enforces.
 * Returns [] for anything that isn't a usable array.
 */
export function sanitizeDiceList(input: unknown): DiceData[] {
  if (!Array.isArray(input)) return [];

  return input.slice(0, MAX_DICE_LIMIT).map((raw): DiceData => {
    const d = (raw && typeof raw === 'object' ? raw : {}) as Partial<DiceData>;

    const faces = Math.min(Math.max(Math.trunc(Number(d.faces) || 6), MIN_FACES), MAX_FACES);

    const customFaces = Array.isArray(d.customFaces)
      ? d.customFaces
          .slice(0, MAX_CUSTOM_FACES)
          .filter((f): f is string => typeof f === 'string')
          .map(f => {
            // Trim the face text but keep its picture, colour and Counts as parts intact
            const m = f.match(FACE_SUFFIX_RE);
            const suffix = m ? m[0] : '';
            const base = f.slice(0, f.length - suffix.length);
            return base.slice(0, MAX_FACE_TEXT_LENGTH) + suffix;
          })
      : [];

    const numberValue = Number.isFinite(Number(d.numberValue)) ? Number(d.numberValue) : 1;

    const rawIndex = Math.trunc(Number(d.currentFaceIndex));
    const faceCount = customFaces.length || faces;
    const currentFaceIndex = Number.isFinite(rawIndex) && rawIndex >= 0 && rawIndex < faceCount ? rawIndex : 0;

    return {
      id: generateId(),
      numberValue,
      faces,
      currentFaceIndex,
      name: typeof d.name === 'string' ? d.name.slice(0, MAX_NAME_LENGTH) : '',
      customFaces,
      color: isSafeColor(d.color) ? d.color : '#E9EAEC',
      held: d.held === true,
    };
  });
}

/** Only hex literals and 'transparent' reach a style attribute. */
function isSafeColor(value: unknown): value is string {
  return typeof value === 'string' && (value === 'transparent' || /^#[0-9a-fA-F]{3,8}$/.test(value));
}

export const COLORS = [
  "#E9EAEC", // white
  "#C0C0C0", // gray
  "#000000", // black
  "#E32227", // red
  "#0000FF", // blue
  "#FBFB3C", // yellow
  "#228B22", // green
  "#B24BF3", // purple
  "#F28500", // orange
  "#FF69B4", // pink
  "#AA5518"  // brown
];

export interface GridDimensions {
  optimalSize: number;
  optimalColumns: number;
  dynamicGap: number;
}

/**
 * Calculates optimal dice size, columns, and gaps based on container dimensions
 * and the number of dice currently active.
 */
export function calculateGridDimensions(
  diceCount: number,
  containerWidth: number,
  containerHeight: number
): GridDimensions {
  let optimalSize = 0;
  let optimalColumns = 1;
  let dynamicGap = 0;
  const GAP_RATIO = 0.10; // 10% gap ratio

  if (diceCount > 0 && containerWidth > 0 && containerHeight > 0) {
    let maxDieSize = 0;
    const safeWidth = Math.max(0, containerWidth - 36);
    const safeHeight = Math.max(0, containerHeight - 36);

    for (let c = 1; c <= diceCount; c++) {
      const r = Math.ceil(diceCount / c);
      const sizeW = safeWidth / (c + GAP_RATIO * (c - 1));
      const sizeH = safeHeight / (r + GAP_RATIO * (r - 1));
      const size = Math.min(sizeW, sizeH);

      if (size > maxDieSize) {
        maxDieSize = size;
        optimalColumns = c;
      }
    }

    optimalSize = Math.floor(Math.min(maxDieSize, 480));
    dynamicGap = Math.floor(optimalSize * GAP_RATIO);
  }

  return { optimalSize, optimalColumns, dynamicGap };
}

export const DICE_SCALE_MIN = 0.6;
export const DICE_SCALE_MAX = 1.6;
export const DICE_SCALE_DEFAULT = 1;

/** Reads a stored or imported dice-size value, falling back to the default. */
export function sanitizeDiceScale(value: unknown): number {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return DICE_SCALE_DEFAULT;
  return Math.min(DICE_SCALE_MAX, Math.max(DICE_SCALE_MIN, n));
}

/**
 * Applies the owner-set dice size on top of the fitted layout. At 1 the fitted
 * layout is returned unchanged. Otherwise columns are re-fitted to the width, so
 * bigger dice wrap onto more rows (the dice area scrolls) and smaller dice can
 * sit more to a row. A die is never wider or taller than the visible area.
 */
export function scaleGridDimensions(
  base: GridDimensions,
  diceCount: number,
  containerWidth: number,
  containerHeight: number,
  scale: number
): GridDimensions {
  if (scale === DICE_SCALE_DEFAULT || base.optimalSize === 0) return base;
  const GAP_RATIO = 0.10;
  const safeWidth = Math.max(0, containerWidth - 36);
  const safeHeight = Math.max(0, containerHeight - 36);
  const size = Math.max(1, Math.floor(Math.min(base.optimalSize * scale, safeWidth, safeHeight, 480 * scale)));
  const fit = Math.floor((safeWidth + size * GAP_RATIO) / (size * (1 + GAP_RATIO)));
  const columns = Math.min(diceCount, Math.max(1, fit));
  return { optimalSize: size, optimalColumns: columns, dynamicGap: Math.floor(size * GAP_RATIO) };
}

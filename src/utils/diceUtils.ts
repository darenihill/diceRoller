export const FACE_BG_DELIMITER = ':bg:';
export const FACE_ICON_PREFIX = ':icon:';

export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export interface ParsedFace {
  content: string;
  bgColor: string;
}

export function parseFaceContent(faceStr: string, defaultBg: string = 'transparent'): ParsedFace {
  if (!faceStr) {
    return { content: '', bgColor: defaultBg };
  }
  const parts = faceStr.split(FACE_BG_DELIMITER);
  return {
    content: parts[0],
    bgColor: parts[1] || defaultBg
  };
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
    const safeWidth = Math.max(0, containerWidth - 24);
    const safeHeight = Math.max(0, containerHeight - 24);

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

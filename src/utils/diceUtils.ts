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

/** Returns true if the hex color is perceptually light. */
export function isLightColor(hex: string): boolean {
  return getColorBrightness(hex) > 186;
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

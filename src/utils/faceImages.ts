import { SAVED } from './savedValues';
import { readItem } from './safeStorage';
import { useSyncExternalStore } from 'react';
import { generateId } from './diceUtils';

/**
 * Pictures on dice faces. A face names its picture by a short id (':img:<id>');
 * the picture itself, shrunk to a small square, is kept here in local storage.
 * Share links never carry pictures (roadmap decision, 2026-08-17), backups do.
 */
const STORAGE_KEY = SAVED.faceImages;
/** Pictures are stored as this many pixels square. */
export const FACE_IMAGE_SIZE = 128;
/** Longest stored picture we accept, as a data URL (a 128px JPEG is usually 4-12 KB). */
export const MAX_FACE_IMAGE_CHARS = 60_000;
/** Most pictures kept at once, so local storage never fills up with them. */
export const MAX_FACE_IMAGES = 200;

const DATA_URL_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const ID_RE = /^[a-z0-9]{1,16}$/;

export type FaceImageMap = Record<string, string>;

/** Keeps only well-formed pictures: safe ids, small image data URLs, capped in number. */
export function sanitizeFaceImages(input: unknown): FaceImageMap {
  const out: FaceImageMap = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const [id, url] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_FACE_IMAGES) break;
    if (ID_RE.test(id) && typeof url === 'string' && url.length <= MAX_FACE_IMAGE_CHARS && DATA_URL_RE.test(url)) {
      out[id] = url;
    }
  }
  return out;
}

let cache: FaceImageMap | null = null;
const listeners = new Set<() => void>();

function read(): FaceImageMap {
  if (cache) return cache;
  try {
    cache = sanitizeFaceImages(JSON.parse(readItem(STORAGE_KEY) || '{}'));
  } catch {
    cache = {};
  }
  return cache;
}

/** Writes the pictures; returns false when the browser refuses (storage full). */
function write(next: FaceImageMap): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  cache = next;
  listeners.forEach(l => l());
  return true;
}

export function getFaceImages(): FaceImageMap {
  return read();
}

const IMAGE_REF_RE = /:img:([a-z0-9]{1,16})/g;

/**
 * Picture ids that some face still names: in the given dice (the ones on
 * screen) or in anything kept in local storage (saved games, the default set,
 * the autosave). Pictures nothing names can be let go.
 */
export function faceImagesInUse(extra: { customFaces: string[] }[] = []): Set<string> {
  const ids = new Set<string>();
  const scan = (text: string | null) => {
    if (!text) return;
    for (const m of text.matchAll(IMAGE_REF_RE)) ids.add(m[1]);
  };
  scan(readItem(SAVED.games));
  scan(readItem(SAVED.defaultSet));
  for (const d of extra) d.customFaces.forEach(scan);
  return ids;
}

/** Only the pictures some face still names. */
export function usedFaceImages(extra: { customFaces: string[] }[] = []): FaceImageMap {
  const inUse = faceImagesInUse(extra);
  return Object.fromEntries(Object.entries(read()).filter(([id]) => inUse.has(id)));
}

/**
 * Adds a picture and returns its id, or null when it can't be kept. Pictures
 * no face names any more (removed, replaced) are let go first, so the cap
 * only counts pictures in use. `onScreen` is the dice currently shown.
 */
export function addFaceImage(dataUrl: string, onScreen: { customFaces: string[] }[] = []): string | null {
  if (!sanitizeFaceImages({ x: dataUrl }).x) return null;
  const kept = usedFaceImages(onScreen);
  if (Object.keys(kept).length >= MAX_FACE_IMAGES) return null;
  const id = generateId();
  return write({ ...kept, [id]: dataUrl }) ? id : null;
}

/**
 * Merges pictures from a backup. The backup's pictures come first, so none of
 * them is dropped for the cap ahead of a picture already here. Returns false
 * when any picture couldn't be kept.
 */
export function importFaceImages(input: unknown): boolean {
  const incoming = sanitizeFaceImages(input);
  const current = read();
  const merged = sanitizeFaceImages({ ...incoming, ...Object.fromEntries(Object.entries(current).filter(([id]) => !(id in incoming))) });
  const allKept = Object.keys(merged).length === Object.keys({ ...current, ...incoming }).length;
  return write(merged) && allKept;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** All pictures, kept current as pictures are added. */
export function useFaceImages(): FaceImageMap {
  return useSyncExternalStore(subscribe, read, read);
}

/** The picture for an id, kept current as pictures are added. */
export function useFaceImage(id: string | undefined): string | undefined {
  const images = useFaceImages();
  return id ? images[id] : undefined;
}

/** For tests: forget what was read from storage. */
export function resetFaceImageCache() {
  cache = null;
}

/**
 * Shrinks a chosen picture to a small square (cropped to the middle) and
 * returns it as a JPEG data URL, or a PNG one when it has see-through parts.
 */
export function shrinkImage(file: Blob, size = FACE_IMAGE_SIZE): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      if (!side) { reject(new Error('empty image')); return; }
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no canvas')); return; }
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      const pixels = ctx.getImageData(0, 0, size, size).data;
      let seeThrough = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 250) { seeThrough = true; break; }
      }
      let out = seeThrough ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85);
      if (out.length > MAX_FACE_IMAGE_CHARS) out = canvas.toDataURL('image/jpeg', 0.7);
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('not an image')); };
    img.src = url;
  });
}

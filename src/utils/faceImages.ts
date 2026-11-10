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

/** Pictures an Undo bar can still put back, with when that offer ends */
const heldForUndo = new Map<string, number>();

/** Keeps a removed picture while its Undo is offered, so adding another can't let it go */
export function holdFaceImageForUndo(id: string, ms = 60_000) {
  heldForUndo.set(id, Date.now() + ms);
}

/** Ends every hold: called once no Undo bar is up, so none can put a picture back */
export function releaseFaceImageHolds() {
  heldForUndo.clear();
}

function dropEndedHolds() {
  const now = Date.now();
  for (const [id, until] of heldForUndo) if (until <= now) heldForUndo.delete(id);
}


/**
 * Picture ids that some face still names: in the given dice (the ones on
 * screen) or in anything kept in local storage. Every saved value is read,
 * not a list of them, so saved games, the autosave (systemAutosave), the
 * default dice and History rows all count, and a new place that keeps faces
 * can't be missed. Returns null when storage can't be read, so nothing is let
 * go on a guess.
 */
function scanInUse(extra: { customFaces: string[] }[], skipAutosave = false): Set<string> | null {
  const ids = new Set<string>();
  const scan = (text: string | null) => {
    if (!text) return;
    for (const m of text.matchAll(IMAGE_REF_RE)) ids.add(m[1]);
  };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key === null) return null;
      if (key === STORAGE_KEY) continue;
      const text = localStorage.getItem(key);
      if (skipAutosave && key === SAVED.games) scan(withoutAutosave(text));
      else scan(text);
    }
  } catch {
    return null;
  }
  for (const d of extra) d.customFaces.forEach(scan);
  for (const id of heldForUndo.keys()) ids.add(id);
  return ids;
}

/** Saved games without the autosave; the whole text when it can't be read, so nothing is missed */
function withoutAutosave(text: string | null): string | null {
  if (!text) return text;
  try {
    const games = JSON.parse(text);
    if (!games || typeof games !== 'object' || Array.isArray(games)) return text;
    const rest = { ...games };
    delete rest.systemAutosave;
    return JSON.stringify(rest);
  } catch {
    return text;
  }
}

/** Picture ids that some face still names (see scanInUse); everything, when storage can't be read. */
export function faceImagesInUse(extra: { customFaces: string[] }[] = []): Set<string> {
  return scanInUse(extra) ?? new Set(Object.keys(read()));
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
  dropEndedHolds();
  const kept = usedFaceImages(onScreen);
  if (Object.keys(kept).length >= MAX_FACE_IMAGES) return null;
  const id = generateId();
  return write({ ...kept, [id]: dataUrl }) ? id : null;
}

/**
 * Lets go of pictures no face names any more, so a picture on a removed die
 * or face is really gone from the device. Runs when the app starts and once
 * no Undo bar is up (App.tsx). Keeps every picture named on screen, in any
 * saved value or held for an Undo; when storage can't be read it keeps all.
 * The autosave is only written when the page is hidden, so during a visit
 * it can name dice that are long gone: `onScreenIsCurrent` says the dice on
 * screen stand in for it. Left out (at start), the autosave counts too.
 * Returns how many pictures were let go.
 */
export function pruneFaceImages(onScreen: { customFaces: string[] }[] = [], onScreenIsCurrent = false): number {
  // Read afresh, so a picture another tab just added is seen
  cache = null;
  const all = read();
  if (Object.keys(all).length === 0) return 0;
  dropEndedHolds();
  const inUse = scanInUse(onScreen, onScreenIsCurrent);
  if (!inUse) return 0;
  const kept = Object.fromEntries(Object.entries(all).filter(([id]) => inUse.has(id)));
  const gone = Object.keys(all).length - Object.keys(kept).length;
  if (gone === 0) return 0;
  return write(kept) ? gone : 0;
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

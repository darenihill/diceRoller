type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Saves one value on this device. When the browser refuses (storage full,
 * or storage turned off), the app keeps running and the storage-full message
 * is told, instead of the save failing silently or blanking the screen.
 * Returns whether the value was saved.
 */
export function saveItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error(`Could not save ${key}`, e);
    listeners.forEach(l => l());
    return false;
  }
}

/** Calls back whenever a save is refused; returns the way to stop listening. */
export function onSaveRefused(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/**
 * Reads one saved value. A browser that blocks storage throws on any access;
 * this returns null instead, so the app opens with its defaults rather than a
 * blank screen.
 */
export function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error(`Could not read ${key}`, e);
    return null;
  }
}

/** Removes one saved value; a blocked browser is ignored. */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error(`Could not remove ${key}`, e);
  }
}

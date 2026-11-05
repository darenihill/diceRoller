import type { DiceData } from '../types';

/** The 3D tray has models for these dice; any other die stays flat */
export const TRAY_SIDES = [4, 6, 8, 10, 12, 20];

/** Plain numbered dice roll in the tray. Custom text, picture or symbol faces stay flat. */
export function canRoll3D(die: DiceData): boolean {
  return TRAY_SIDES.includes(die.faces) && die.customFaces.length === 0;
}

/** What one die landed on in the tray, by the app's die id */
export type TrayResults = Record<string, number>;

interface TrayRoll { groupId: number; value: number }
interface DiceBoxLike {
  init(): Promise<unknown>;
  roll(notation: { sides: number; qty: number; themeColor: string }[]): Promise<TrayRoll[]>;
  clear(): unknown;
  resizeWorld(): void;
}

// One tray for the whole visit: the library and its physics load the first
// time 3D Dice is used, never before
let trayPromise: Promise<DiceBoxLike> | null = null;

/** Where the copied dice-box files are served (vite.config.ts copies them to /assets) */
function assetPath(): string {
  return new URL(`${import.meta.env.BASE_URL}assets/`, window.location.href).pathname;
}

/** Loads the 3D library into the tray element once, the first time it is needed */
export function loadTray(selector: string): Promise<DiceBoxLike> {
  if (!trayPromise) {
    // Without WebGL the library quietly rolls invisible dice, so stop here and roll flat
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') ?? probe.getContext('webgl'))) return Promise.reject(new Error('no WebGL'));
    trayPromise = import('@3d-dice/dice-box')
      .then(async ({ default: DiceBox }) => {
        const box = new DiceBox({
          container: selector,
          assetPath: assetPath(),
          theme: 'default',
          scale: 6,
          // The plain onscreen canvas; the offscreen one needs newer browsers
          offscreen: false,
        }) as unknown as DiceBoxLike;
        await box.init();
        return box;
      })
      .catch(err => {
        trayPromise = null;
        throw err;
      });
  }
  return trayPromise;
}

/** Rolls the dice in the tray and gives back what each one landed on */
export async function rollInTray(selector: string, dice: DiceData[]): Promise<TrayResults> {
  const box = await loadTray(selector);
  box.resizeWorld();
  const rolls = await box.roll(dice.map(d => ({ sides: d.faces, qty: 1, themeColor: d.color })));
  const results: TrayResults = {};
  for (const r of rolls) {
    const die = dice[r.groupId];
    // A d10 shows 0 on one face; the app counts that face as 10
    if (die) results[die.id] = r.value === 0 && die.faces === 10 ? 10 : r.value;
  }
  return results;
}

/** Empties the tray between rolls */
export function clearTray(): void {
  void trayPromise?.then(box => box.clear()).catch(() => undefined);
}

/** For tests: forget the loaded tray */
export function resetTrayForTests(): void {
  trayPromise = null;
}

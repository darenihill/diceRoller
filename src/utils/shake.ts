/** Shake to roll: a small detector plus the iPhone motion permission. */

export interface MotionSample {
  x: number;
  y: number;
  z: number;
  /** True when the reading includes gravity (about 9.8 m/s² when still). */
  includesGravity: boolean;
  /** Time in milliseconds. */
  t: number;
}

const GRAVITY = 9.81;
export const SHAKE_THRESHOLD = 15; // m/s² beyond still, a firm shake rather than a step or a tilt
export const SHAKE_COOLDOWN_MS = 1200; // one roll per shake, not one per jolt

/** Returns a function that says true once per shake. */
export function createShakeDetector(threshold = SHAKE_THRESHOLD, cooldownMs = SHAKE_COOLDOWN_MS) {
  let lastShake = -Infinity;
  return (s: MotionSample): boolean => {
    const magnitude = Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z);
    const force = s.includesGravity ? Math.abs(magnitude - GRAVITY) : magnitude;
    if (force < threshold || s.t - lastShake < cooldownMs) return false;
    lastShake = s.t;
    return true;
  };
}

/** Reads a devicemotion event, preferring the reading without gravity. */
export function sampleFromEvent(e: DeviceMotionEvent): MotionSample | null {
  const a = e.acceleration;
  if (a && a.x != null && a.y != null && a.z != null) {
    return { x: a.x, y: a.y, z: a.z, includesGravity: false, t: e.timeStamp };
  }
  const g = e.accelerationIncludingGravity;
  if (g && g.x != null && g.y != null && g.z != null) {
    return { x: g.x, y: g.y, z: g.z, includesGravity: true, t: e.timeStamp };
  }
  return null;
}

type MotionWithPermission = typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

/**
 * Asks for motion access where the browser needs it (iPhone Safari), and must run
 * from a tap. Resolves 'granted', 'denied' or 'unsupported'.
 */
export async function requestMotionPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof window === 'undefined' || typeof window.DeviceMotionEvent === 'undefined') return 'unsupported';
  const DME = window.DeviceMotionEvent as MotionWithPermission;
  if (typeof DME.requestPermission !== 'function') return 'granted';
  try {
    return (await DME.requestPermission()) === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

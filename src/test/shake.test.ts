import { describe, it, expect, vi, afterEach } from 'vitest';
import { createShakeDetector, requestMotionPermission, SHAKE_COOLDOWN_MS } from '../utils/shake';

const at = (t: number, x: number, includesGravity = false) => ({ x, y: 0, z: 0, includesGravity, t });

describe('shake detector', () => {
  it('ignores small movement and a phone lying still', () => {
    const isShake = createShakeDetector();
    expect(isShake(at(0, 3))).toBe(false);
    expect(isShake({ x: 0, y: 0, z: 9.81, includesGravity: true, t: 10 })).toBe(false);
  });

  it('says true once for a firm shake, then waits out the cooldown', () => {
    const isShake = createShakeDetector();
    expect(isShake(at(0, 25))).toBe(true);
    expect(isShake(at(100, 25))).toBe(false);
    expect(isShake(at(SHAKE_COOLDOWN_MS + 1, 25))).toBe(true);
  });

  it('takes gravity out of readings that include it', () => {
    const isShake = createShakeDetector();
    expect(isShake({ x: 0, y: 0, z: 30, includesGravity: true, t: 0 })).toBe(true);
  });
});

describe('motion permission', () => {
  const original = (window as unknown as { DeviceMotionEvent?: unknown }).DeviceMotionEvent;
  afterEach(() => {
    (window as unknown as { DeviceMotionEvent?: unknown }).DeviceMotionEvent = original;
  });

  it('asks on iPhone-style browsers and passes on the answer', async () => {
    const requestPermission = vi.fn().mockResolvedValue('denied');
    (window as unknown as { DeviceMotionEvent: unknown }).DeviceMotionEvent = Object.assign(function () {}, { requestPermission });
    expect(await requestMotionPermission()).toBe('denied');
    expect(requestPermission).toHaveBeenCalledOnce();
  });

  it('needs no prompt where the browser has none', async () => {
    (window as unknown as { DeviceMotionEvent: unknown }).DeviceMotionEvent = function () {};
    expect(await requestMotionPermission()).toBe('granted');
  });

  it('reports unsupported when there is no motion sensor API', async () => {
    delete (window as unknown as { DeviceMotionEvent?: unknown }).DeviceMotionEvent;
    expect(await requestMotionPermission()).toBe('unsupported');
  });
});

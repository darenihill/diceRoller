import { describe, it, expect } from 'vitest';
import { getContrastColor, parseFaceContent, FACE_ICON_PREFIX, sanitizeDiceList } from '../utils/diceUtils';
import { MAX_DICE_LIMIT, MAX_FACES, MAX_CUSTOM_FACES } from '../utils/constants';

describe('diceUtils (Utility & Contrast Regression Tests)', () => {
  it('should return dark text for light background colors', () => {
    expect(getContrastColor('#FFFFFF')).toBe('#000000');
    expect(getContrastColor('#E9EAEC')).toBe('#000000');
    expect(getContrastColor('#FFD700')).toBe('#000000');
  });

  it('should return light text for dark background colors', () => {
    expect(getContrastColor('#000000')).toBe('#FFFFFF');
    expect(getContrastColor('#1A1A1A')).toBe('#FFFFFF');
    expect(getContrastColor('#384050')).toBe('#FFFFFF');
    expect(getContrastColor('#0056D2')).toBe('#FFFFFF');
  });

  it('should parse standard text face content', () => {
    const result = parseFaceContent('20');
    expect(result.content).toBe('20');
    expect(result.bgColor).toBe('transparent');
  });

  it('should parse custom background color modifier in face strings', () => {
    const result = parseFaceContent('Skull:bg:#D32F2F', '#FFFFFF');
    expect(result.content).toBe('Skull');
    expect(result.bgColor).toBe('#D32F2F');
  });

  it('should parse icon prefixes correctly', () => {
    const result = parseFaceContent(':icon:Heart:bg:#2E7D32', '#FFFFFF');
    expect(result.content.startsWith(FACE_ICON_PREFIX)).toBe(true);
    expect(result.content.replace(FACE_ICON_PREFIX, '')).toBe('Heart');
    expect(result.bgColor).toBe('#2E7D32');
  });
});

describe('sanitizeDiceList (Untrusted Payload Hardening)', () => {
  it('rejects non-array input', () => {
    expect(sanitizeDiceList(null)).toEqual([]);
    expect(sanitizeDiceList('nope')).toEqual([]);
    expect(sanitizeDiceList({ faces: 6 })).toEqual([]);
    expect(sanitizeDiceList(undefined)).toEqual([]);
  });

  it('caps an oversized share payload at MAX_DICE_LIMIT', () => {
    const huge = Array.from({ length: 5000 }, () => ({ faces: 6, customFaces: [], color: '#E9EAEC' }));
    expect(sanitizeDiceList(huge).length).toBe(MAX_DICE_LIMIT);
  });

  it('clamps absurd or non-numeric face counts', () => {
    const out = sanitizeDiceList([
      { faces: 10_000_000 },
      { faces: -3 },
      { faces: 'abc' },
      { faces: 20 },
    ]);
    expect(out[0].faces).toBe(MAX_FACES);
    expect(out[1].faces).toBeGreaterThan(0);
    expect(out[2].faces).toBe(6); // fallback default
    expect(out[3].faces).toBe(20);
  });

  it('rejects colors that are not hex literals', () => {
    const out = sanitizeDiceList([
      { color: 'url(https://example.com/track.png)' },
      { color: 'red; background: url(x)' },
      { color: '#D32F2F' },
      { color: 'transparent' },
    ]);
    expect(out[0].color).toBe('#E9EAEC');
    expect(out[1].color).toBe('#E9EAEC');
    expect(out[2].color).toBe('#D32F2F');
    expect(out[3].color).toBe('transparent');
  });

  it('caps custom face count and drops non-string faces', () => {
    const out = sanitizeDiceList([
      { customFaces: Array.from({ length: 900 }, (_, i) => String(i)) },
      { customFaces: ['ok', 42, null, { a: 1 }, 'fine'] },
    ]);
    expect(out[0].customFaces.length).toBe(MAX_CUSTOM_FACES);
    expect(out[1].customFaces).toEqual(['ok', 'fine']);
  });

  it('keeps currentFaceIndex inside the real face range', () => {
    const out = sanitizeDiceList([
      { faces: 6, currentFaceIndex: 99 },
      { faces: 6, currentFaceIndex: -1 },
      { customFaces: ['a', 'b'], currentFaceIndex: 1 },
    ]);
    expect(out[0].currentFaceIndex).toBe(0);
    expect(out[1].currentFaceIndex).toBe(0);
    expect(out[2].currentFaceIndex).toBe(1);
  });

  it('always assigns fresh ids and a boolean held flag', () => {
    const out = sanitizeDiceList([{ id: 'same', held: 'yes' }, { id: 'same', held: true }]);
    expect(out[0].id).not.toBe(out[1].id);
    expect(out[0].held).toBe(false);
    expect(out[1].held).toBe(true);
  });

  it('preserves a legitimate preset unchanged in substance', () => {
    const out = sanitizeDiceList([
      { numberValue: 1, faces: 20, currentFaceIndex: 0, name: 'd20', customFaces: [], color: '#384050', held: false },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ faces: 20, name: 'd20', color: '#384050', held: false });
  });
});

import { describe, it, expect } from 'vitest';
import { getContrastColor, parseFaceContent, FACE_ICON_PREFIX } from '../utils/diceUtils';

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

import { describe, it, expect } from 'vitest';
import { parseFaceContent, buildFace, faceNumericValue, sanitizeDiceList } from '../utils/diceUtils';

describe('faces that count as a number', () => {
  it('reads old faces exactly as before', () => {
    expect(parseFaceContent('Star')).toEqual({ content: 'Star', bgColor: 'transparent' });
    expect(parseFaceContent(':icon:Star:bg:#FFD700')).toEqual({ content: ':icon:Star', bgColor: '#FFD700' });
    expect(faceNumericValue(':icon:Star:bg:#FFD700')).toBe(0);
    expect(faceNumericValue('Gold')).toBe(0);
    expect(faceNumericValue('5:bg:#E32227')).toBe(5);
  });

  it('reads a Counts as number with or without a colour', () => {
    expect(parseFaceContent(':icon:Star:bg:#FFD700:val:6')).toEqual({ content: ':icon:Star', bgColor: '#FFD700', value: 6 });
    expect(faceNumericValue(':icon:Star:val:6')).toBe(6);
    expect(faceNumericValue('Miss:val:-1')).toBe(-1);
    expect(faceNumericValue('5:val:10')).toBe(10);
  });

  it('builds faces, leaving out unset parts', () => {
    expect(buildFace('Star')).toBe('Star');
    expect(buildFace('Star', 'transparent', 6)).toBe('Star:val:6');
    expect(buildFace(':icon:Star', '#FFD700', 6)).toBe(':icon:Star:bg:#FFD700:val:6');
    expect(buildFace(':icon:Star', '#FFD700')).toBe(':icon:Star:bg:#FFD700');
  });

  it('keeps the Counts as number when a long face is trimmed for a share link or backup', () => {
    const long = 'x'.repeat(70) + ':val:6';
    const [die] = sanitizeDiceList([{ faces: 2, customFaces: [long, 'Plain'] }]);
    expect(die.customFaces[0]).toBe('x'.repeat(60) + ':val:6');
    expect(faceNumericValue(die.customFaces[0])).toBe(6);
  });
});

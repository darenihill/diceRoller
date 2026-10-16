import { describe, it, expect } from 'vitest';
import { parseFaceContent, buildFace, faceNumericValue, sanitizeDiceList, withoutFaceImages } from '../utils/diceUtils';
import { sanitizeFaceImages, addFaceImage, importFaceImages, getFaceImages, usedFaceImages, resetFaceImageCache, MAX_FACE_IMAGE_CHARS, MAX_FACE_IMAGES } from '../utils/faceImages';

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

describe('pictures on faces', () => {
  it('reads and builds a picture marker beside colour and Counts as', () => {
    expect(parseFaceContent('3:img:k2x9a1:bg:#FFD700:val:6')).toEqual({ content: '3', bgColor: '#FFD700', value: 6, image: 'k2x9a1' });
    expect(parseFaceContent('3:img:k2x9a1')).toEqual({ content: '3', bgColor: 'transparent', image: 'k2x9a1' });
    expect(buildFace('3', '#FFD700', 6, 'k2x9a1')).toBe('3:img:k2x9a1:bg:#FFD700:val:6');
    expect(buildFace('3', undefined, undefined, 'BAD ID')).toBe('3');
    expect(faceNumericValue('3:img:k2x9a1')).toBe(3);
    expect(faceNumericValue(':icon:Star:img:k2x9a1:val:6')).toBe(6);
  });

  it('leaves pictures out of share links, keeping text, colour and number', () => {
    const dice = sanitizeDiceList([{ faces: 2, customFaces: ['3:img:k2x9a1:bg:#FFD700:val:6', 'Plain'] }]);
    const [shared] = withoutFaceImages(dice);
    expect(shared.customFaces).toEqual(['3:bg:#FFD700:val:6', 'Plain']);
    expect(dice[0].customFaces[0]).toBe('3:img:k2x9a1:bg:#FFD700:val:6');
  });

  it('keeps the picture marker when a long face is trimmed', () => {
    const [die] = sanitizeDiceList([{ faces: 1, customFaces: ['x'.repeat(70) + ':img:abc123:val:6'] }]);
    expect(die.customFaces[0]).toBe('x'.repeat(60) + ':img:abc123:val:6');
  });

  it('keeps only small, well-formed pictures from a backup', () => {
    const ok = 'data:image/jpeg;base64,AAAA';
    const out = sanitizeFaceImages({
      abc123: ok,
      'bad id': ok,
      svg: 'data:image/svg+xml;base64,AAAA',
      js: 'javascript:alert(1)',
      big: 'data:image/png;base64,' + 'A'.repeat(MAX_FACE_IMAGE_CHARS),
    });
    expect(out).toEqual({ abc123: ok });
    expect(sanitizeFaceImages(null)).toEqual({});
    expect(sanitizeFaceImages(['x'])).toEqual({});
  });

  it('stores pictures and merges a backup into them', () => {
    localStorage.removeItem('diceFaceImages');
    resetFaceImageCache();
    const id = addFaceImage('data:image/png;base64,AAAA');
    expect(id).toMatch(/^[a-z0-9]{1,16}$/);
    expect(importFaceImages({ other1: 'data:image/webp;base64,BBBB' })).toBe(true);
    resetFaceImageCache();
    expect(getFaceImages()).toEqual({ [id as string]: 'data:image/png;base64,AAAA', other1: 'data:image/webp;base64,BBBB' });
    expect(addFaceImage('not a picture')).toBeNull();
  });
});

describe('letting go of pictures nothing uses', () => {
  it('drops pictures no face names when a new one is added, keeping ones in use', () => {
    localStorage.clear();
    resetFaceImageCache();
    const a = addFaceImage('data:image/png;base64,AAAA') as string;
    const b = addFaceImage('data:image/png;base64,BBBB', [{ customFaces: [`1:img:${a}`] }]) as string;
    localStorage.setItem('defaultDiceSet', JSON.stringify([{ customFaces: [`2:img:${b}`] }]));
    addFaceImage('data:image/png;base64,CCCC', []);
    // a is named by nothing now; b is in the default set
    expect(Object.keys(getFaceImages())).not.toContain(a);
    expect(Object.keys(getFaceImages())).toContain(b);
    expect(Object.keys(usedFaceImages([]))).toEqual([b]);
  });

  it("puts a backup's pictures first and says when some didn't fit", () => {
    localStorage.clear();
    resetFaceImageCache();
    const many = Object.fromEntries(Array.from({ length: MAX_FACE_IMAGES }, (_, i) => [`b${i}`, 'data:image/png;base64,AAAA']));
    expect(importFaceImages({ old1: 'data:image/png;base64,ZZZZ' })).toBe(true);
    expect(importFaceImages(many)).toBe(false);
    resetFaceImageCache();
    const kept = getFaceImages();
    expect(Object.keys(kept)).toHaveLength(MAX_FACE_IMAGES);
    expect(kept.old1).toBeUndefined();
  });
});

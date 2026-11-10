import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

// Tap targets, 2026-11-10 (reviews/2026-11-10-tap-targets.md). The hub's
// standard is 48px for anything you tap (standards 9 and 20). Inside the
// dialogs Save's Cancel and Save were 36px, Clear History 32px, Die
// settings' Remove, Copy, Done and Add 40px, and the text boxes, steppers
// and Color / Icons / Text 40-44px. Owner, on the Desk card: "This
// shouldn't be a card if it's matching a standard".

const strip = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '');

/** The declarations of every rule whose selector list includes `selector` exactly */
const rule = (source: string, selector: string) => {
  const css = strip(source);
  return [...css.matchAll(/(^|\n|\})([^{}]+)\{([^}]*)\}/g)]
    .filter(m => m[2].split(',').map(s => s.trim().replace(/\s+/g, ' ')).includes(selector))
    .map(m => m[3])
    .join('\n');
};

/** px value of a property in a rule, or null */
const px = (decls: string, prop: string) => {
  const m = decls.match(new RegExp(`(^|[;\\s])${prop}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`));
  return m ? Number(m[2]) : null;
};

const index = readFileSync('src/index.css', 'utf8');
const modals = readFileSync('src/components/modals/Modals.module.css', 'utf8');
const dieSettings = readFileSync('src/components/DiceSettingsModal.module.css', 'utf8');
const colorPicker = readFileSync('src/components/ColorPicker.module.css', 'utf8');

describe('dialog buttons are 48px tall', () => {
  it('one shared rule makes every button in a dialog at least 48px tall', () => {
    expect(px(rule(index, "[role='dialog'] .md-button"), 'min-height')).toBeGreaterThanOrEqual(48);
  });

  it('the compact button no longer fixes its height (Clear History, Reset size, Add a picture)', () => {
    const compact = rule(index, '.md-button-compact');
    expect(px(compact, 'height')).toBeNull();
    expect(px(compact, 'max-height')).toBeNull();
  });

  it('a button with its own height in a dialog is 48px (Die settings Add)', () => {
    expect(px(rule(dieSettings, '.addFaceBtn'), 'height')).toBeGreaterThanOrEqual(48);
  });
});

describe('other dialog controls are 48px', () => {
  const tall: [string, string, string, string][] = [
    ['Save, Share and Customize text boxes', modals, '.formInput', 'min-height'],
    ['Customize dice size slider', modals, '.slider', 'min-height'],
    ['Customize dice size row', modals, '.sliderRow', 'min-height'],
    ['History game chips', modals, '.gameChip', 'min-height'],
    ['Die settings text boxes', dieSettings, '.inputField', 'height'],
    ['Die settings name box', dieSettings, '.nameField .inputField', 'height'],
    ['Die settings faces box', dieSettings, '.stepperInput', 'height'],
    ['Die settings − and +', dieSettings, '.stepperBtn', 'height'],
    ['Die settings − and + width', dieSettings, '.stepperBtn', 'width'],
    ['Custom Faces grip', dieSettings, '.faceGrip', 'min-height'],
    ['Custom Faces face tile', dieSettings, '.faceTile', 'min-height'],
    ['Custom Faces face tile width', dieSettings, '.faceTile', 'min-width'],
    ['Custom Faces Color / Icons / Text', dieSettings, '.panelBtn', 'min-height'],
    ['Custom Faces Undo', dieSettings, '.listUndo', 'min-height'],
    ['Die color "same as" button', colorPicker, '.same', 'min-height'],
  ];
  for (const [what, source, selector, prop] of tall) {
    it(`${what} (${selector} ${prop}) is at least 48px`, () => {
      expect(px(rule(source, selector), prop)).toBeGreaterThanOrEqual(48);
    });
  }

  it('no dialog stylesheet sets a button-like control under 48px tall, except the face row\'s small ones', () => {
    // The face row's number box, picture and remove buttons stay small to fit
    // beside the tile; their taps come from a 48px-tall area (next test)
    const allowed = new Set(['.faceValueInput', '.facePictureBtn', '.faceThumb', '.faceKeyDot', '.freqBarContainer', '.freqFairKey']);
    const offenders: string[] = [];
    for (const [name, source] of [['Modals', modals], ['DiceSettingsModal', dieSettings]] as const) {
      for (const m of strip(source).matchAll(/(^|\n|\})([^{}]+)\{([^}]*)\}/g)) {
        const selector = m[2].trim();
        if (!/Btn|Button|button|Chip|Input|input|Field|Tile|Grip|Undo|tab\b/.test(selector)) continue;
        if ([...allowed].some(a => selector.includes(a))) continue;
        for (const prop of ['height', 'min-height']) {
          const v = px(m[3], prop);
          if (v !== null && v < 48) offenders.push(`${name} ${selector} ${prop}: ${v}px`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the face row\'s picture and remove buttons take taps from a 48px-tall area around them', () => {
    const both = rule(dieSettings, '.facePictureBtn::after');
    expect(both).toMatch(/content:\s*''/);
    expect(both).toMatch(/position:\s*absolute/);
    // 28px button + 10px above and below
    expect(both).toMatch(/inset:\s*-10px/);
    const remove = rule(dieSettings, '.faceRemoveBtn::after');
    // 22px button + 13px above and below
    expect(remove).toMatch(/top:\s*-13px/);
    expect(remove).toMatch(/bottom:\s*-13px/);
    expect(rule(dieSettings, '.faceRemoveBtn')).toMatch(/position:\s*relative/);
  });
});

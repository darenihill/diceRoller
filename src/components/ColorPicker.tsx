import React, { useId, useState } from 'react';
import { Ban, Check, Plus } from 'lucide-react';
import { COLORS, COLOR_NAMES, getContrastColor } from '../utils/diceUtils';
import styles from './ColorPicker.module.css';

/**
 * The one colour picker, used for a die's colour and for a face's colour
 * (owner, 2026-11-03). Twelve equal dots in two rows of six: the eleven
 * colours plus Custom, which opens sliders in place. The sliders look the same
 * on every phone, unlike the phone's own colour tool they replace.
 */
interface ColorPickerProps {
  /** A #RRGGBB colour, or 'transparent' for "Same as the die" */
  value: string;
  onChange: (color: string) => void;
  /** Spoken name of the group, e.g. "Die colour" */
  label: string;
  /** Shows a "Same as the die" chip in this colour (face colours only) */
  sameAs?: string;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

function hexToHsl(hex: string): { h: number; l: number } {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: Math.round((h * 60 + 360) % 360), l: Math.round(l * 100) };
}

/** Saturation is fixed at 85%: two sliders (colour, light/dark) are enough for a die */
function hslToHex(h: number, l: number): string {
  const s = 0.85, ll = l / 100;
  const a = s * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label, sameAs }) => {
  const id = useId();
  const isSame = value === 'transparent';
  const isPreset = COLORS.some(c => c.toUpperCase() === value.toUpperCase());
  const isCustom = !isSame && !isPreset && HEX.test(value);
  // Opens already showing the sliders when the colour is a custom one.
  // Give the picker a key per die or face so this starts fresh for each.
  const [showSliders, setShowSliders] = useState(isCustom);
  // A custom colour starts the sliders where it is; from a ready colour they
  // start at its hue but mid light, so the first slide isn't near white or black
  const start = isCustom ? hexToHsl(value) : { h: HEX.test(value) ? hexToHsl(value).h : 210, l: 50 };
  const [hue, setHue] = useState(start.h);
  const [light, setLight] = useState(start.l);
  const [draft, setDraft] = useState<string | null>(null);
  const preview = isSame && sameAs ? sameAs : HEX.test(value) ? value : hslToHex(hue, light);

  const pickPreset = (c: string) => { setShowSliders(false); onChange(c); };
  const slide = (h: number, l: number) => { setHue(h); setLight(l); onChange(hslToHex(h, l)); };

  return (
    <div className={styles.picker} role="group" aria-label={label}>
      {sameAs !== undefined && (
        <button
          type="button"
          className={styles.same}
          aria-pressed={isSame}
          onClick={() => { setShowSliders(false); onChange('transparent'); }}
        >
          <span className={styles.sameDot} style={{ backgroundColor: sameAs, color: getContrastColor(sameAs) }}>
            {isSame ? <Check size={14} strokeWidth={3} /> : <Ban size={14} strokeWidth={2.5} />}
          </span>
          Same as the die
        </button>
      )}
      <div className={styles.grid}>
        {COLORS.map(c => {
          const on = c.toUpperCase() === value.toUpperCase();
          return (
            <button
              key={c}
              type="button"
              className={styles.dot}
              style={{ backgroundColor: c, color: getContrastColor(c) }}
              onClick={() => pickPreset(c)}
              aria-label={COLOR_NAMES[c] ?? c}
              aria-pressed={on}
            >
              {on && <Check size={18} strokeWidth={3} aria-hidden="true" />}
            </button>
          );
        })}
        <button
          type="button"
          className={`${styles.dot} ${styles.custom}`}
          onClick={() => setShowSliders(o => !o)}
          aria-label="Custom colour"
          aria-pressed={isCustom}
          aria-expanded={showSliders}
          aria-controls={`${id}-custom`}
        >
          <span className={styles.customCentre}>
            {isCustom ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <Plus size={14} strokeWidth={3} aria-hidden="true" />}
          </span>
        </button>
      </div>
      {showSliders && (
        <div className={styles.sliders} id={`${id}-custom`}>
          <div className={styles.previewRow}>
            <span className={styles.preview} style={{ backgroundColor: preview }} aria-hidden="true" />
            <input
              className={styles.hex}
              aria-label="Colour code"
              value={draft ?? (HEX.test(value) ? value.toUpperCase() : hslToHex(hue, light))}
              maxLength={7}
              spellCheck={false}
              autoCapitalize="characters"
              onChange={e => {
                const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                setDraft(next);
                if (HEX.test(next)) {
                  const hsl = hexToHsl(next);
                  setHue(hsl.h); setLight(hsl.l);
                  onChange(next.toUpperCase());
                }
              }}
              onBlur={() => setDraft(null)}
            />
          </div>
          <label className={styles.sliderLabel}>
            Colour
            <input
              type="range" min={0} max={359} value={hue}
              className={`${styles.range} ${styles.hue}`}
              onChange={e => slide(Number(e.target.value), light)}
            />
          </label>
          <label className={styles.sliderLabel}>
            Light / dark
            <input
              type="range" min={8} max={92} value={light}
              className={styles.range}
              style={{ ['--track' as string]: `linear-gradient(90deg, #000, ${hslToHex(hue, 50)}, #fff)` }}
              onChange={e => slide(hue, Number(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import type { DiceData } from '../types';
import { Modal } from './Modal';
import { COLORS, COLOR_NAMES, FACE_ICON_PREFIX, parseFaceContent, buildFace, faceNumericValue, getContrastColor, colourEveryFace } from '../utils/diceUtils';
import { X, Plus, Minus, Star, Check, Copy, Trash2, Palette, ImagePlus, ImageOff, Rainbow, Ban } from 'lucide-react';
import { addFaceImage, useFaceImages, shrinkImage } from '../utils/faceImages';
import { ALL_ICONS, COMMON_ICONS } from '../utils/iconUtils';
import styles from './DiceSettingsModal.module.css';

/** Approximate rendered height of the colour popover, used to clamp its position. */
const POPOVER_HEIGHT = 170;

interface DiceSettingsModalProps {
  dice: DiceData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<DiceData>) => void;
  onRemove: (id: string) => void;
  onClone: (template: Partial<DiceData>) => void;
  /** Every die on screen, so pictures still in use are never let go */
  allDice: DiceData[];
}

export const DiceSettingsModal: React.FC<DiceSettingsModalProps> = ({ dice, isOpen, onClose, onUpdate, onRemove, onClone, allDice }) => {
  const [customInput, setCustomInput] = useState('');
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<{ type: 'base' | 'custom'; index?: number; top: number } | null>(null);
  /** The face the colour row paints: tap a face, then tap a colour */
  const [selectedFace, setSelectedFace] = useState(0);
  const activeFace = Math.min(selectedFace, Math.max(0, dice.customFaces.length - 1));
  const activeFaceColour = parseFaceContent(dice.customFaces[activeFace] ?? '').bgColor;
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Which face the next chosen picture goes on; 'new' adds a picture face */
  const pictureTarget = useRef<number | 'new'>('new');
  const [pictureError, setPictureError] = useState('');
  const images = useFaceImages();
  // The faces as they are now, for edits that finish after a picture is shrunk
  const latestDice = useRef(dice);
  useEffect(() => { latestDice.current = dice; }, [dice]);

  /**
   * Anchor the popover just below whichever swatch opened it. Previously the
   * offset was hardcoded (65px / 230px), so editing a face far down a long list
   * left the popover floating near the top of the modal.
   */
  const openPicker = (e: React.MouseEvent, picker: { type: 'base' | 'custom'; index?: number }) => {
    e.stopPropagation();
    const container = containerRef.current;
    const trigger = e.currentTarget as HTMLElement;
    let top = 65;
    if (container) {
      const cRect = container.getBoundingClientRect();
      const tRect = trigger.getBoundingClientRect();
      // Position relative to the scrolled container, clamped so it stays inside
      const raw = tRect.bottom - cRect.top + container.scrollTop + 8;
      top = Math.max(8, Math.min(raw, container.scrollHeight - POPOVER_HEIGHT));
    }
    setActiveColorPicker({ ...picker, top });
  };

  const setFaces = (num: number) => {
    if (num > 0) onUpdate(dice.id, { faces: num, customFaces: [] });
  };

  const addCustomFace = (face: string) => {
    if (!face.trim()) return;
    onUpdate(dice.id, { customFaces: [...dice.customFaces, face.trim()] });
    setCustomInput('');
  };

  const removeCustomFace = (index: number) => {
    const newFaces = [...dice.customFaces];
    newFaces.splice(index, 1);
    onUpdate(dice.id, { customFaces: newFaces });
  };

  const updateCustomFaceColor = (index: number, color: string) => {
    const newFaces = [...dice.customFaces];
    const faceStr = newFaces[index];
    const parsed = parseFaceContent(faceStr);
    newFaces[index] = buildFace(parsed.content, color, parsed.value, parsed.image);
    onUpdate(dice.id, { customFaces: newFaces });
  };

  /** Sets or clears the number a face counts as in totals; blank clears it */
  const updateCustomFaceValue = (index: number, raw: string) => {
    const newFaces = [...dice.customFaces];
    const parsed = parseFaceContent(newFaces[index], '');
    const n = parseInt(raw, 10);
    const value = raw.trim() === '' || isNaN(n) ? undefined : Math.max(-9999, Math.min(9999, n));
    newFaces[index] = buildFace(parsed.content, parsed.bgColor || undefined, value, parsed.image);
    onUpdate(dice.id, { customFaces: newFaces });
  };

  const choosePicture = (target: number | 'new') => {
    pictureTarget.current = target;
    setPictureError('');
    fileInputRef.current?.click();
  };

  /** Shrinks the chosen picture, keeps it on this device and puts it on the face */
  const handlePictureFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let id: string | null;
    try {
      id = addFaceImage(await shrinkImage(file), allDice);
    } catch {
      setPictureError("That file couldn't be read as a picture.");
      return;
    }
    if (!id) {
      setPictureError('This device has no room for more pictures.');
      return;
    }
    const target = pictureTarget.current;
    const current = latestDice.current;
    if (target === 'new') {
      // The face's number is what shows where the picture can't (a share link)
      const n = current.customFaces.length + 1;
      onUpdate(current.id, { customFaces: [...current.customFaces, buildFace(String(n), undefined, undefined, id)] });
    } else if (target < current.customFaces.length) {
      const newFaces = [...current.customFaces];
      const parsed = parseFaceContent(newFaces[target], '');
      newFaces[target] = buildFace(parsed.content, parsed.bgColor || undefined, parsed.value, id);
      onUpdate(current.id, { customFaces: newFaces });
    }
  };

  const removePicture = (index: number) => {
    const newFaces = [...dice.customFaces];
    const parsed = parseFaceContent(newFaces[index], '');
    newFaces[index] = buildFace(parsed.content, parsed.bgColor || undefined, parsed.value);
    onUpdate(dice.id, { customFaces: newFaces });
  };

  /** Every face its own colour; a plain numbered die becomes faces 1..n first */
  const colourAllFaces = () => {
    const customFaces = colourEveryFace(dice.faces, dice.customFaces);
    // A plain die keeps showing the number it last rolled
    const keepShown = dice.customFaces.length === 0
      ? { currentFaceIndex: Math.min(Math.max(dice.numberValue, 1), customFaces.length) - 1 }
      : {};
    onUpdate(dice.id, { customFaces, ...keepShown });
  };

  const handleColorSelect = (color: string) => {
    if (!activeColorPicker) return;
    if (activeColorPicker.type === 'base') {
      onUpdate(dice.id, { color });
    } else if (activeColorPicker.index !== undefined) {
      updateCustomFaceColor(activeColorPicker.index, color);
    }
    setActiveColorPicker(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dice Settings">
      <div className={styles.container} ref={containerRef}>

        {/* General Settings */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>General Settings</h3>
          <div style={{ marginBottom: 16 }}>
            <label className={styles.label}>Name (Optional)</label>
            <input 
              type="text" 
              value={dice.name || ''} 
              onChange={(e) => onUpdate(dice.id, { name: e.target.value })}
              placeholder="e.g. Player 1"
              className={styles.inputField}
            />
          </div>

          <div className={styles.twoColumnRow}>
            <div>
              <label className={styles.label}>Base Color</label>
              <button
                onClick={(e) => openPicker(e, { type: 'base' })}
                className={styles.colorSwatch}
                style={{ backgroundColor: dice.color, color: getContrastColor(dice.color) }}
                title="Pick base color"
              >
                <Palette size={20} strokeWidth={2} />
              </button>
            </div>

            <div>
              <label className={styles.label}>Standard Faces</label>
              <div className={styles.stepperRow}>
                <button className={styles.stepperBtn} onClick={() => setFaces(dice.faces - 1)} title="Decrease faces">
                  <Minus size={18} strokeWidth={2.5} />
                </button>
                <input 
                  type="number" 
                  value={dice.faces} 
                  onChange={(e) => setFaces(parseInt(e.target.value))}
                  className={styles.stepperInput}
                />
                <button className={styles.stepperBtn} onClick={() => setFaces(dice.faces + 1)} title="Increase faces">
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Faces */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Custom Faces</h3>

          <div style={{ marginBottom: 12 }}>
            <label className={styles.sublabel} style={{ marginBottom: 6, display: 'block' }}>Quick Templates:</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="md-button md-button-surface md-button-compact"
                onClick={() => onUpdate(dice.id, { faces: 3, customFaces: ["YES:bg:#2E7D32", "NO:bg:#D32F2F", "MAYBE:bg:#FFD700"] })}
              >
                ❓ Decision Maker
              </button>
              <button 
                type="button"
                className="md-button md-button-surface md-button-compact"
                onClick={() => onUpdate(dice.id, { faces: 4, customFaces: ["N:bg:#0056D2", "S:bg:#0056D2", "E:bg:#0056D2", "W:bg:#0056D2"] })}
              >
                🧭 Compass
              </button>
            </div>
          </div>
          
          {dice.customFaces.length > 0 && (
            <p className={styles.sublabel} style={{ margin: '0 0 6px' }}>
              The number box sets what a face counts as in totals, e.g. a star as 6.
            </p>
          )}
          {dice.customFaces.some(f => parseFaceContent(f).image) && (
            <p className={styles.sublabel} style={{ margin: '0 0 6px' }}>
              Pictures stay on this device and go into backups. Share links show the face's text instead.
            </p>
          )}
          <div className={styles.facesGrid}>
            {dice.customFaces.length === 0 && <span className={styles.emptyText}>No custom faces added</span>}
            {dice.customFaces.map((f, i) => {
              const parsed = parseFaceContent(f);
              const content = parsed.content;
              const bgColor = parsed.bgColor;
              const picture = parsed.image ? images[parsed.image] : undefined;
              const tileColor = bgColor !== 'transparent' ? bgColor : dice.color;
              
              return (
                <div key={i} className={`${styles.faceCard} ${i === activeFace ? styles.faceCardSelected : ''}`}>
                  <div className={styles.faceCardRow}>
                    <button
                      type="button"
                      className={styles.faceTile}
                      style={{ backgroundColor: tileColor, color: getContrastColor(tileColor) }}
                      onClick={() => setSelectedFace(i)}
                      aria-pressed={i === activeFace}
                      aria-label={`Face ${i + 1}: ${content.startsWith(FACE_ICON_PREFIX) ? content.replace(FACE_ICON_PREFIX, '') : content}${picture ? ', picture' : ''}`}
                    >
                      {picture && <img src={picture} alt="" className={styles.faceThumb} />}
                      {content.startsWith(FACE_ICON_PREFIX) 
                        ? React.createElement(ALL_ICONS.find(icon => icon.name === content.replace(FACE_ICON_PREFIX, ''))?.icon || Star, { size: 20, strokeWidth: 2.5 }) 
                        : <span className={styles.faceTileText}>{content}</span>}
                    </button>
                    <div className={styles.faceActions}>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={parsed.value ?? ''}
                        placeholder={String(faceNumericValue(f))}
                        onChange={(e) => updateCustomFaceValue(i, e.target.value)}
                        className={styles.faceValueInput}
                        aria-label={`Face ${i + 1} counts as`}
                        title="Counts as this number in totals"
                      />
                      {parsed.image ? (
                        <button
                          onClick={() => removePicture(i)}
                          className={styles.facePictureBtn}
                          title="Remove picture"
                          aria-label={`Remove picture from face ${i + 1}`}
                        >
                          <ImageOff size={16} strokeWidth={2.5} />
                        </button>
                      ) : (
                        <button
                          onClick={() => choosePicture(i)}
                          className={styles.facePictureBtn}
                          title="Choose picture"
                          aria-label={`Choose picture for face ${i + 1}`}
                        >
                          <ImagePlus size={16} strokeWidth={2.5} />
                        </button>
                      )}
                      <button onClick={() => removeCustomFace(i)} className={styles.faceRemoveBtn} aria-label={`Remove face ${i + 1}`}>
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {dice.customFaces.length > 0 && (
            <div className={styles.faceColourRow} role="group" aria-label={`Colour for face ${activeFace + 1}`}>
              <span className={styles.sublabel}>Colour for face {activeFace + 1}</span>
              <div className={styles.faceSwatches}>
                <button
                  type="button"
                  className={styles.faceSwatch}
                  style={{ backgroundColor: dice.color, color: getContrastColor(dice.color) }}
                  onClick={() => updateCustomFaceColor(activeFace, 'transparent')}
                  aria-pressed={activeFaceColour === 'transparent'}
                  aria-label="Same as the die"
                  title="Same as the die"
                >
                  <Ban size={14} strokeWidth={2.5} />
                </button>
                {COLORS.map(c => {
                  const current = activeFaceColour.toUpperCase() === c.toUpperCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      className={styles.faceSwatch}
                      style={{ backgroundColor: c }}
                      onClick={() => updateCustomFaceColor(activeFace, c)}
                      aria-label={COLOR_NAMES[c] ?? c}
                      aria-pressed={current}
                    />
                  );
                })}
                <label className={styles.faceSwatchCustom} title="Any colour">
                  <Plus size={14} strokeWidth={2.5} />
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(activeFaceColour) ? activeFaceColour : (/^#[0-9a-fA-F]{6}$/.test(dice.color) ? dice.color : '#808080')}
                    onChange={(e) => updateCustomFaceColor(activeFace, e.target.value)}
                    className={styles.hiddenInput}
                    aria-label="Any colour"
                  />
                </label>
              </div>
            </div>
          )}
          <button
            type="button"
            className={`md-button md-button-surface md-button-compact ${styles.addPictureBtn}`}
            onClick={colourAllFaces}
            disabled={dice.customFaces.length === 0 && dice.faces > 100}
          >
            <Rainbow size={18} strokeWidth={2.5} /> Colour every face differently
          </button>

          <div className={styles.addFaceRow}>
            <input 
              type="text" 
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') addCustomFace(customInput); }}
              placeholder="Add custom text"
              className={styles.inputField}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button className={`md-button md-button-filled ${styles.addFaceBtn}`} onClick={() => addCustomFace(customInput)}>
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>

          <button
            type="button"
            className={`md-button md-button-surface md-button-compact ${styles.addPictureBtn}`}
            onClick={() => choosePicture('new')}
          >
            <ImagePlus size={18} strokeWidth={2.5} /> Add a picture face
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handlePictureFile}
            className={styles.hiddenInput}
            aria-hidden="true"
            tabIndex={-1}
          />
          {pictureError && <p className={styles.pictureError} role="alert">{pictureError}</p>}

          <label className={styles.sublabel}>Or add an icon:</label>
          <div className={styles.iconGrid} style={{ maxHeight: showAllIcons ? '150px' : 'auto', overflowY: showAllIcons ? 'auto' : 'visible' }}>
            {(showAllIcons ? ALL_ICONS : COMMON_ICONS).map(icon => (
              <button 
                key={icon.name} 
                onClick={() => addCustomFace(`${FACE_ICON_PREFIX}${icon.name}`)}
                className={styles.iconBtn}
              >
                <icon.icon size={18} strokeWidth={2.5} />
              </button>
            ))}
            {!showAllIcons && (
              <button onClick={() => setShowAllIcons(true)} className={styles.iconBtnMore}>
                <Plus size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          <button 
            className={`md-button md-button-surface ${styles.footerBtnRemove}`}
            onClick={() => { onRemove(dice.id); onClose(); }}
          >
            <Trash2 size={18} strokeWidth={2.5} /> Remove
          </button>
          <button 
            className={`md-button md-button-surface ${styles.footerBtnClone}`}
            onClick={() => onClone(dice)}
          >
            <Copy size={18} strokeWidth={2.5} /> Clone
          </button>
          <button 
            className={`md-button md-button-filled ${styles.footerBtnDone}`}
            onClick={onClose}
          >
            <Check size={20} strokeWidth={2.5} /> Done
          </button>
        </div>

        {/* Color Picker Popover */}
        {activeColorPicker && (
          <>
            <div onClick={() => setActiveColorPicker(null)} className={styles.popoverBackdrop} />
            <div className={styles.colorPopover} style={{ top: `${activeColorPicker.top}px` }}>
              <div className={styles.popoverHeader}>
                <span className={styles.popoverTitle}>Choose Color</span>
                <button onClick={() => setActiveColorPicker(null)} className={styles.popoverClose}><X size={18} /></button>
              </div>
              <div className={styles.colorGrid}>
                {COLORS.map(c => (
                  <button 
                    key={c}
                    className={styles.colorDot}
                    style={{ backgroundColor: c, border: 'none' }}
                    onClick={() => handleColorSelect(c)}
                    aria-label={COLOR_NAMES[c] ?? c}
                    aria-pressed={c.toUpperCase() === dice.color.toUpperCase()}
                  />
                ))}
                <label className={styles.colorDotCustom}>
                  <Plus size={16} color="#fff" strokeWidth={2.5} />
                  <input 
                    type="color" 
                    value={activeColorPicker.type === 'base' ? dice.color : '#ffffff'}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    className={styles.hiddenInput}
                  />
                </label>
              </div>
            </div>
          </>
        )}

      </div>
    </Modal>
  );
};

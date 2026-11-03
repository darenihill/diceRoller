import React, { useState, useRef, useEffect, useId } from 'react';
import type { DiceData } from '../types';
import { Modal } from './Modal';
import { FACE_ICON_PREFIX, parseFaceContent, buildFace, faceNumericValue, getContrastColor, colourEveryFace } from '../utils/diceUtils';
import { X, Plus, Minus, Star, Check, Copy, Trash2, ImagePlus, ImageOff, Rainbow } from 'lucide-react';
import { addFaceImage, useFaceImages, shrinkImage } from '../utils/faceImages';
import { ALL_ICONS, COMMON_ICONS } from '../utils/iconUtils';
import { MAX_CUSTOM_FACES } from '../utils/constants';
import { splitFaceList, pastedListForBox } from '../utils/faceList';
import { ColorPicker } from './ColorPicker';
import styles from './DiceSettingsModal.module.css';

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

// Adding, removing or replacing a die's faces releases its hold: the tap that opened these
// settings also held it, and a held die with new faces would never roll.
// Recolouring a face, its number or its picture keeps a deliberate hold.
export const DiceSettingsModal: React.FC<DiceSettingsModalProps> = ({ dice, isOpen, onClose, onUpdate, onRemove, onClone, allDice }) => {
  const [customInput, setCustomInput] = useState('');
  // What is typed in the faces box; null shows the die's count. Lets the box be cleared and retyped.
  const [facesDraft, setFacesDraft] = useState<string | null>(null);
  const fieldId = useId();
  const [showAllIcons, setShowAllIcons] = useState(false);
  /** The face the colour row paints: tap a face, then tap a colour */
  const [selectedFace, setSelectedFace] = useState(0);
  /** The colour row pins to the bottom only after a face is tapped, so the faces show first on open */
  const [colourPinnedFor, setColourPinnedFor] = useState<string | null>(null);
  const colourPinned = colourPinnedFor === dice.id;
  /** The open tab, chosen once each time the dialog opens for a die: a die with its own
   *  faces opens on them (faces show first), others on Dice Settings. Removing the last
   *  face then keeps you on Custom faces. */
  const openKey = isOpen ? dice.id : '';
  const openingTab = dice.customFaces.length > 0 ? 'faces' : 'settings';
  const [tabFor, setTabFor] = useState<{ key: string; tab: 'settings' | 'faces' }>({ key: openKey, tab: openingTab });
  if (tabFor.key !== openKey) setTabFor({ key: openKey, tab: openingTab });
  const tab = tabFor.key === openKey ? tabFor.tab : openingTab;
  const setTab = (next: 'settings' | 'faces') => setTabFor({ key: openKey, tab: next });
  const activeFace = Math.min(selectedFace, Math.max(0, dice.customFaces.length - 1));
  const activeFaceColour = parseFaceContent(dice.customFaces[activeFace] ?? '').bgColor;
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Which face the next chosen picture goes on; 'new' adds a picture face */
  const pictureTarget = useRef<number | 'new'>('new');
  const [pictureError, setPictureError] = useState('');
  /** After a list is added: what to say, and the faces to put back on Undo */
  const [listNote, setListNote] = useState<{ text: string; before: string[]; after: string[]; canUndo: boolean } | null>(null);
  const images = useFaceImages();
  // The faces as they are now, for edits that finish after a picture is shrunk
  const latestDice = useRef(dice);
  useEffect(() => { latestDice.current = dice; }, [dice]);

  const setFaces = (num: number) => {
    if (num > 0) onUpdate(dice.id, { held: false, faces: num, customFaces: [] });
  };

  const addCustomFace = (text: string) => {
    const faces = splitFaceList(text);
    if (faces.length === 0) return;
    const before = dice.customFaces;
    const room = Math.max(0, MAX_CUSTOM_FACES - before.length);
    const added = faces.slice(0, room);
    const leftOut = faces.length - added.length;
    const after = added.length > 0 ? [...before, ...added] : before;
    if (added.length > 0) onUpdate(dice.id, { held: false, customFaces: after });
    setCustomInput('');
    if (faces.length > 1 || leftOut > 0) {
      const addedText = `Added ${added.length} face${added.length === 1 ? '' : 's'}`;
      setListNote({
        text: leftOut > 0
          ? `${addedText}; ${leftOut} left out, a die holds ${MAX_CUSTOM_FACES}.`
          : `${addedText}.`,
        before,
        after,
        canUndo: added.length > 0,
      });
    } else {
      setListNote(null);
    }
  };

  const undoList = () => {
    if (!listNote) return;
    onUpdate(dice.id, { customFaces: listNote.before });
    setListNote(null);
  };

  // A pasted list keeps its lines: they show as commas, which + splits on
  const handleListPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (!/[\r\n]/.test(pasted)) return;
    e.preventDefault();
    const input = e.currentTarget;
    const start = input.selectionStart ?? customInput.length;
    const end = input.selectionEnd ?? customInput.length;
    const head = customInput.slice(0, start).replace(/[,\s]*$/, '');
    const tail = customInput.slice(end).replace(/^[,\s]*/, '');
    setCustomInput([head, pastedListForBox(pasted), tail].filter(Boolean).join(', '));
  };

  const removeCustomFace = (index: number) => {
    const newFaces = [...dice.customFaces];
    newFaces.splice(index, 1);
    onUpdate(dice.id, { held: false, customFaces: newFaces });
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
      onUpdate(current.id, { held: false, customFaces: [...current.customFaces, buildFace(String(n), undefined, undefined, id)] });
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

  // Two tabs in the title bar: Dice Settings and Custom faces (owner, 2026-11-02)
  const tabsHeader = (
    <div className={styles.tabs} role="tablist" aria-label="Dice settings">
      {([['settings', 'Dice Settings'], ['faces', 'Custom faces']] as const).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          id={`${fieldId}-tab-${key}`}
          aria-selected={tab === key}
          aria-controls={`${fieldId}-panel-${key}`}
          className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
          onClick={() => setTab(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dice Settings" header={tabsHeader}>
      <div className={styles.container} ref={containerRef}>

        {tab === 'settings' && (
        <div className={styles.sectionCard} role="tabpanel" id={`${fieldId}-panel-settings`} aria-labelledby={`${fieldId}-tab-settings`}>
          <div style={{ marginBottom: 16 }}>
            <label className={styles.label} htmlFor={`${fieldId}-name`}>Name (Optional)</label>
            <input 
              id={`${fieldId}-name`}
              type="text" 
              autoComplete="off"
              enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              value={dice.name || ''} 
              onChange={(e) => onUpdate(dice.id, { name: e.target.value })}
              placeholder="e.g. Player 1"
              className={styles.inputField}
            />
          </div>

          <div className={styles.fieldBlock}>
            <span className={styles.label} aria-hidden="true">Die colour</span>
            <ColorPicker key={dice.id} label="Die colour" value={dice.color} onChange={(color) => onUpdate(dice.id, { color })} />
          </div>

          <div className={styles.fieldBlock}>
            <div>
              <label className={styles.label} htmlFor={`${fieldId}-faces`}>
                Standard Faces
                {dice.customFaces.length > 0 && (
                  <span className={styles.labelNote}>
                    Replaces your {dice.customFaces.length} custom {dice.customFaces.length === 1 ? 'face' : 'faces'}
                  </span>
                )}
              </label>
              <div className={styles.stepperRow}>
                <button className={styles.stepperBtn} onClick={() => setFaces(dice.faces - 1)} title="Decrease faces">
                  <Minus size={18} strokeWidth={2.5} />
                </button>
                <input 
                  id={`${fieldId}-faces`}
                  type="number" 
                  inputMode="numeric"
                  enterKeyHint="done"
                  min={1}
                  value={facesDraft ?? dice.faces} 
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => { setFacesDraft(e.target.value); setFaces(parseInt(e.target.value, 10)); }}
                  onBlur={() => setFacesDraft(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  className={styles.stepperInput}
                />
                <button className={styles.stepperBtn} onClick={() => setFaces(dice.faces + 1)} title="Increase faces">
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>

        )}

        {tab === 'faces' && (<div role="tabpanel" id={`${fieldId}-panel-faces`} aria-labelledby={`${fieldId}-tab-faces`} className={styles.container}>
        <div className={styles.sectionCard}>

          
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
                      onClick={() => { setSelectedFace(i); setColourPinnedFor(dice.id); }}
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
                        enterKeyHint="done"
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
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
            <div className={`${styles.faceColourRow} ${colourPinned ? '' : styles.faceColourRowLoose}`} data-pinned={colourPinned}>
              <span className={styles.sublabel}>Colour for face {activeFace + 1}</span>
              <ColorPicker
                key={`${dice.id}-${activeFace}`}
                label={`Colour for face ${activeFace + 1}`}
                value={activeFaceColour}
                sameAs={dice.color}
                onChange={(color) => updateCustomFaceColor(activeFace, color)}
              />
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
              onPaste={handleListPaste}
              placeholder="Add custom text"
              aria-label="Custom face text"
              autoComplete="off"
              className={styles.inputField}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button className={`md-button md-button-filled ${styles.addFaceBtn}`} onClick={() => addCustomFace(customInput)} aria-label="Add face" title="Add face">
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
          {/* Any later edit to the faces retires the note, so Undo never wipes that edit */}
          {listNote && listNote.after === dice.customFaces && (
            <p className={styles.listNote} role="status">
              <span>{listNote.text}</span>
              {listNote.canUndo && (
                <button type="button" className={styles.listUndo} onClick={undoList}>Undo</button>
              )}
            </p>
          )}

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
                aria-label={`Add ${icon.name} face`}
                title={icon.name}
              >
                <icon.icon size={18} strokeWidth={2.5} />
              </button>
            ))}
            {!showAllIcons && (
              <button onClick={() => setShowAllIcons(true)} className={styles.iconBtnMore} aria-label="More icons" title="More icons">
                <Plus size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        </div>)}

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

      </div>
    </Modal>
  );
};

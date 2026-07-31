import React, { useState } from 'react';
import type { DiceData } from '../types';
import { Modal } from './Modal';
import { COLORS, FACE_BG_DELIMITER, FACE_ICON_PREFIX, parseFaceContent, getContrastColor } from '../utils/diceUtils';
import { X, Plus, Minus, Star, Check, Copy, Trash2, Palette } from 'lucide-react';
import { ALL_ICONS, COMMON_ICONS } from '../utils/iconUtils';
import styles from './DiceSettingsModal.module.css';

interface DiceSettingsModalProps {
  dice: DiceData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<DiceData>) => void;
  onRemove: (id: string) => void;
  onClone: (template: Partial<DiceData>) => void;
}

export const DiceSettingsModal: React.FC<DiceSettingsModalProps> = ({ dice, isOpen, onClose, onUpdate, onRemove, onClone }) => {
  const [customInput, setCustomInput] = useState('');
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<{ type: 'base' | 'custom'; index?: number } | null>(null);

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
    newFaces[index] = `${parsed.content}${FACE_BG_DELIMITER}${color}`;
    onUpdate(dice.id, { customFaces: newFaces });
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
      <div className={styles.container}>

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
                onClick={(e) => { e.stopPropagation(); setActiveColorPicker({ type: 'base' }); }}
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
                className="md-button md-button-surface"
                style={{ padding: '4px 10px', fontSize: 12, height: 32 }}
                onClick={() => onUpdate(dice.id, { faces: 2, customFaces: [":icon:Sun:bg:#FFD700", ":icon:Moon:bg:#0056D2"] })}
              >
                🪙 Coin Flip
              </button>
              <button 
                type="button"
                className="md-button md-button-surface"
                style={{ padding: '4px 10px', fontSize: 12, height: 32 }}
                onClick={() => onUpdate(dice.id, { faces: 3, customFaces: [":icon:Mountain:bg:#757575", ":icon:FileText:bg:#E9EAEC", ":icon:Scissors:bg:#E32227"] })}
              >
                ✂️ Rock Paper Scissors
              </button>
              <button 
                type="button"
                className="md-button md-button-surface"
                style={{ padding: '4px 10px', fontSize: 12, height: 32 }}
                onClick={() => onUpdate(dice.id, { faces: 3, customFaces: ["YES:bg:#2E7D32", "NO:bg:#D32F2F", "MAYBE:bg:#FFD700"] })}
              >
                ❓ Decision Maker
              </button>
              <button 
                type="button"
                className="md-button md-button-surface"
                style={{ padding: '4px 10px', fontSize: 12, height: 32 }}
                onClick={() => onUpdate(dice.id, { faces: 4, customFaces: ["N:bg:#0056D2", "S:bg:#0056D2", "E:bg:#0056D2", "W:bg:#0056D2"] })}
              >
                🧭 Compass
              </button>
            </div>
          </div>
          
          <div className={styles.facesGrid}>
            {dice.customFaces.length === 0 && <span className={styles.emptyText}>No custom faces added</span>}
            {dice.customFaces.map((f, i) => {
              const parsed = parseFaceContent(f);
              const content = parsed.content;
              const bgColor = parsed.bgColor;
              
              return (
                <div key={i} className={styles.faceCard}>
                  <div className={styles.faceCardRow}>
                    <div className={styles.faceContent}>
                      {content.startsWith(FACE_ICON_PREFIX) 
                        ? React.createElement(ALL_ICONS.find(icon => icon.name === content.replace(FACE_ICON_PREFIX, ''))?.icon || Star, { size: 20, strokeWidth: 2.5 }) 
                        : content}
                    </div>
                    <div className={styles.faceActions}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveColorPicker({ type: 'custom', index: i }); }} 
                        className={styles.faceColorBtn}
                        style={{ backgroundColor: bgColor !== 'transparent' ? bgColor : 'rgba(255,255,255,0.08)' }}
                        title="Edit Color"
                      >
                        <Palette size={14} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => removeCustomFace(i)} className={styles.faceRemoveBtn}>
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
            <div className={styles.colorPopover} style={{ top: activeColorPicker.type === 'base' ? '65px' : '230px' }}>
              <div className={styles.popoverHeader}>
                <span className={styles.popoverTitle}>Choose Color</span>
                <button onClick={() => setActiveColorPicker(null)} className={styles.popoverClose}><X size={18} /></button>
              </div>
              <div className={styles.colorGrid}>
                {COLORS.map(c => (
                  <button 
                    key={c}
                    className={styles.colorDot}
                    style={{ backgroundColor: c, border: c === dice.color ? '3px solid var(--md-sys-color-primary)' : 'none' }}
                    onClick={() => handleColorSelect(c)}
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

import React, { useState } from 'react';
import type { DiceData } from '../types';
import { Modal } from './Modal';
import { COLORS } from '../utils/diceUtils';
import { X, Plus, Star, Check } from 'lucide-react';
import { ALL_ICONS, COMMON_ICONS } from '../utils/iconUtils';

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

  const handleFacesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value);
    if (!isNaN(num) && num > 0) {
      onUpdate(dice.id, { faces: num, customFaces: [] });
    }
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
    const parts = faceStr.split(':bg:');
    newFaces[index] = `${parts[0]}:bg:${color}`;
    onUpdate(dice.id, { customFaces: newFaces });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dice Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ backgroundColor: 'var(--md-sys-color-surface-variant)', padding: 16, borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: 'var(--md-sys-color-primary)' }}>Base Settings</h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, color: 'var(--md-sys-color-on-surface)', display: 'block', marginBottom: 8, opacity: 0.8 }}>Name (Optional)</label>
            <input 
              type="text" 
              value={dice.name || ''} 
              onChange={(e) => onUpdate(dice.id, { name: e.target.value })}
              placeholder="e.g. Player 1"
              style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, color: 'var(--md-sys-color-on-surface)', display: 'block', marginBottom: 8, opacity: 0.8 }}>Base Color</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {COLORS.slice(0, 11).map(c => (
                <button 
                  key={c} 
                  style={{ 
                    backgroundColor: c, 
                    border: c === dice.color ? '2px solid var(--md-sys-color-primary)' : 'none',
                    borderRadius: '50%',
                    aspectRatio: '1',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                  onClick={() => onUpdate(dice.id, { color: c })}
                />
              ))}
              <label 
                style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '50%',
                  aspectRatio: '1',
                  width: '100%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              >
                <input 
                  type="color" 
                  value={dice.color} 
                  onChange={(e) => onUpdate(dice.id, { color: e.target.value })} 
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} 
                />
                <Plus size={20} />
              </label>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 14, color: 'var(--md-sys-color-on-surface)', display: 'block', marginBottom: 8, opacity: 0.8 }}>Standard Faces</label>
            <input 
              type="number" 
              value={dice.faces} 
              onChange={handleFacesChange}
              style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 14 }}
            />
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--md-sys-color-surface-variant)', padding: 16, borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: 'var(--md-sys-color-primary)' }}>Custom Faces</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {dice.customFaces.length === 0 && <span style={{ fontSize: 14, color: '#888' }}>No custom faces added</span>}
            {dice.customFaces.map((f, i) => {
              const parts = f.split(':bg:');
              const content = parts[0];
              const bgColor = parts[1] || 'transparent';
              
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
                      {content.startsWith(':icon:') 
                        ? React.createElement(ALL_ICONS.find(icon => icon.name === content.replace(':icon:', ''))?.icon || Star, { size: 24 }) 
                        : content}
                    </div>
                    <button onClick={() => removeCustomFace(i)} style={{ color: 'var(--md-sys-color-error)', backgroundColor: 'transparent', padding: 4 }}><X size={20} /></button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {COLORS.slice(0, 8).map(c => (
                      <button 
                        key={c}
                        style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c, border: c === bgColor ? '2px solid var(--md-sys-color-primary)' : '1px solid rgba(255,255,255,0.2)', padding: 0, cursor: 'pointer' }}
                        onClick={() => updateCustomFaceColor(i, c)}
                      />
                    ))}
                    <label 
                      style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}
                      title="Custom Color"
                    >
                      <Plus size={16} color="#fff" />
                      <input 
                        type="color" 
                        value={bgColor !== 'transparent' ? bgColor : '#ffffff'}
                        onChange={(e) => updateCustomFaceColor(i, e.target.value)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} 
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input 
              type="text" 
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') addCustomFace(customInput); }}
              placeholder="Add custom text"
              style={{ flex: 1, height: '40px', padding: '0 12px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: 14, minWidth: 0 }}
            />
            <button className="md-button md-button-filled" onClick={() => addCustomFace(customInput)} style={{ width: '40px', height: '40px', padding: '0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} />
            </button>
          </div>

          <label style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface)', display: 'block', marginBottom: 8, opacity: 0.6 }}>Or add an icon:</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, maxHeight: showAllIcons ? '200px' : 'auto', overflowY: showAllIcons ? 'auto' : 'visible', paddingRight: showAllIcons ? '4px' : '0' }}>
            {(showAllIcons ? ALL_ICONS : COMMON_ICONS).map(icon => (
              <button 
                key={icon.name} 
                onClick={() => addCustomFace(`:icon:${icon.name}`)}
                style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', borderRadius: '50%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <icon.icon size={20} />
              </button>
            ))}
            {!showAllIcons && (
              <button 
                onClick={() => setShowAllIcons(true)}
                style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', borderRadius: '50%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button 
            className="md-button md-button-surface" 
            style={{ flex: 1, color: 'var(--md-sys-color-error)', border: '1px solid var(--md-sys-color-error)' }}
            onClick={() => {
              onRemove(dice.id);
              onClose();
            }}
          >
            Remove
          </button>
          <button 
            className="md-button md-button-surface" 
            style={{ flex: 1, color: 'var(--md-sys-color-primary)', border: '1px solid var(--md-sys-color-primary)' }}
            onClick={() => {
              onClone(dice);
              onClose();
            }}
          >
            Clone
          </button>
          <button 
            className="md-button md-button-filled" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={onClose}
          >
            <Check size={20} /> Done
          </button>
        </div>

      </div>
    </Modal>
  );
};

import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import LZString from 'lz-string';
import styles from './App.module.css';
import { useDiceState } from './hooks/useDiceState';
import { useStorage } from './hooks/useStorage';
import { Dice } from './components/Dice';
import { ActionBar } from './components/ActionBar';
import { SidebarMenu } from './components/SidebarMenu';
import { Modal } from './components/Modal';
import { DiceSettingsModal } from './components/DiceSettingsModal';
import { dicePresets } from './utils/presets';
import { generateId } from './utils/diceUtils';
import { Trash2, FileUp, FileDown, Volume2, VolumeX, ToggleLeft, ToggleRight } from 'lucide-react';
import { playRollSound } from './utils/soundEffects';
import type { DiceData } from './types';

function App() {
  const {
    diceList, setDiceList, rollHistory, isRolling, modifier, setModifier,
    addDice, removeDice, updateDice, toggleHold, toggleHoldAll,
    clearAllDice, rollDice, clearHistory, toast, showToast
  } = useDiceState();

  const containerRef = useRef<HTMLDivElement>(null);
  
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [shareFallbackUrl, setShareFallbackUrl] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerSize({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { savedConfigs, saveConfig, deleteConfig, getSystemAutosave } = useStorage();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editingDiceId, setEditingDiceId] = useState<string | null>(null);
  const [revealedDiceId, setRevealedDiceId] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'theme-dark');
  
  const [showModifier, setShowModifier] = useState(() => localStorage.getItem('showModifier') === 'true');

  useEffect(() => {
    localStorage.setItem('showModifier', String(showModifier));
  }, [showModifier]);

  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('soundEnabled') !== 'false');

  useEffect(() => {
    localStorage.setItem('soundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  // Modals state
  const [modalOpen, setModalOpen] = useState<'help' | 'history' | 'sets' | 'customize' | null>(null);

  useEffect(() => {
    // Remove old theme classes, then add the current one
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-felt', 'theme-midnight');
    document.body.classList.add(theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
  }, [menuOpen]);

  // Auto-deselect active die on mobile after 5 seconds, or if any other button/area is clicked
  useEffect(() => {
    if (!revealedDiceId) return;

    const timer = setTimeout(() => {
      setRevealedDiceId(null);
    }, 5000);

    const handleOutsideClick = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-dice-id]')) {
        return;
      }
      setRevealedDiceId(null);
    };

    document.addEventListener('pointerdown', handleOutsideClick);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [revealedDiceId]);

  // Load shared config from URL or autosave on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const compressed = hash.replace('#share=', '');
        const json = LZString.decompressFromEncodedURIComponent(compressed);
        if (json) {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed)) {
            setDiceList(parsed.map((d: DiceData) => ({ ...d, id: generateId() })));
            // Remove hash from URL so it doesn't persist on reload
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load shared dice set from URL", e);
      }
    }

    const defaultSet = localStorage.getItem('defaultDiceSet');
    if (defaultSet) {
      try {
        const parsed = JSON.parse(defaultSet);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDiceList(parsed.map((d: DiceData) => ({ ...d, id: generateId() })));
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const autosave = getSystemAutosave();
    if (autosave && autosave.config.length > 0) {
      setDiceList(autosave.config.map(d => ({ ...d, id: generateId() })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save autosave on unload
  useEffect(() => {
    const handleUnload = () => {
      saveConfig('systemAutosave', diceList);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [diceList, saveConfig]);

  // Derived state
  const allHeld = diceList.length > 0 && diceList.every(d => d.held);
  const totalVisible = rollHistory.length > 0;
  const lastTotal = totalVisible ? rollHistory[0].total : 0;

  // Dice Size Calculation based on count
  const diceCount = diceList.length;
  let optimalSize = 0;
  let optimalColumns = 1;
  let dynamicGap = 0;
  const GAP_RATIO = 0.10; // 10% gap relative to size ensures the 4% corner buttons never collide

  if (diceCount > 0 && containerSize.width > 0 && containerSize.height > 0) {
    let maxDieSize = 0;
    
    // Add a safety margin to account for absolute-positioned corner buttons and shadows
    const safeWidth = Math.max(0, containerSize.width - 24);
    const safeHeight = Math.max(0, containerSize.height - 24);
    
    for (let c = 1; c <= diceCount; c++) {
      const r = Math.ceil(diceCount / c);
      // Math: size * columns + size * gapRatio * (columns - 1) = available container width
      const sizeW = safeWidth / (c + GAP_RATIO * (c - 1));
      const sizeH = safeHeight / (r + GAP_RATIO * (r - 1));
      const size = Math.min(sizeW, sizeH);
      
      if (size > maxDieSize) {
        maxDieSize = size;
        optimalColumns = c;
      }
    }
    
    optimalSize = Math.floor(Math.min(maxDieSize, 480));
    dynamicGap = Math.floor(optimalSize * GAP_RATIO);
  }

  const diceStyles = {
    '--dice-size': `${optimalSize}px`,
    '--dice-columns': optimalColumns,
    '--dice-gap': `${dynamicGap}px`
  } as React.CSSProperties;

  const handleSave = () => {
    setSaveName('');
    setSavePromptOpen(true);
    setMenuOpen(false);
  };

  const executeSave = () => {
    if (saveName.trim()) {
      saveConfig(saveName.trim(), diceList);
      showToast('Saved!');
      setSavePromptOpen(false);
    }
  };

  const handleLoadSet = (config: Partial<DiceData>[]) => {
    setDiceList(config.map((d) => ({
      id: d.id || generateId(),
      numberValue: d.numberValue ?? 1,
      faces: d.faces ?? 6,
      currentFaceIndex: d.currentFaceIndex,
      name: d.name,
      customFaces: d.customFaces ?? [],
      color: d.color ?? '#E9EAEC',
      held: d.held ?? false
    })));
    setModalOpen(null);
    setMenuOpen(false);
  };

  const handleSetDefault = () => {
    localStorage.setItem('defaultDiceSet', JSON.stringify(diceList));
    showToast('Saved as default! It will automatically load on open.');
    setMenuOpen(false);
  };

  const handleDeleteAll = () => {
    setConfirmDeleteOpen(true);
    setMenuOpen(false);
  };

  const executeDeleteAll = () => {
    clearAllDice();
    try {
      const stored = localStorage.getItem('diceConfigs');
      if (stored) {
        const parsed = JSON.parse(stored);
        delete parsed['systemAutosave'];
        localStorage.setItem('diceConfigs', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error(e);
    }
    setConfirmDeleteOpen(false);
  };

  const handleShare = () => {
    const json = JSON.stringify(diceList);
    const compressed = LZString.compressToEncodedURIComponent(json);
    const url = `${window.location.origin}${window.location.pathname}#share=${compressed}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("Share link copied to clipboard!");
      }).catch(err => {
        console.error("Failed to copy link: ", err);
        setShareFallbackUrl(url);
      });
    } else {
      setShareFallbackUrl(url);
    }
    setMenuOpen(false);
  };

  const handleExportData = () => {
    try {
      const data = {
        version: "1.0",
        configs: JSON.parse(localStorage.getItem('diceConfigs') || '{}'),
        defaultSet: JSON.parse(localStorage.getItem('defaultDiceSet') || '[]'),
        rollHistory: JSON.parse(localStorage.getItem('rollHistory') || '[]'),
        theme: localStorage.getItem('appTheme') || 'theme-dark',
        soundEnabled: localStorage.getItem('soundEnabled') !== 'false'
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diceroller_backup.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Exported backup successfully!');
    } catch (e) {
      console.error(e);
      showToast('Failed to export backup.');
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data && typeof data === 'object') {
          if (data.configs) {
            const currentConfigs = JSON.parse(localStorage.getItem('diceConfigs') || '{}');
            const mergedConfigs = { ...currentConfigs, ...data.configs };
            localStorage.setItem('diceConfigs', JSON.stringify(mergedConfigs));
          }
          if (data.defaultSet) {
            localStorage.setItem('defaultDiceSet', JSON.stringify(data.defaultSet));
          }
          if (data.rollHistory) {
            localStorage.setItem('rollHistory', JSON.stringify(data.rollHistory));
          }
          if (data.theme) {
            localStorage.setItem('appTheme', data.theme);
          }
          if (data.soundEnabled !== undefined) {
            localStorage.setItem('soundEnabled', String(data.soundEnabled));
          }
          
          showToast('Imported backup successfully! Reloading...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          showToast('Invalid backup file structure.');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.app} style={{ paddingBottom: showModifier ? '360px' : '120px' }}>
      <div ref={containerRef} className={styles.diceContainer} style={diceStyles}>
        {diceList.map((dice) => (
          <Dice
            key={dice.id}
            dice={dice}
            isRolling={isRolling}
            isRevealed={revealedDiceId === dice.id}
            onReveal={() => setRevealedDiceId(dice.id)}
            onToggleHold={toggleHold}
            onRemove={removeDice}
            onOpenSettings={setEditingDiceId}
          />
        ))}
      </div>

      <SidebarMenu
        isOpen={menuOpen}
        onToggle={() => setMenuOpen(!menuOpen)}
        onDonate={() => window.open('https://www.buymeacoffee.com/darenihill', '_blank')}
        onIdeas={() => window.open('https://forms.gle/wqYaKsEZ5FQwizuMA', '_blank')}
        onHelp={() => setModalOpen('help')}
        onHistory={() => setModalOpen('history')}
        onSets={() => setModalOpen('sets')}
        onCustomize={() => setModalOpen('customize')}
        onDeleteAll={handleDeleteAll}
        onSave={handleSave}
        onShare={handleShare}
        onSetDefault={handleSetDefault}
        onLoad={() => setModalOpen('sets')}
        showModifier={showModifier}
        onToggleModifier={() => setShowModifier(!showModifier)}
      />

      <ActionBar
        onAdd={addDice}
        onRoll={() => {
          rollDice();
          if (soundEnabled) {
            playRollSound();
          }
        }}
        onHoldAll={toggleHoldAll}
        allHeld={allHeld}
        totalVisible={totalVisible}
        lastTotal={lastTotal}
        modifier={modifier}
        showModifier={showModifier}
        onChangeModifier={setModifier}
      />

      {/* Help Modal */}
      <Modal isOpen={modalOpen === 'help'} onClose={() => setModalOpen(null)} title="Help & Guide">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--md-sys-color-on-surface-variant)', fontSize: 14, lineHeight: 1.6 }}>
          <p>Welcome to <strong>Dice Roller</strong>! Here is how to use the available features:</p>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li><strong>Add / Roll Dice:</strong> Use the <code>+</code> button at the bottom to add dice, and the main button to roll all unheld dice.</li>
            <li><strong>Hold individual dice:</strong> Simply click/tap any die to hold or release it. Held dice stay locked across rolls.</li>
            <li><strong>Lock All:</strong> Toggle the Lock icon in the action bar to instantly hold or release all dice at once.</li>
            <li><strong>Custom Faces:</strong> Click the gear icon on a die to open settings. You can add custom text, special icons, and pick custom background colors for each face.</li>
            <li><strong>Games & Presets:</strong> Quickly load predefined configurations like <em>Cities & Knights</em> or <em>That's Pretty Clever</em>, or save and load your own custom games!</li>
            <li><strong>Colorblind Friendly:</strong> Automatic contrast coloring ensures text and icons are perfectly readable against any background color.</li>
          </ul>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={modalOpen === 'history'} onClose={() => setModalOpen(null)} title="Roll History">
        {rollHistory.length === 0 ? (
          <p>No History</p>
        ) : (
          <div className={styles.historyList}>
            <button className="md-button md-button-surface" onClick={clearHistory}>Clear History</button>
            {rollHistory.map((roll, i) => (
              <div key={roll.id} className={styles.historyItem}>
                <div className={styles.historyIndex}>Roll {rollHistory.length - i}</div>
                <div className={styles.historyDetails}>{roll.details.join(', ')}</div>
                <div className={styles.historyTotal}>Total: {roll.total}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Sets Modal */}
      <Modal isOpen={modalOpen === 'sets'} onClose={() => setModalOpen(null)} title="Games & Saves">
        <div className={styles.setsContainer}>
          <h3>Presets</h3>
          <div className={styles.setsGrid}>
            {dicePresets.map((preset) => (
              <button key={preset.name} className={`md-card ${styles.setCard}`} onClick={() => handleLoadSet(preset.dice)}>
                {preset.name}
              </button>
            ))}
          </div>

          {Object.keys(savedConfigs).filter(k => k !== 'systemAutosave').length > 0 && (
            <>
              <h3 style={{ marginTop: 24 }}>Your Saves</h3>
              <div className={styles.setsGrid}>
                {Object.values(savedConfigs).filter(c => c.name !== 'systemAutosave').map((config) => (
                  <div key={config.name} className={`md-card ${styles.setCard} ${styles.saveCard}`}>
                    <button className={styles.saveCardBtn} onClick={() => handleLoadSet(config.config)}>
                      {config.name}
                    </button>
                    <button className="md-icon-button" onClick={(e) => { e.stopPropagation(); deleteConfig(config.name); }}>
                      <Trash2 size={16} color="var(--md-sys-color-error)" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <h3 style={{ marginTop: 24, borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16 }}>Backup</h3>
          <div className={styles.setsGrid}>
            <button className={`md-card ${styles.setCard}`} onClick={handleExportData} title="Export games & settings to a backup file" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <FileDown size={20} />
              <span>Export Backup</span>
            </button>
            <button className={`md-card ${styles.setCard}`} onClick={() => document.getElementById('import-backup-input-modal')?.click()} title="Import games & settings from a backup file" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <FileUp size={20} />
              <span>Import Backup</span>
            </button>
            <input 
              type="file" 
              id="import-backup-input-modal" 
              accept=".json" 
              onChange={handleImportData} 
              style={{ display: 'none' }} 
            />
          </div>
        </div>
      </Modal>

      {/* Custom Dialogs */}
      <Modal isOpen={savePromptOpen} onClose={() => setSavePromptOpen(false)} title="Save Game">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ fontSize: 14, color: 'var(--md-sys-color-on-surface-variant)' }}>Enter a name for this game:</label>
          <input 
            autoFocus
            type="text" 
            value={saveName} 
            onChange={(e) => setSaveName(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: '1px solid var(--md-sys-color-outline)', background: 'transparent', color: 'var(--md-sys-color-on-surface)', fontSize: 16 }}
            onKeyDown={(e) => e.key === 'Enter' && executeSave()}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="md-button md-button-surface" onClick={() => setSavePromptOpen(false)}>Cancel</button>
            <button className="md-button md-button-primary" onClick={executeSave} disabled={!saveName.trim()}>Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="Confirm Delete">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>Are you sure you want to delete all dice?</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="md-button md-button-surface" onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
            <button className="md-button" style={{ backgroundColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error)' }} onClick={executeDeleteAll}>Delete All</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} title="Share Link">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ fontSize: 14, color: 'var(--md-sys-color-on-surface-variant)' }}>Copy this link to share:</label>
          <input 
            type="text" 
            readOnly
            value={shareFallbackUrl || ''} 
            style={{ padding: 12, borderRadius: 8, border: '1px solid var(--md-sys-color-outline)', background: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface)', fontSize: 14 }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="md-button md-button-primary" onClick={() => setShareFallbackUrl(null)}>Done</button>
          </div>
        </div>
      </Modal>

      {/* Customize Modal (Themes + Sounds + Modifier) */}
      <Modal isOpen={modalOpen === 'customize'} onClose={() => setModalOpen(null)} title="Customize App">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>Visual Themes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button 
              className={`md-card ${styles.setCard}`} 
              style={{ margin: 0, padding: '16px 8px', backgroundColor: '#1E1E1E', color: '#FFF', border: theme === 'theme-dark' ? '2px solid var(--md-sys-color-primary)' : 'none' }}
              onClick={() => { setTheme('theme-dark'); }}
            >
              Default Dark
            </button>
            <button 
              className={`md-card ${styles.setCard}`} 
              style={{ margin: 0, padding: '16px 8px', backgroundColor: '#F0F0F0', color: '#000', border: theme === 'theme-light' ? '2px solid var(--md-sys-color-primary)' : 'none' }}
              onClick={() => { setTheme('theme-light'); }}
            >
              Clean Light
            </button>
            <button 
              className={`md-card ${styles.setCard}`} 
              style={{ margin: 0, padding: '16px 8px', backgroundColor: '#1B4D3E', color: '#FFF', border: theme === 'theme-felt' ? '2px solid #FFD700' : 'none' }}
              onClick={() => { setTheme('theme-felt'); }}
            >
              Casino Felt
            </button>
            <button 
              className={`md-card ${styles.setCard}`} 
              style={{ margin: 0, padding: '16px 8px', backgroundColor: '#090B10', color: '#DFE0FF', border: theme === 'theme-midnight' ? '2px solid #8E99F3' : 'none' }}
              onClick={() => { setTheme('theme-midnight'); }}
            >
              Midnight
            </button>
          </div>

          <h3 style={{ margin: '16px 0 8px 0', fontSize: 16, fontWeight: 600, borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16 }}>Preferences</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Sound Toggle Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Sound Effects</span>
                <span style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>Play synthesized rolling rattles & landing thuds</span>
              </div>
              <button 
                className="md-icon-button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute Sounds" : "Unmute Sounds"}
                style={{ padding: 8, borderRadius: '50%', background: soundEnabled ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-variant)' }}
              >
                {soundEnabled ? <Volume2 size={20} color="var(--md-sys-color-on-primary-container)" /> : <VolumeX size={20} />}
              </button>
            </div>

            {/* Modifier Toggle Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Roll Modifier</span>
                <span style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>Show mathematical offset adder bar</span>
              </div>
              <button 
                className="md-icon-button"
                onClick={() => setShowModifier(!showModifier)}
                title={showModifier ? "Hide Modifier" : "Show Modifier"}
                style={{ padding: 8, borderRadius: '50%', background: showModifier ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-variant)' }}
              >
                {showModifier ? <ToggleRight size={20} color="var(--md-sys-color-on-primary-container)" /> : <ToggleLeft size={20} />}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div className={styles.toast}>
          {toast}
        </div>
      )}

      {/* Dice Settings Modal */}
      {editingDiceId && (
        <DiceSettingsModal 
          dice={diceList.find(d => d.id === editingDiceId)!}
          isOpen={!!editingDiceId}
          onClose={() => setEditingDiceId(null)}
          onUpdate={updateDice}
          onRemove={removeDice}
          onClone={addDice}
        />
      )}
    </div>
  );
}

export default App;

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
import { Trash2 } from 'lucide-react';

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

  // Modals state
  const [modalOpen, setModalOpen] = useState<'help' | 'history' | 'sets' | 'themes' | null>(null);

  useEffect(() => {
    // Remove old theme classes, then add the current one
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-felt', 'theme-midnight');
    document.body.classList.add(theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
  }, [menuOpen]);

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
            setDiceList(parsed.map((d: any) => ({ ...d, id: generateId() })));
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
          setDiceList(parsed.map((d: any) => ({ ...d, id: generateId() })));
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
    
    for (let c = 1; c <= diceCount; c++) {
      const r = Math.ceil(diceCount / c);
      // Math: size * columns + size * gapRatio * (columns - 1) = available container width
      const sizeW = containerSize.width / (c + GAP_RATIO * (c - 1));
      const sizeH = containerSize.height / (r + GAP_RATIO * (r - 1));
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

  const handleLoadSet = (config: any) => {
    setDiceList(config.map((d: any) => ({ ...d, id: generateId() })));
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
        onThemes={() => setModalOpen('themes')}
        onDeleteAll={handleDeleteAll}
        onSave={handleSave}
        onLoad={() => setModalOpen('sets')}
        onShare={handleShare}
        onSetDefault={handleSetDefault}
        showModifier={showModifier}
        onToggleModifier={() => setShowModifier(!showModifier)}
      />

      <ActionBar
        onAdd={addDice}
        onRoll={rollDice}
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
            <li><strong>Sets & Presets:</strong> Quickly load predefined configurations like <em>Cities & Knights</em> or <em>That's Pretty Clever</em>, or save and load your own custom sets!</li>
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
      <Modal isOpen={modalOpen === 'sets'} onClose={() => setModalOpen(null)} title="Sets & Saves">
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
        </div>
      </Modal>

      {/* Custom Dialogs */}
      <Modal isOpen={savePromptOpen} onClose={() => setSavePromptOpen(false)} title="Save Set">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ fontSize: 14, color: 'var(--md-sys-color-on-surface-variant)' }}>Enter a name for this set:</label>
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

      {/* Themes Modal */}
      <Modal isOpen={modalOpen === 'themes'} onClose={() => setModalOpen(null)} title="App Themes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ backgroundColor: '#1E1E1E', color: '#FFF', border: theme === 'theme-dark' ? '2px solid #A8C7FA' : 'none' }}
            onClick={() => { setTheme('theme-dark'); setModalOpen(null); setMenuOpen(false); }}
          >
            Default Dark
          </button>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ backgroundColor: '#F0F0F0', color: '#000', border: theme === 'theme-light' ? '2px solid #0056D2' : 'none' }}
            onClick={() => { setTheme('theme-light'); setModalOpen(null); setMenuOpen(false); }}
          >
            Clean Light
          </button>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ backgroundColor: '#1B4D3E', color: '#FFF', border: theme === 'theme-felt' ? '2px solid #FFD700' : 'none' }}
            onClick={() => { setTheme('theme-felt'); setModalOpen(null); setMenuOpen(false); }}
          >
            Casino Felt
          </button>
          <button 
            className={`md-card ${styles.setCard}`} 
            style={{ backgroundColor: '#090B10', color: '#DFE0FF', border: theme === 'theme-midnight' ? '2px solid #8E99F3' : 'none' }}
            onClick={() => { setTheme('theme-midnight'); setModalOpen(null); setMenuOpen(false); }}
          >
            Midnight
          </button>
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

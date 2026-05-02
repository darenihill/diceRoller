import { useEffect, useState } from 'react';
import LZString from 'lz-string';
import styles from './App.module.css';
import { useDiceState } from './hooks/useDiceState';
import { useStorage } from './hooks/useStorage';
import { Dice } from './components/Dice';
import { ActionBar } from './components/ActionBar';
import { SidebarMenu } from './components/SidebarMenu';
import { Modal } from './components/Modal';
import { DiceSettingsModal } from './components/DiceSettingsModal';
import { AnimationLab } from './components/AnimationLab';
import { dicePresets } from './utils/presets';
import { generateId } from './utils/diceUtils';
import { Trash2 } from 'lucide-react';

function App() {
  const {
    diceList, setDiceList, rollHistory, isRolling,
    addDice, removeDice, updateDice, toggleHold, toggleHoldAll,
    clearAllDice, rollDice, clearHistory
  } = useDiceState();

  const { savedConfigs, saveConfig, deleteConfig, getSystemAutosave } = useStorage();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editingDiceId, setEditingDiceId] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'theme-dark');
  
  // Modals state
  const [modalOpen, setModalOpen] = useState<'help' | 'history' | 'sets' | 'themes' | null>(null);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('appTheme', theme);
  }, [theme]);

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

    const autosave = getSystemAutosave();
    if (autosave && autosave.config.length > 0) {
      setDiceList(autosave.config.map(d => ({ ...d, id: generateId() })));
    }
  }, [getSystemAutosave, setDiceList]);

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
  const diceStyles = {
    '--dice-size': diceCount <= 2 ? '55vmin' : diceCount <= 6 ? '38vmin' : '28vmin',
    '--dice-gap': diceCount <= 2 ? '4vmin' : diceCount <= 6 ? '3vmin' : '2vmin'
  } as React.CSSProperties;

  const handleSave = () => {
    const name = window.prompt('Enter a name for this set:');
    if (name && name.trim()) {
      saveConfig(name.trim(), diceList);
      alert('Saved!');
      setMenuOpen(false);
    }
  };

  const handleLoadSet = (config: any) => {
    setDiceList(config.map((d: any) => ({ ...d, id: generateId() })));
    setModalOpen(null);
    setMenuOpen(false);
  };

  const handleDeleteAll = () => {
    if (window.confirm('Delete All Dice?')) {
      clearAllDice();
      setMenuOpen(false);
    }
  };

  const handleShare = () => {
    const json = JSON.stringify(diceList);
    const compressed = LZString.compressToEncodedURIComponent(json);
    const url = `${window.location.origin}${window.location.pathname}#share=${compressed}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        alert("Share link copied to clipboard!");
      }).catch(err => {
        console.error("Failed to copy link: ", err);
        window.prompt("Copy this link to share:", url);
      });
    } else {
      window.prompt("Copy this link to share:", url);
    }
    setMenuOpen(false);
  };

  return (
    <div className={styles.app}>
      <AnimationLab />
      <div className={styles.diceContainer} style={diceStyles}>
        {diceList.map((dice) => (
          <Dice
            key={dice.id}
            dice={dice}
            isRolling={isRolling}
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
        onIdeas={() => window.open('https://docs.google.com/forms/d/1MurbBtETb6e9JmkThO_Apuc9lowJcDPHpCcPNIhbPpg/prefill', '_blank')}
        onHelp={() => setModalOpen('help')}
        onHistory={() => setModalOpen('history')}
        onSets={() => setModalOpen('sets')}
        onThemes={() => setModalOpen('themes')}
        onDeleteAll={handleDeleteAll}
        onSave={handleSave}
        onLoad={() => setModalOpen('sets')}
        onShare={handleShare}
      />

      <ActionBar
        onAdd={addDice}
        onRoll={rollDice}
        onHoldAll={toggleHoldAll}
        allHeld={allHeld}
        totalVisible={totalVisible}
        lastTotal={lastTotal}
      />

      {/* Help Modal */}
      <Modal isOpen={modalOpen === 'help'} onClose={() => setModalOpen(null)} title="Help">
        <ul className={styles.helpList}>
          <li><strong>Settings:</strong> Click the gear icon on a die to set custom faces, numbers, and colors.</li>
          <li><strong>Sets/Saves:</strong> Load presets or your own saved setups from the Sets/Load menu.</li>
          <li><strong>Hold/Release:</strong> Click the body of a die to hold it, or use the lock button to hold all.</li>
        </ul>
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

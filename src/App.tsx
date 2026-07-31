import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import LZString from 'lz-string';
import styles from './App.module.css';
import { useDiceState } from './hooks/useDiceState';
import { useStorage } from './hooks/useStorage';
import { Dice } from './components/Dice';
import { ActionBar } from './components/ActionBar';
import { SidebarMenu } from './components/SidebarMenu';
import { DiceSettingsModal } from './components/DiceSettingsModal';
import { generateId, calculateGridDimensions } from './utils/diceUtils';
import { playRollSequence } from './utils/soundEffects';
import { recordSessionStart, trackEvent, setTelemetryEnabled } from './utils/analytics';
import type { DiceData } from './types';

// Decomposed Modals
import { HelpModal } from './components/modals/HelpModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { SetsModal } from './components/modals/SetsModal';
import { CustomizeModal } from './components/modals/CustomizeModal';
import { SaveDialog } from './components/modals/SaveDialog';
import { ConfirmDialog } from './components/modals/ConfirmDialog';
import { ShareModal } from './components/modals/ShareModal';

function App() {
  const {
    diceList, setDiceList, rollHistory, isRolling, modifier, setModifier,
    rpgMode, toggleRpgMode, rollAdvantage, setRollAdvantage,
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

  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('soundEnabled') === 'true');

  useEffect(() => {
    localStorage.setItem('soundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  const [telemetryState, setTelemetryState] = useState(() => localStorage.getItem('telemetryEnabled') !== 'false');

  const soundTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = soundTimersRef.current;
    return () => {
      timers.forEach(timerId => clearTimeout(timerId));
    };
  }, []);

  // Modals state
  const [modalOpen, setModalOpen] = useState<'help' | 'history' | 'sets' | 'customize' | null>(null);

  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-felt', 'theme-midnight');
    document.body.classList.add(theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
  }, [menuOpen]);

  // Auto-deselect active die on mobile after 5 seconds
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

  // Load shared config from URL, default set, or autosave on mount & record session telemetry
  useEffect(() => {
    recordSessionStart();

    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const compressed = hash.replace('#share=', '');
        const json = LZString.decompressFromEncodedURIComponent(compressed);
        if (json) {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed)) {
            setDiceList(parsed.map((d: DiceData) => ({ ...d, id: generateId() })));
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
      return;
    }

    // Default to 2 basic dice if the app has never been used
    setDiceList([
      {
        id: generateId(),
        numberValue: 1,
        faces: 6,
        currentFaceIndex: 0,
        name: '',
        customFaces: [],
        color: '#E9EAEC',
        held: false
      },
      {
        id: generateId(),
        numberValue: 1,
        faces: 6,
        currentFaceIndex: 0,
        name: '',
        customFaces: [],
        color: '#E9EAEC',
        held: false
      }
    ]);
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

  // Dice Size & Grid layout calculations
  const { optimalSize, optimalColumns, dynamicGap } = calculateGridDimensions(
    diceList.length,
    containerSize.width,
    containerSize.height
  );

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
      trackEvent('preset_saved', { name: saveName.trim(), diceCount: diceList.length });
      showToast('Saved!');
      setSavePromptOpen(false);
    }
  };

  const handleLoadSet = (config: Partial<DiceData>[], presetName?: string) => {
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
    if (presetName) {
      trackEvent('preset_loaded', { presetName });
    }
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
    
    trackEvent('share_link_copied', { diceCount: diceList.length });

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
        soundEnabled: localStorage.getItem('soundEnabled') === 'true'
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diceroller_backup.json`;
      link.click();
      URL.revokeObjectURL(url);
      trackEvent('backup_exported');
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
          
          trackEvent('backup_imported');
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

  const handleAddDice = (template?: Partial<DiceData>) => {
    addDice(template);
    trackEvent('dice_added');
  };

  const handleSelectTheme = (newTheme: string) => {
    setTheme(newTheme);
    trackEvent('theme_changed', { theme: newTheme });
  };

  const handleToggleTelemetry = () => {
    const nextState = !telemetryState;
    setTelemetryState(nextState);
    setTelemetryEnabled(nextState);
  };

  return (
    <div className={styles.app} style={{ paddingBottom: rpgMode ? '360px' : '110px' }}>
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
            onClone={handleAddDice}
            rpgMode={rpgMode}
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
        rpgMode={rpgMode}
        onToggleRpgMode={toggleRpgMode}
      />

      <ActionBar
        onAdd={handleAddDice}
        onRoll={() => {
          const hasUnheldDice = diceList.some(d => !d.held);
          rollDice();
          
          if (hasUnheldDice && diceList.length > 0) {
            const unheldCount = diceList.filter(d => !d.held).length;
            trackEvent('roll_dice', { diceCount: unheldCount, modifier, rpgMode, rollAdvantage });
            if (soundEnabled) {
              playRollSequence(soundTimersRef);
            }
          }
        }}
        onHoldAll={toggleHoldAll}
        allHeld={allHeld}
        totalVisible={totalVisible}
        lastTotal={lastTotal}
        modifier={modifier}
        onChangeModifier={setModifier}
        rpgMode={rpgMode}
        rollAdvantage={rollAdvantage}
        onChangeRollAdvantage={setRollAdvantage}
      />

      {/* Decomposed Modals & Dialogs */}
      <HelpModal 
        isOpen={modalOpen === 'help'} 
        onClose={() => setModalOpen(null)} 
      />

      <HistoryModal 
        isOpen={modalOpen === 'history'} 
        onClose={() => setModalOpen(null)} 
        rollHistory={rollHistory}
        onClearHistory={clearHistory}
      />

      <SetsModal 
        isOpen={modalOpen === 'sets'} 
        onClose={() => setModalOpen(null)} 
        savedConfigs={savedConfigs}
        onLoadSet={(config) => handleLoadSet(config)}
        onDeleteConfig={deleteConfig}
        onExportBackup={handleExportData}
        onImportBackup={handleImportData}
      />

      <CustomizeModal 
        isOpen={modalOpen === 'customize'} 
        onClose={() => setModalOpen(null)} 
        theme={theme}
        onSelectTheme={handleSelectTheme}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          trackEvent('sound_toggled', { enabled: next });
        }}
        showModifier={showModifier}
        onToggleModifier={() => {
          const next = !showModifier;
          setShowModifier(next);
          trackEvent('modifier_toggled', { enabled: next });
        }}
        telemetryEnabled={telemetryState}
        onToggleTelemetry={handleToggleTelemetry}
      />

      <SaveDialog 
        isOpen={savePromptOpen} 
        onClose={() => setSavePromptOpen(false)} 
        saveName={saveName}
        onChangeSaveName={setSaveName}
        onSave={executeSave}
      />

      <ConfirmDialog 
        isOpen={confirmDeleteOpen} 
        onClose={() => setConfirmDeleteOpen(false)} 
        onConfirm={executeDeleteAll}
      />

      <ShareModal 
        url={shareFallbackUrl} 
        onClose={() => setShareFallbackUrl(null)} 
      />

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
          onClone={handleAddDice}
        />
      )}
    </div>
  );
}

export default App;

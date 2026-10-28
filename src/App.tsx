import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import LZString from 'lz-string';
import styles from './App.module.css';
import { useDiceState } from './hooks/useDiceState';
import { useStorage } from './hooks/useStorage';
import { Dice } from './components/Dice';
import { ActionBar } from './components/ActionBar';
import { TypeRollBox } from './components/TypeRollBox';
import { TYPED_DIE_COLOR, type TypedRoll } from './utils/rollNotation';
import { SidebarMenu } from './components/SidebarMenu';
import { DiceSettingsModal } from './components/DiceSettingsModal';
import { generateId, calculateGridDimensions, scaleGridDimensions, sanitizeDiceScale, sanitizeDiceList, withoutFaceImages } from './utils/diceUtils';
import { usedFaceImages, importFaceImages } from './utils/faceImages';
import { playRollSequence } from './utils/soundEffects';
import { recordSessionStart, trackEvent, setTelemetryEnabled } from './utils/analytics';
import { MAX_HISTORY_LENGTH } from './utils/constants';
import { dicePresets } from './utils/presets';
import { currentSetName, diceSignature, readShareLink, nextFreeSaveName, type LoadedSet } from './utils/setName';
import { readLandingStart, readLandingAbout } from './utils/landing';
import { Info, Plus, Dice6 } from 'lucide-react';
import { Modal } from './components/Modal';
import type { DiceData } from './types';

// Decomposed Modals
import { HelpModal } from './components/modals/HelpModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { SetsModal } from './components/modals/SetsModal';
import { CustomizeModal } from './components/modals/CustomizeModal';
import { createShakeDetector, requestMotionPermission, sampleFromEvent } from './utils/shake';
import { SaveDialog } from './components/modals/SaveDialog';
import { useUndo, dieLabel } from './hooks/useUndo';
import { spokenTotal } from './utils/totalMath';
import { ShareModal } from './components/modals/ShareModal';
import { StatsModal } from './components/modals/StatsModal';
import { saveItem, onSaveRefused } from './utils/safeStorage';

function App() {
  const {
    diceList, setDiceList, rollHistory, isRolling, rollingId, modifier, setModifier,
    rpgMode, toggleRpgMode, rollAdvantage, setRollAdvantage,
    targetHighlight, setTargetHighlight,
    addDice, removeDice, updateDice, toggleHold, toggleHoldAll,
    clearAllDice, rollDice, clearHistory, toast, showToast, insertDiceAt, restoreDice
  } = useDiceState();
  const { offer: undoOffer, offerUndo, runUndo } = useUndo();

  // Storage full: a save was refused, so say so and offer a backup
  const [storageFull, setStorageFull] = useState(false);
  useEffect(() => onSaveRefused(() => setStorageFull(true)), []);

  const containerRef = useRef<HTMLDivElement>(null);
  // A search landing page opens with its own dice; null on the home page
  const [landing] = useState(readLandingStart);
  const [landingAbout] = useState(readLandingAbout);
  
  // Roll history persists across reloads, but the roll button should read "Roll"
  // on every fresh load and only show a total once a roll happens this session.
  const [hasRolledThisSession, setHasRolledThisSession] = useState(false);

  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
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
  // The set last loaded by name (a save or a named share link); built-in games are also recognised by their dice
  const [loadedSet, setLoadedSet] = useState<LoadedSet | null>(() => {
    // A named share link opens with its name; read before the mount effect clears the hash
    if (window.location.hash.startsWith('#share=')) {
      const { dice, name } = readShareLink(window.location.hash);
      return name && dice.length > 0 ? { name, signature: diceSignature(dice) } : null;
    }
    return landing?.name ? { name: landing.name, signature: diceSignature(landing.dice) } : null;
  });
  const [editingDiceId, setEditingDiceId] = useState<string | null>(null);
  const [revealedDiceId, setRevealedDiceId] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'theme-dark');
  
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('soundEnabled') === 'true');
  const [diceScale, setDiceScale] = useState(() => sanitizeDiceScale(localStorage.getItem('diceScale')));

  useEffect(() => {
    saveItem('diceScale', String(diceScale));
  }, [diceScale]);

  useEffect(() => {
    saveItem('soundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  const [shakeEnabled, setShakeEnabled] = useState(() => localStorage.getItem('shakeToRoll') === 'true');
  useEffect(() => {
    saveItem('shakeToRoll', String(shakeEnabled));
  }, [shakeEnabled]);

  const [telemetryState, setTelemetryState] = useState(() => localStorage.getItem('telemetryEnabled') !== 'false');

  const soundTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = soundTimersRef.current;
    return () => {
      timers.forEach(timerId => clearTimeout(timerId));
    };
  }, []);

  // Modals state
  const [modalOpen, setModalOpen] = useState<'help' | 'history' | 'sets' | 'customize' | 'stats' | 'about' | null>(null);

  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-felt', 'theme-midnight');
    document.body.classList.add(theme);
    saveItem('appTheme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
  }, [menuOpen]);

  // Expose RPG mode to CSS so mobile layout can reserve room for the taller FAB stack
  useEffect(() => {
    document.body.classList.toggle('rpg-mode', rpgMode);
  }, [rpgMode]);

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
      // A share link is a hand-craftable URL, so treat the payload as untrusted
      // and always tell the recipient when it cannot be read — previously a
      // malformed link silently fell through to the default dice.
      const shared = readShareLink(hash).dice;

      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      if (shared.length > 0) {
        setDiceList(shared);
        return;
      }
      showToast("That share link couldn't be read — loading your usual dice instead.");
    }

    // A landing page opens with its game, ahead of the visitor's usual dice
    if (landing) {
      setDiceList(landing.dice);
      // Match the page either way, so a D&D visit doesn't leave RPG mode on for Catan
      if (landing.rpg !== rpgMode) toggleRpgMode();
      return;
    }

    const defaultSet = localStorage.getItem('defaultDiceSet');
    if (defaultSet) {
      try {
        const parsed = sanitizeDiceList(JSON.parse(defaultSet));
        if (parsed.length > 0) {
          setDiceList(parsed);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const autosave = getSystemAutosave();
    if (autosave) {
      const restored = sanitizeDiceList(autosave.config);
      if (restored.length > 0) {
        setDiceList(restored);
        return;
      }
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

  // Save autosave when the page is hidden or unloading. `pagehide` and
  // `visibilitychange` fire reliably on mobile where `beforeunload` often doesn't.
  useEffect(() => {
    const handleUnload = () => {
      saveConfig('systemAutosave', diceList);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleUnload();
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [diceList, saveConfig]);

  // Derived state
  const allHeld = diceList.length > 0 && diceList.every(d => d.held);
  const totalVisible = hasRolledThisSession && rollHistory.length > 0;
  // A die rolled on its own never replaces the big total
  const lastMainRoll = rollHistory.find(r => !r.single);
  const lastTotal = totalVisible && lastMainRoll ? lastMainRoll.total : 0;
  const lastModifier = totalVisible && lastMainRoll ? lastMainRoll.modifier ?? 0 : 0;
  const setName = currentSetName(diceList, loadedSet);

  // Dice Size & Grid layout calculations
  const { optimalSize, optimalColumns, dynamicGap } = scaleGridDimensions(
    calculateGridDimensions(diceList.length, containerSize.width, containerSize.height),
    diceList.length,
    containerSize.width,
    containerSize.height,
    diceScale
  );

  const diceStyles = {
    '--dice-size': `${optimalSize}px`,
    '--dice-columns': optimalColumns,
    '--dice-gap': `${dynamicGap}px`
  } as React.CSSProperties;

  // The typed name stays until it is saved or cleared, so tapping away loses nothing
  const handleSave = () => {
    setSavePromptOpen(true);
    setMenuOpen(false);
  };

  const userSaveNames = Object.keys(savedConfigs).filter(n => n !== 'systemAutosave');

  const executeSave = (mode: 'new' | 'keepBoth' | 'replace') => {
    const typed = saveName.trim();
    if (!typed) return;
    // A taken name is never overwritten without "Replace it"
    const name = mode === 'keepBoth' || (mode === 'new' && userSaveNames.includes(typed))
      ? nextFreeSaveName(typed, userSaveNames)
      : typed;
    saveConfig(name, diceList);
    // The save's name is the user's own text, so only the dice count goes to analytics
    trackEvent('preset_saved', { diceCount: diceList.length });
    showToast(name === typed ? (mode === 'replace' ? `Replaced ${name}` : 'Saved!') : `Saved as ${name}`);
    setSaveName('');
    setSavePromptOpen(false);
  };

  const handleLoadSet = (config: Partial<DiceData>[], setName?: string) => {
    const loaded = sanitizeDiceList(config);
    setDiceList(loaded);
    setLoadedSet(setName ? { name: setName, signature: diceSignature(loaded) } : null);
    if (setName) {
      // Only built-in preset names go to analytics; a save's name is the user's own text
      if (dicePresets.some(p => p.name === setName)) {
        trackEvent('preset_loaded', { presetName: setName });
      }
      // The main screen never names the set, so say which one just loaded
      showToast(`Loaded ${setName}`);
    }
    setModalOpen(null);
    setMenuOpen(false);
  };

  const handleSetDefault = () => {
    // A refused save shows the storage-full message instead of a false "Saved"
    if (saveItem('defaultDiceSet', JSON.stringify(diceList))) {
      showToast('Saved as default! It will automatically load on open.');
    }
    setMenuOpen(false);
  };

  // Clear All needs no confirm: Undo brings every die back for five seconds
  const handleDeleteAll = () => {
    setMenuOpen(false);
    if (diceList.length === 0) return;
    const removed = diceList;
    clearAllDice();
    try {
      const stored = localStorage.getItem('diceConfigs');
      if (stored) {
        const parsed = JSON.parse(stored);
        delete parsed['systemAutosave'];
        saveItem('diceConfigs', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error(e);
    }
    offerUndo(`Cleared ${removed.length} ${removed.length === 1 ? 'die' : 'dice'}`, () => restoreDice(removed));
  };

  const handleRemoveDie = (id: string) => {
    const index = diceList.findIndex(d => d.id === id);
    if (index < 0) return;
    const die = diceList[index];
    removeDice(id);
    offerUndo(`Removed ${dieLabel(die)}`, () => insertDiceAt(die, index));
  };

  const handleDeleteSave = (name: string) => {
    const saved = savedConfigs[name];
    deleteConfig(name);
    if (saved) offerUndo(`Deleted ${name}`, () => saveConfig(name, saved.config));
  };

  const handleShare = () => {
    // Pictures stay on this device; the link carries each picture face's text
    const json = JSON.stringify(withoutFaceImages(diceList));
    const compressed = LZString.compressToEncodedURIComponent(json);
    // A named set travels with the link, so the person opening it sees the game's name
    const nameParam = setName ? `&name=${encodeURIComponent(setName)}` : '';
    const url = `${window.location.origin}${window.location.pathname}#share=${compressed}${nameParam}`;
    
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
        soundEnabled: localStorage.getItem('soundEnabled') === 'true',
        diceScale: sanitizeDiceScale(localStorage.getItem('diceScale')),
        // Only pictures a face still names, on screen or in a saved set
        faceImages: usedFaceImages(diceList)
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
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Sanitize every dice list inside the backup before it reaches storage
          if (data.configs && typeof data.configs === 'object') {
            for (const key of Object.keys(data.configs)) {
              const entry = data.configs[key];
              if (entry && typeof entry === 'object') {
                entry.config = sanitizeDiceList(entry.config);
              } else {
                delete data.configs[key];
              }
            }
          }
          if (data.defaultSet) {
            data.defaultSet = sanitizeDiceList(data.defaultSet);
          }
          // A backup that doesn't fit stops here: no reload, no false "Imported"
          let fits = true;
          const keep = (key: string, value: string) => { fits = saveItem(key, value) && fits; };
          if (data.configs) {
            const currentConfigs = JSON.parse(localStorage.getItem('diceConfigs') || '{}');
            const mergedConfigs = { ...currentConfigs, ...data.configs };
            keep('diceConfigs', JSON.stringify(mergedConfigs));
          }
          if (data.defaultSet) {
            keep('defaultDiceSet', JSON.stringify(data.defaultSet));
          }
          if (Array.isArray(data.rollHistory)) {
            keep('rollHistory', JSON.stringify(data.rollHistory.slice(0, MAX_HISTORY_LENGTH)));
          }
          if (data.theme) {
            keep('appTheme', data.theme);
          }
          if (data.soundEnabled !== undefined) {
            keep('soundEnabled', String(data.soundEnabled));
          }
          // Older backups have no dice size; they import at the default
          keep('diceScale', String(sanitizeDiceScale(data.diceScale)));
          // Pictures on faces; older backups have none
          if (data.faceImages && !importFaceImages(data.faceImages)) {
            showToast('Imported, but some pictures did not fit on this device. Reloading...');
            setTimeout(() => window.location.reload(), 1500);
            return;
          }
          if (!fits) return;

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

  // A typed roll swaps in its own dice, modifier and advantage and rolls them;
  // Undo puts back the dice and settings that were out before
  const handleTypedRoll = (roll: TypedRoll) => {
    const before = { dice: diceList, modifier, advantage: rollAdvantage };
    const dice = roll.groups.flatMap(g => Array.from({ length: g.count }, () => ({
      id: generateId(),
      numberValue: 1,
      faces: g.faces,
      currentFaceIndex: 0,
      name: `d${g.faces}`,
      customFaces: [],
      color: TYPED_DIE_COLOR,
      held: false
    })));
    setModifier(roll.modifier);
    setRollAdvantage(roll.advantage);
    rollDice(({ total, diceCount }) => {
      setHasRolledThisSession(true);
      trackEvent('roll_dice', { diceCount, sum: total, modifier: roll.modifier, rpgMode, rollAdvantage: roll.advantage, typed: true });
    }, undefined, { text: roll.text, dice, modifier: roll.modifier, advantage: roll.advantage });
    if (soundEnabled) playRollSequence(soundTimersRef);
    if (before.dice.length > 0) {
      offerUndo(`Rolled ${roll.text}`, () => {
        restoreDice(before.dice);
        setModifier(before.modifier);
        setRollAdvantage(before.advantage);
      });
    }
  };

  const handleRollOne = (id: string) => {
    rollDice(() => trackEvent('roll_one_die'), id);
    if (soundEnabled) playRollSequence(soundTimersRef);
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

  const handleRoll = () => {
    const hasUnheldDice = diceList.some(d => !d.held);
    rollDice(({ total, diceCount }) => {
      // Fires when the roll resolves, so the actual total reaches analytics
      setHasRolledThisSession(true);
      if (diceCount > 0) {
        trackEvent('roll_dice', { diceCount, sum: total, modifier, rpgMode, rollAdvantage });
      }
    });

    if (hasUnheldDice && diceList.length > 0 && soundEnabled) {
      playRollSequence(soundTimersRef);
    }
  };

  // Shake to roll: the latest roll handler, read by the motion listener
  const handleRollRef = useRef(handleRoll);
  const modalOpenRef = useRef(modalOpen);
  useEffect(() => {
    handleRollRef.current = handleRoll;
    modalOpenRef.current = modalOpen;
  });

  useEffect(() => {
    if (!shakeEnabled || typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;
    const isShake = createShakeDetector();
    const onMotion = (e: DeviceMotionEvent) => {
      const sample = sampleFromEvent(e);
      // A shake rolls only from the main screen, never under an open dialog
      if (sample && isShake(sample) && !modalOpenRef.current) {
        handleRollRef.current();
        trackEvent('shake_roll');
      }
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [shakeEnabled]);

  const handleToggleShake = async () => {
    if (shakeEnabled) {
      setShakeEnabled(false);
      trackEvent('shake_toggled', { enabled: false });
      return;
    }
    const permission = await requestMotionPermission();
    if (permission === 'granted') {
      setShakeEnabled(true);
      trackEvent('shake_toggled', { enabled: true });
      showToast('Shake to roll is on. Shake your phone to roll.');
    } else if (permission === 'denied') {
      showToast('Motion access was turned down, so shake to roll stays off.');
    } else {
      showToast("This device can't sense shaking, so shake to roll stays off.");
    }
  };

  return (
    <div className={styles.app} style={{ paddingBottom: '120px' }}>
      {/* The UI is all dice and icons, so the document had no heading at all —
          a screen reader landed on an unnamed page, and a crawler found nothing
          to index. Hidden rather than drawn, since the dice are the interface. */}
      <h1 className={styles.srOnly}>{landing?.heading ? `${landing.heading} — Custom Dice Roller` : 'Custom Dice Roller — build and roll any dice online'}</h1>

      {/* A slim top line, so a shared link says which app it opened and which game is loaded */}
      <header className={styles.topLine}>
        <span className={styles.appName} aria-hidden="true">Dice Roller</span>
        {setName && (
          <span className={styles.setChip} title={setName}>
            <span className={styles.srOnly}>Loaded game: </span>{setName}
          </span>
        )}
        {landingAbout && (
          <button className={styles.aboutButton} onClick={() => setModalOpen('about')} aria-label="About" title="About">
            <Info size={20} aria-hidden="true" />
            <span className={styles.aboutLabel}>About</span>
          </button>
        )}
      </header>

      {rpgMode && <TypeRollBox onRoll={handleTypedRoll} disabled={isRolling} />}

      <div ref={containerRef} className={styles.diceContainer} style={diceStyles}>
        {diceList.map((dice) => (
          <Dice
            key={dice.id}
            dice={dice}
            isRolling={isRolling && (rollingId === null || rollingId === dice.id)}
            isRevealed={revealedDiceId === dice.id}
            onReveal={() => setRevealedDiceId(dice.id)}
            onToggleHold={toggleHold}
            onRemove={handleRemoveDie}
            onOpenSettings={setEditingDiceId}
            onClone={handleAddDice}
            onRollOne={isRolling ? undefined : handleRollOne}
            rollingAlone={rollingId === dice.id}
            rpgMode={rpgMode}
          />
        ))}
      </div>

      {/* With no dice, the middle of the screen says what to do next */}
      {diceList.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No dice yet</p>
          <div className={styles.emptyActions}>
            <button className="md-button md-button-filled" onClick={() => handleAddDice()}>
              <Plus size={18} aria-hidden="true" /> Add die
            </button>
            <button className="md-button md-button-surface" onClick={() => setModalOpen('sets')}>
              <Dice6 size={18} aria-hidden="true" /> Games
            </button>
          </div>
        </div>
      )}

      <SidebarMenu
        isOpen={menuOpen}
        onToggle={() => setMenuOpen(!menuOpen)}
        onDonate={() => window.open('https://www.buymeacoffee.com/darenihill', '_blank')}
        onIdeas={() => window.open('https://forms.gle/wqYaKsEZ5FQwizuMA', '_blank')}
        onHelp={() => setModalOpen('help')}
        onHistory={() => setModalOpen('history')}
        onStats={() => setModalOpen('stats')}
        onSets={() => setModalOpen('sets')}
        onCustomize={() => setModalOpen('customize')}
        onDeleteAll={handleDeleteAll}
        onSave={handleSave}
        onShare={handleShare}
        onSetDefault={handleSetDefault}
        rpgMode={rpgMode}
        onToggleRpgMode={toggleRpgMode}
      />

      <ActionBar
        onAdd={handleAddDice}
        onRoll={handleRoll}
        onHoldAll={toggleHoldAll}
        allHeld={allHeld}
        totalVisible={totalVisible}
        lastTotal={lastTotal}
        lastModifier={lastModifier}
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

      {landingAbout && (
        <Modal isOpen={modalOpen === 'about'} onClose={() => setModalOpen(null)} title={landing?.heading ?? 'About'}>
          {/* The landing page's own static writing, copied from its HTML */}
          <div className="landing-about" dangerouslySetInnerHTML={{ __html: landingAbout }} />
        </Modal>
      )}

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
        onLoadSet={handleLoadSet}
        onDeleteConfig={handleDeleteSave}
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
        targetHighlight={targetHighlight}
        onChangeTargetHighlight={setTargetHighlight}
        telemetryEnabled={telemetryState}
        onToggleTelemetry={handleToggleTelemetry}
        diceScale={diceScale}
        onChangeDiceScale={setDiceScale}
        shakeEnabled={shakeEnabled}
        onToggleShake={handleToggleShake}
      />

      <SaveDialog 
        isOpen={savePromptOpen} 
        onClose={() => setSavePromptOpen(false)} 
        saveName={saveName}
        onChangeSaveName={setSaveName}
        existingNames={userSaveNames}
        onSave={executeSave}
      />

      <ShareModal
        url={shareFallbackUrl}
        onClose={() => setShareFallbackUrl(null)}
      />

      <StatsModal
        isOpen={modalOpen === 'stats'}
        onClose={() => setModalOpen(null)}
      />

      {/* Toast Notification */}
      {storageFull ? (
        <div className={`${styles.toast} ${styles.undoToast} ${styles.storageToast} ${rpgMode ? styles.toastBelowBox : ''}`} role="alert">
          <span>Storage is full, so your last change wasn't saved.</span>
          <button className={styles.undoButton} onClick={() => { setStorageFull(false); handleExportData(); }}>Export backup</button>
          <button className={styles.undoButton} onClick={() => setStorageFull(false)} aria-label="Close storage message" style={{ minWidth: 44 }}>✕</button>
        </div>
      ) : undoOffer ? (
        <div className={`${styles.toast} ${styles.undoToast} ${rpgMode ? styles.toastBelowBox : ''}`} role="status">
          <span>{undoOffer.message}</span>
          <button className={styles.undoButton} onClick={runUndo}>Undo</button>
        </div>
      ) : toast && (
        <div className={`${styles.toast} ${rpgMode ? styles.toastBelowBox : ''}`}>
          {toast}
        </div>
      )}

      {/* Screen-reader announcement of roll results */}
      <div aria-live="polite" className={styles.srOnly}>
        {totalVisible && !isRolling ? spokenTotal(lastTotal, lastModifier) : ''}
      </div>

      {/* Dice Settings Modal */}
      {editingDiceId && (
        <DiceSettingsModal 
          dice={diceList.find(d => d.id === editingDiceId)!}
          isOpen={!!editingDiceId}
          onClose={() => setEditingDiceId(null)}
          onUpdate={updateDice}
          onRemove={handleRemoveDie}
          onClone={handleAddDice}
          allDice={diceList}
        />
      )}
    </div>
  );
}

export default App;

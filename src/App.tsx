import { useCallback, useEffect, useState, useRef, useLayoutEffect } from 'react';
import LZString from 'lz-string';
import styles from './App.module.css';
import { useDiceState } from './hooks/useDiceState';
import { useRollKeys } from './hooks/useRollKeys';
import { useStorage } from './hooks/useStorage';
import { Dice, type GlideOrigin } from './components/Dice';
import { ActionBar } from './components/ActionBar';
import { TypeRollBox } from './components/TypeRollBox';
import { loadSavedRolls, withSavedRoll, SAVED_ROLLS_KEY, MAX_SAVED_ROLLS, type SavedRoll } from './utils/savedRolls';
import { TYPED_DIE_COLOR, type TypedRoll } from './utils/rollNotation';
import { SidebarMenu } from './components/SidebarMenu';
import { DiceSettingsModal } from './components/DiceSettingsModal';
import { generateId, calculateGridDimensions, scaleGridDimensions, sanitizeDiceScale, sanitizeDiceList, withoutFaceImages, parseFaceContent, faceScores } from './utils/diceUtils';
import { DieActionStrip } from './components/DieActionStrip';
import { playRollSequence, playLandNow, scheduleLandingBuzz } from './utils/soundEffects';
import { BUZZ_KEY, BUZZ_SHOWN_KEY, canBuzz, isBuzzLink } from './utils/buzz';
import { celebrateNatural20 } from './utils/confetti';
import { recordSessionStart, trackEvent, setTelemetryEnabled } from './utils/analytics';
import { COMPACT_DIE_SIZE } from './utils/constants';
import { dicePresets } from './utils/presets';
import { currentSetName, diceSignature, rollSignature, readShareLink, nextFreeSaveName, type LoadedSet } from './utils/setName';
import { readLandingStart, readLandingAbout } from './utils/landing';
import { Info, Plus, Dice6, Table2, Swords } from 'lucide-react';
import { Modal } from './components/Modal';
import type { DiceData } from './types';

// Decomposed Modals
import { HelpModal } from './components/modals/HelpModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { SetsModal } from './components/modals/SetsModal';
import { CustomizeModal } from './components/modals/CustomizeModal';
import { createShakeDetector, requestMotionPermission, sampleFromEvent } from './utils/shake';
import { SaveDialog } from './components/modals/SaveDialog';
import { InstallModal } from './components/modals/InstallModal';
import { useInstallApp } from './hooks/useInstallApp';
import { useUndo, dieLabel, UNDO_WINDOW_MS } from './hooks/useUndo';
import { UndoBar } from './components/UndoBar';
import { spokenTotal } from './utils/totalMath';
import { ShareModal } from './components/modals/ShareModal';
import { StatsModal } from './components/modals/StatsModal';
import { TableView } from './components/TableView';
import { tableTiles, tableMath } from './utils/tableView';
import { gameKeyOf } from './utils/rollGroups';
import { saveItem, onSaveRefused, readItem } from './utils/safeStorage';
import { useWakeLock } from './hooks/useWakeLock';
import { useNewVersion } from './hooks/useNewVersion';
import { SAVED } from './utils/savedValues';
import { buildBackup, restoreBackup } from './utils/backup';

/** The themes the app ships; anything else in storage falls back to dark. */
const THEMES = ['theme-dark', 'theme-light', 'theme-felt', 'theme-midnight'];

function App() {
  // A phone on the game table stays awake between turns
  useWakeLock();
  const newVersion = useNewVersion();
  const {
    diceList, setDiceList, rollHistory, isRolling, rollingId, modifier, setModifier,
    rpgMode, toggleRpgMode, rollAdvantage, setRollAdvantage,
    targetHighlight, setTargetHighlight,
    addDice, removeDice, updateDice, toggleHold, toggleHoldAll,
    clearAllDice, rollDice, clearHistory, restoreHistory, toast, showToast, insertDiceAt, restoreDice, gameNameRef
  } = useDiceState();
  const { offer: undoOffer, offerUndo, runUndo: takeBack, dismiss: dismissUndo, pause: pauseUndo, resume: resumeUndo, paused: undoPaused } = useUndo();
  // Undo says what came back ("d20 is back"), as the standard asks
  const runUndo = () => {
    const back = takeBack();
    if (back) showToast(back);
  };

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
  // Only a known theme reaches the page's class list; a backup file could hold anything
  const [theme, setTheme] = useState(() => {
    const saved = readItem(SAVED.theme);
    return saved && THEMES.includes(saved) ? saved : 'theme-dark';
  });
  
  // The dice a finished roll used, so the Roll button can tell when they change
  const [rolledSignature, setRolledSignature] = useState<string | null>(null);
  const latestDiceRef = useRef<DiceData[]>([]);
  useEffect(() => { latestDiceRef.current = diceList; }, [diceList]);
  const [soundEnabled, setSoundEnabled] = useState(() => readItem(SAVED.sound) === 'true');
  const [diceScale, setDiceScale] = useState(() => sanitizeDiceScale(readItem(SAVED.diceScale)));

  useEffect(() => {
    saveItem(SAVED.diceScale, String(diceScale));
  }, [diceScale]);

  useEffect(() => {
    saveItem(SAVED.sound, String(soundEnabled));
  }, [soundEnabled]);

  const [shakeEnabled, setShakeEnabled] = useState(() => readItem(SAVED.shakeToRoll) === 'true');
  useEffect(() => {
    saveItem(SAVED.shakeToRoll, String(shakeEnabled));
  }, [shakeEnabled]);

  // Table view: each roll shows its total big for everyone at the table
  const [tableView, setTableView] = useState(() => readItem(SAVED.tableView) === 'true');
  useEffect(() => {
    saveItem(SAVED.tableView, String(tableView));
  }, [tableView]);
  // The roll whose big view was tapped away; the next roll shows big again
  const [tableDismissedId, setTableDismissedId] = useState<string | null>(null);
  // The dice a roll was made with; adding, removing or loading dice hides the big view
  const [tableRolledIds, setTableRolledIds] = useState('');
  // Buzz when dice land: hidden and off until the private link turns it on (trial, 2026-10-28)
  const [buzzLinkOpened] = useState(() => isBuzzLink(window.location.hash));
  const [buzzShown] = useState(() => buzzLinkOpened || readItem(BUZZ_SHOWN_KEY) === 'true');
  const [buzzEnabled, setBuzzEnabled] = useState(() => buzzLinkOpened || readItem(BUZZ_KEY) === 'true');
  useEffect(() => {
    saveItem(BUZZ_KEY, String(buzzEnabled));
  }, [buzzEnabled]);
  useEffect(() => {
    if (buzzShown) saveItem(BUZZ_SHOWN_KEY, 'true');
  }, [buzzShown]);

  // Typed rolls kept as buttons under the Type a roll box, on this device and in backups
  const [savedRolls, setSavedRolls] = useState<SavedRoll[]>(loadSavedRolls);
  useEffect(() => {
    saveItem(SAVED_ROLLS_KEY, JSON.stringify(savedRolls));
  }, [savedRolls]);

  const [telemetryState, setTelemetryState] = useState(() => readItem(SAVED.telemetry) !== 'false');

  const soundTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = soundTimersRef.current;
    return () => {
      timers.forEach(timerId => clearTimeout(timerId));
    };
  }, []);

  // Modals state
  const [modalOpen, setModalOpen] = useState<'help' | 'history' | 'sets' | 'customize' | 'stats' | 'about' | 'install' | null>(null);
  const { installed, install } = useInstallApp();

  // Install app: the browser's own install box, or the how-to where there is none
  const handleInstall = async () => {
    trackEvent('install_clicked');
    setMenuOpen(false);
    if (!(await install())) setModalOpen('install');
  };

  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-felt', 'theme-midnight');
    document.body.classList.add(theme);
    saveItem(SAVED.theme, theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
  }, [menuOpen]);

  // Bright ring round the bottom-bar buttons for glare: a Customize switch, off until turned on
  const [brightRings, setBrightRings] = useState(() => readItem(SAVED.brightRings) === 'true');
  useEffect(() => {
    document.body.classList.toggle('bright-rings', brightRings);
    saveItem(SAVED.brightRings, String(brightRings));
  }, [brightRings]);

  // Expose RPG mode to CSS so mobile layout can reserve room for the taller FAB stack
  useEffect(() => {
    document.body.classList.toggle('rpg-mode', rpgMode);
  }, [rpgMode]);

  // Each tap in the die's button strip restarts the timer below, so it doesn't close mid-use
  const [stripTouch, setStripTouch] = useState(0);

  // Auto-deselect active die on mobile after 5 seconds
  useEffect(() => {
    if (!revealedDiceId) return;

    const timer = setTimeout(() => {
      setRevealedDiceId(null);
    }, 5000);

    const handleOutsideClick = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-dice-id], [data-die-actions]')) {
        return;
      }
      setRevealedDiceId(null);
    };

    document.addEventListener('pointerdown', handleOutsideClick);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [revealedDiceId, stripTouch]);

  // Load shared config from URL, default set, or autosave on mount & record session telemetry
  useEffect(() => {
    recordSessionStart();

    if (buzzLinkOpened) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      showToast(canBuzz()
        ? 'Buzz when dice land is on for this phone. Turn it off in Customize.'
        : "Buzz when dice land is on, but this browser can't buzz. Turn it off in Customize.");
    }

    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      // A share link is a hand-craftable URL, so treat the payload as untrusted
      // and always tell the recipient when it cannot be read — previously a
      // malformed link silently fell through to the default dice.
      const shared = readShareLink(hash).dice;

      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      if (shared.length > 0) {
        // A link replaces the dice that were out; Undo brings them back
        const autosaved = getSystemAutosave();
        const mine = autosaved ? sanitizeDiceList(autosaved.config) : [];
        setDiceList(shared);
        if (mine.length > 0 && diceSignature(mine) !== diceSignature(shared)) {
          offerUndo('Opened shared dice', () => restoreDice(mine), { big: true });
        }
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

    const defaultSet = readItem(SAVED.defaultSet);
    if (defaultSet) {
      try {
        const parsed = sanitizeDiceList(JSON.parse(defaultSet));
        if (parsed.length > 0) {
          // The default opens over the dice you had out last time, so say so
          // and let Undo bring those back
          const autosaved = getSystemAutosave();
          const last = autosaved ? sanitizeDiceList(autosaved.config) : [];
          setDiceList(parsed);
          if (last.length > 0 && diceSignature(last) !== diceSignature(parsed)) {
            offerUndo('Opened your default dice', () => restoreDice(last), { big: true });
          }
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
  // Word-only dice (Yes/No, a compass) have no total, so the button keeps
  // saying Roll rather than showing a 0 nobody rolled
  const anyDieScores = diceList.some(d => d.customFaces.length === 0 || d.customFaces.some(faceScores));
  const totalVisible = hasRolledThisSession && rollHistory.length > 0 && anyDieScores;
  // A die rolled on its own never replaces the big total
  const lastMainRoll = rollHistory.find(r => !r.single);
  const lastTotal = totalVisible && lastMainRoll ? lastMainRoll.total : 0;
  const lastModifier = totalVisible && lastMainRoll ? lastMainRoll.modifier ?? 0 : 0;
  // The old total fades once a die is added, removed or edited after the roll;
  // holding dice or changing the modifier leaves it bright
  const diceNow = rollSignature(diceList);
  const totalStale = totalVisible && rolledSignature !== null && rolledSignature !== diceNow;
  const setName = currentSetName(diceList, loadedSet);
  // Each roll records the game it was made in, for History and Frequency by game
  useEffect(() => { gameNameRef.current = setName; }, [setName, gameNameRef]);
  const tableReady = tableView && totalVisible && !isRolling && !!lastMainRoll
    && diceList.length > 0 && diceList.map(d => d.id).join() === tableRolledIds;
  const showTable = tableReady && lastMainRoll.id !== tableDismissedId;
  // After "Show the dice", a button goes back to the table (owner, 2026-11-05)
  const canReturnToTable = tableReady && !showTable;
  const toggleTableView = () => {
    const next = !tableView;
    setTableView(next);
    trackEvent('table_view_toggled', { enabled: next });
  };
  const tiles = showTable ? tableTiles(diceList) : [];

  // Dice Size & Grid layout calculations
  const { optimalSize, optimalColumns, dynamicGap } = scaleGridDimensions(
    calculateGridDimensions(diceList.length, containerSize.width, containerSize.height),
    diceList.length,
    containerSize.width,
    containerSize.height,
    diceScale
  );

  // Below this size the buttons round a tapped die get too small, so they move to one strip (owner, 2026-10-28)
  const compactDieActions = diceList.length > 0 && containerSize.width > 0 && optimalSize < COMPACT_DIE_SIZE;
  const revealedDie = compactDieActions ? diceList.find(d => d.id === revealedDiceId) : undefined;

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
    const before = diceList;
    setDiceList(loaded);
    setLoadedSet(setName ? { name: setName, signature: diceSignature(loaded) } : null);
    if (setName) {
      // Only built-in preset names go to analytics; a save's name is the user's own text
      if (dicePresets.some(p => p.name === setName)) {
        trackEvent('preset_loaded', { presetName: setName });
      }
    }
    // Say which set just loaded; Undo puts back the dice that were out
    const changed = before.length > 0 && diceSignature(before) !== diceSignature(loaded);
    if (changed) offerUndo(setName ? `Loaded ${setName}` : 'Loaded dice', () => restoreDice(before), { big: true });
    else if (setName) showToast(`Loaded ${setName}`);
    setModalOpen(null);
    setMenuOpen(false);
  };

  // A window picked from the menu closes the menu, as Save and Share do, so closing it lands on the dice
  const openFromMenu = (which: 'help' | 'history' | 'stats' | 'sets' | 'customize') => {
    setMenuOpen(false);
    setModalOpen(which);
  };

  // Set Default can be undone for seven seconds: Undo puts back the startup dice it replaced (or none)
  const handleSetDefault = () => {
    const previous = readItem(SAVED.defaultSet);
    setMenuOpen(false);
    // A refused save shows the storage-full message instead of offering Undo
    if (!saveItem(SAVED.defaultSet, JSON.stringify(diceList))) return;
    offerUndo('Startup dice set', () => {
      if (previous === null) { try { localStorage.removeItem(SAVED.defaultSet); } catch { /* storage blocked */ } }
      else saveItem(SAVED.defaultSet, previous);
    }, { back: previous === null ? 'No startup dice again' : 'Old startup dice are back' });
  };

  // Clear All needs no confirm: Undo brings every die back for five seconds
  const handleDeleteAll = () => {
    setMenuOpen(false);
    if (diceList.length === 0) return;
    const removed = diceList;
    clearAllDice();
    try {
      const stored = readItem(SAVED.games);
      if (stored) {
        const parsed = JSON.parse(stored);
        delete parsed['systemAutosave'];
        saveItem(SAVED.games, JSON.stringify(parsed));
      }
    } catch (e) {
      console.error(e);
    }
    offerUndo(`Cleared ${removed.length} ${removed.length === 1 ? 'die' : 'dice'}`, () => restoreDice(removed), { big: removed.length > 1 });
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

  // The faces count, a template or a face's X can drop custom faces; Undo puts them back
  const handleUpdateDie = (id: string, updates: Partial<DiceData>) => {
    const die = diceList.find(d => d.id === id);
    if (die && updates.customFaces) {
      const kept = new Set(updates.customFaces.map(f => parseFaceContent(f).content));
      const lost = die.customFaces.filter(f => !kept.has(parseFaceContent(f).content));
      if (lost.length > 0) {
        const before = { faces: die.faces, customFaces: die.customFaces, currentFaceIndex: die.currentFaceIndex };
        offerUndo(
          lost.length === 1 ? `Removed face ${parseFaceContent(lost[0]).content}` : `Replaced ${lost.length} faces`,
          () => updateDice(id, before),
        );
      }
    }
    updateDice(id, updates);
  };

  const handleClearHistory = () => {
    const before = rollHistory;
    if (before.length === 0) return;
    clearHistory();
    offerUndo(`Cleared ${before.length} ${before.length === 1 ? 'roll' : 'rolls'}`, () => restoreHistory(before), { big: before.length > 1 });
  };

  // Clears one game's rolls and keeps the rest (owner, 2026-11-05)
  const handleClearGame = (key: string, label: string) => {
    const before = rollHistory;
    const kept = before.filter(item => gameKeyOf(item) !== key);
    const removed = before.length - kept.length;
    if (removed === 0) return;
    restoreHistory(kept);
    offerUndo(`Cleared ${removed} ${label} ${removed === 1 ? 'roll' : 'rolls'}`, () => restoreHistory(before), { big: removed > 1 });
  };

  const handleShare = () => {
    // Pictures stay on this device; the link carries each picture face's text
    const json = JSON.stringify(withoutFaceImages(diceList));
    const compressed = LZString.compressToEncodedURIComponent(json);
    // A named set travels with the link, so the person opening it sees the game's name
    const nameParam = setName ? `&name=${encodeURIComponent(setName)}` : '';
    const url = `${window.location.origin}${window.location.pathname}#share=${compressed}${nameParam}`;
    
    trackEvent('share_link_copied', { diceCount: diceList.length });
    setMenuOpen(false);

    const copyLink = () => {
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
    };

    // The phone's own share sheet (Messages, WhatsApp...) when the browser has one
    const shareData = { title: setName || 'Custom Dice Roller', url };
    if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(shareData))) {
      navigator.share(shareData).catch(err => {
        // Closing the sheet is a choice, not a failure
        if (err && (err as Error).name === 'AbortError') return;
        copyLink();
      });
      return;
    }
    copyLink();
  };

  const handleExportData = () => {
    try {
      const data = buildBackup(diceList);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diceroller_backup.json`;
      link.click();
      // Revoking in the same tick can cancel the download in Safari and Firefox
      setTimeout(() => URL.revokeObjectURL(url), 0);
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
        const result = restoreBackup(JSON.parse(event.target?.result as string));
        if (result === 'invalid') {
          showToast('Invalid backup file structure.');
          return;
        }
        // Storage full: the storage message is already up, so no reload
        if (result === 'full') return;
        if (result === 'pictures') {
          showToast('Imported, but some pictures did not fit on this device. Reloading...');
          setTimeout(() => window.location.reload(), 1500);
          return;
        }
        trackEvent('backup_imported');
        showToast('Imported backup successfully! Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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
    // A typed roll puts out new dice, so Table view shows big for these
    setTableRolledIds(dice.map(d => d.id).join());
    rollDice(({ total, diceCount, natural20Ids }) => {
      setHasRolledThisSession(true);
      setRolledSignature(rollSignature(latestDiceRef.current));
      void celebrateNatural20(natural20Ids);
      trackEvent('roll_dice', { diceCount, sum: total, modifier: roll.modifier, rpgMode, rollAdvantage: roll.advantage, typed: true });
    }, undefined, { text: roll.text, dice, modifier: roll.modifier, advantage: roll.advantage });
    rollFeedback();
    if (before.dice.length > 0) {
      offerUndo(`Rolled ${roll.text}`, () => {
        restoreDice(before.dice);
        setModifier(before.modifier);
        setRollAdvantage(before.advantage);
      });
    }
  };

  const handleSaveRoll = (roll: SavedRoll) => {
    // A full list never drops an older roll to make room
    if (savedRolls.length >= MAX_SAVED_ROLLS && !savedRolls.some(r => r.name === roll.name)) {
      showToast(`You can keep ${MAX_SAVED_ROLLS} saved rolls. Remove one to add another.`);
      return;
    }
    setSavedRolls(list => withSavedRoll(list, roll));
    showToast(`Saved ${roll.name}`);
  };

  // Removing a saved roll offers Undo, which puts it back in its place
  const handleRemoveSavedRoll = (name: string) => {
    const index = savedRolls.findIndex(r => r.name === name);
    if (index < 0) return;
    const removed = savedRolls[index];
    setSavedRolls(list => list.filter(r => r.name !== name));
    offerUndo(`Removed ${name}`, () => setSavedRolls(list => {
      if (list.some(r => r.name === removed.name)) return list;
      const next = [...list];
      next.splice(Math.min(index, next.length), 0, removed);
      return next;
    }));
  };

  /** Sound plays the rattle, thud and buzz; with sound off, Buzz when dice land still buzzes */
  const rollFeedback = () => {
    if (soundEnabled) playRollSequence(soundTimersRef);
    else if (buzzEnabled) scheduleLandingBuzz(soundTimersRef);
  };

  const handleRollOne = (id: string) => {
    rollDice(({ natural20Ids }) => {
      void celebrateNatural20(natural20Ids);
      trackEvent('roll_one_die');
    }, id);
    rollFeedback();
  };

  const handleAddDice = (template?: Partial<DiceData>) => {
    addDice(template);
    trackEvent('dice_added');
  };

  // A die added from the + button (or its RPG quick-add menu) glides out of it into its place
  const glideFrom = useRef<GlideOrigin | null>(null);
  const handleAddFromBar = (template?: Partial<DiceData>) => {
    const plus = document.querySelector('[data-add-button]')?.getBoundingClientRect();
    glideFrom.current = plus ? { x: plus.left + plus.width / 2, y: plus.top + plus.height / 2, at: Date.now() } : null;
    handleAddDice(template);
  };
  // The first new die to ask claims the glide; asking again (React's strict
  // mode calls twice) gets the same answer, and any other die gets none
  const takeGlide = useCallback((id: string) => {
    const origin = glideFrom.current;
    if (!origin || Date.now() - origin.at > 1000) return null;
    if (origin.claimedBy && origin.claimedBy !== id) return null;
    origin.claimedBy = id;
    return origin;
  }, []);

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
    // Every die held: nothing would change, so say why instead of logging a
    // repeat of the last roll
    if (diceList.length > 0 && !hasUnheldDice) {
      showToast('All dice are held. Tap a die to let it roll again.');
      return;
    }
    setTableRolledIds(diceList.map(d => d.id).join());
    const outcome = rollDice(({ total, diceCount, natural20Ids }) => {
      // Fires when the roll resolves, so the actual total reaches analytics
      setHasRolledThisSession(true);
      setRolledSignature(rollSignature(latestDiceRef.current));
      void celebrateNatural20(natural20Ids);
      if (diceCount > 0) {
        trackEvent('roll_dice', { diceCount, sum: total, modifier, rpgMode, rollAdvantage });
      }
    });

    // A tap during the tumble only lands the dice: the thud plays now, the rattle doesn't start again
    if (outcome === 'landed') {
      if (soundEnabled) playLandNow(soundTimersRef);
    } else if (outcome === 'rolled' && hasUnheldDice && diceList.length > 0) {
      rollFeedback();
    }
  };

  // Space or R rolls on a computer, only from the main screen
  useRollKeys(handleRoll, menuOpen || modalOpen !== null);

  // Shake to roll: the latest roll handler, read by the motion listener
  // Every dialog, sheet or menu counts, not only the named modals: Dice
  // settings, Save and the share fallback have their own open state.
  const overlayOpen = modalOpen !== null || menuOpen || savePromptOpen || editingDiceId !== null || shareFallbackUrl !== null;
  const handleRollRef = useRef(handleRoll);
  const overlayOpenRef = useRef(overlayOpen);
  useEffect(() => {
    handleRollRef.current = handleRoll;
    overlayOpenRef.current = overlayOpen;
  });

  useEffect(() => {
    if (!shakeEnabled || typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;
    const isShake = createShakeDetector();
    const onMotion = (e: DeviceMotionEvent) => {
      const sample = sampleFromEvent(e);
      // A shake rolls only from the main screen, never under an open dialog or menu
      if (sample && isShake(sample) && !overlayOpenRef.current) {
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
        {/* RPG mode's Type a roll box sits up here by the name, not as a row of its
            own over the dice (owner, 2026-11-05). A phone gives it the next line. */}
        {rpgMode && (
          <div className={styles.topRoll}>
            <TypeRollBox
              onRoll={handleTypedRoll}
              disabled={isRolling}
              savedRolls={savedRolls}
              onSaveRoll={handleSaveRoll}
              onRemoveSavedRoll={handleRemoveSavedRoll}
            />
          </div>
        )}
        {canReturnToTable && (
          <button className={styles.tableButton} onClick={() => setTableDismissedId(null)} aria-label={`Show table, total ${lastTotal}`} title="Show table">
            <Table2 size={18} aria-hidden="true" />
            <span>Table</span>
          </button>
        )}
        {landingAbout && (
          <button className={styles.aboutButton} onClick={() => setModalOpen('about')} aria-label="About" title="About">
            <Info size={20} aria-hidden="true" />
            <span className={styles.aboutLabel}>About</span>
          </button>
        )}
      </header>

      {showTable && lastMainRoll && (
        <TableView
          total={lastTotal}
          math={tableMath(tiles, lastModifier)}
          tiles={tiles}
          onShowDice={() => setTableDismissedId(lastMainRoll.id)}
          onTurnOff={toggleTableView}
        />
      )}

      <div ref={containerRef} className={`${styles.diceContainer} ${showTable ? styles.diceHidden : ''}`} style={diceStyles}>
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
            compactActions={compactDieActions}
            takeGlide={takeGlide}
          />
        ))}
      </div>

      {revealedDie && (
        <DieActionStrip
          die={revealedDie}
          rpgMode={rpgMode}
          onRollOne={isRolling ? undefined : handleRollOne}
          onToggleHold={toggleHold}
          onClone={handleAddDice}
          onOpenSettings={setEditingDiceId}
          onRemove={handleRemoveDie}
          onInteract={() => setStripTouch(n => n + 1)}
        />
      )}

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
            {/* Straight into RPG Mode with a d20 out (owner, 2026-11-05) */}
            {!rpgMode && (
              <button
                className="md-button md-button-surface"
                onClick={() => {
                  toggleRpgMode();
                  handleAddDice({ numberValue: 1, faces: 20, name: 'd20', customFaces: [], color: '#384050' });
                }}
              >
                <Swords size={18} aria-hidden="true" /> RPG Mode
              </button>
            )}
          </div>
        </div>
      )}

      <SidebarMenu
        isOpen={menuOpen}
        onToggle={() => setMenuOpen(!menuOpen)}
        onDonate={() => window.open('https://www.buymeacoffee.com/darenihill', '_blank', 'noopener,noreferrer')}
        onIdeas={() => window.open('https://forms.gle/wqYaKsEZ5FQwizuMA', '_blank', 'noopener,noreferrer')}
        onHelp={() => openFromMenu('help')}
        onHistory={() => openFromMenu('history')}
        onStats={() => openFromMenu('stats')}
        onSets={() => openFromMenu('sets')}
        onCustomize={() => openFromMenu('customize')}
        onDeleteAll={handleDeleteAll}
        onSave={handleSave}
        onShare={handleShare}
        onSetDefault={handleSetDefault}
        rpgMode={rpgMode}
        onToggleRpgMode={toggleRpgMode}
        tableView={tableView}
        onToggleTableView={toggleTableView}
        allHeld={allHeld}
        onHoldAll={() => { toggleHoldAll(); setMenuOpen(false); }}
        onInstall={installed ? undefined : handleInstall}
      />

      <ActionBar
        onAdd={handleAddFromBar}
        onRoll={handleRoll}
        onHoldAll={toggleHoldAll}
        allHeld={allHeld}
        totalVisible={totalVisible}
        totalStale={totalStale}
        lastTotal={lastTotal}
        totalKey={totalVisible && lastMainRoll ? lastMainRoll.id : undefined}
        rolling={isRolling}
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

      <InstallModal isOpen={modalOpen === 'install'} onClose={() => setModalOpen(null)} />

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
        onClearHistory={handleClearHistory}
        onClearGame={handleClearGame}
        dice={diceList}
        rpgMode={rpgMode}
        modifier={modifier}
        rollAdvantage={rollAdvantage}
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
        brightRings={brightRings}
        onToggleBrightRings={() => { setBrightRings(on => !on); trackEvent('bright_rings_toggled', { enabled: !brightRings }); }}
        buzzShown={buzzShown}
        buzzEnabled={buzzEnabled}
        onToggleBuzz={() => setBuzzEnabled(on => !on)}
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
        <div className={`${styles.toast} ${styles.undoToast} ${styles.storageToast} ${rpgMode ? styles.toastAboveRpgBar : ''}`} role="alert">
          <span>Storage is full, so your last change wasn't saved.</span>
          <button className={styles.undoButton} onClick={() => { setStorageFull(false); handleExportData(); }}>Export backup</button>
          <button className={styles.undoButton} onClick={() => setStorageFull(false)} aria-label="Close storage message" style={{ minWidth: 44 }}>✕</button>
        </div>
      ) : undoOffer ? (
        <UndoBar
          offer={undoOffer}
          windowMs={UNDO_WINDOW_MS}
          paused={undoPaused}
          onUndo={runUndo}
          onDismiss={dismissUndo}
          onPause={pauseUndo}
          onResume={resumeUndo}
          className={`${styles.toast} ${rpgMode ? styles.toastAboveRpgBar : ''}`}
        />
      ) : toast ? (
        // role="status" so a screen reader hears "Saved!" and the rest, as it does the Undo offer
        <div className={`${styles.toast} ${rpgMode ? styles.toastAboveRpgBar : ''}`} role="status">
          {toast}
        </div>
      ) : newVersion.ready && (
        // An app left open hears about a new version; Refresh loads it (owner's pick, 2026-11-03)
        <div className={`${styles.toast} ${styles.undoToast} ${rpgMode ? styles.toastAboveRpgBar : ''}`} role="status" data-testid="new-version-bar">
          <span style={{ flexShrink: 0 }}>New version</span>
          <button className={styles.undoButton} onClick={() => window.location.reload()}>Refresh</button>
          <button className={styles.undoButton} onClick={newVersion.later} aria-label="Later" title="Later" style={{ minWidth: 44 }}>✕</button>
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
          onUpdate={handleUpdateDie}
          onRemove={handleRemoveDie}
          onClone={handleAddDice}
          allDice={diceList}
        />
      )}
    </div>
  );
}

export default App;

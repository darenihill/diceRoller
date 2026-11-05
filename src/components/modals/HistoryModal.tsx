import React from 'react';
import { Modal } from '../Modal';
import type { RollHistoryItem, RollAdvantageMode } from '../../hooks/useDiceState';
import type { DiceData } from '../../types';
import { fairOdds, luckRows, furthestFromFair, luckSet } from '../../utils/fairOdds';
import { gameKeyFor, gameKeyOf, recentGroups, groupLabel, diceSummary } from '../../utils/rollGroups';
import styles from '../../App.module.css';
import modalStyles from './Modals.module.css';
// The same tabs as Dice Settings / Custom faces, so the two dialogs match
import tabStyles from '../DiceSettingsModal.module.css';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rollHistory: RollHistoryItem[];
  onClearHistory: () => void;
  /** Clears one game's rolls (its key and name), keeping the others */
  onClearGame?: (key: string, label: string) => void;
  /** The dice on the table now, for the fair-dice marks */
  dice?: DiceData[];
  rpgMode?: boolean;
  modifier?: number;
  rollAdvantage?: RollAdvantageMode;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  rollHistory,
  onClearHistory,
  onClearGame,
  dice = [],
  rpgMode = false,
  modifier = 0,
  rollAdvantage = 'normal',
}) => {
  // History by game (owner, 2026-11-05): Frequency counts the game on the table
  // now, with chips for the last few games before it and All
  const currentKey = gameKeyFor(dice);
  const groups = React.useMemo(() => (isOpen ? recentGroups(rollHistory, currentKey) : []), [isOpen, rollHistory, currentKey]);
  const [picked, setPicked] = React.useState<string | null>(null);
  const shownKey = picked === 'all' || groups.length === 0
    ? null
    : groups.some(g => g.key === picked) ? picked : groups[0].key;
  const onCurrent = groups.length === 0 || shownKey === currentKey;

  // The chart counts whole-set rolls only; a die rolled on its own stays in the log
  const counted = rollHistory.filter(item => !item.single && (shownKey === null || gameKeyOf(item) === shownKey));
  const counts = new Map<number, number>();
  counted.forEach(item => counts.set(item.total, (counts.get(item.total) ?? 0) + 1));

  // Fair-dice marks: the count each total would get, on average, from fair
  // dice like the ones on the table now. Worked out only while History is
  // open, and only again when the dice or settings change. Another game's
  // rolls get no marks, since its dice are not on the table to work them out.
  const odds = React.useMemo(
    () => (isOpen ? fairOdds(dice, rpgMode, modifier, rollAdvantage) : new Map<number, number>()),
    [isOpen, dice, rpgMode, modifier, rollAdvantage],
  );
  const rows = luckRows(counts, onCurrent ? odds : new Map<number, number>(), counted.length);
  const scale = Math.max(1, ...rows.map(r => Math.max(r.count, r.fair)));
  const showFair = odds.size > 0 && onCurrent;
  const odd = showFair && counted.length >= 3 ? furthestFromFair(rows) : null;
  const nowSet = luckSet(dice, rpgMode, modifier, rollAdvantage);
  const diceChanged = showFair && counted.some(item => item.set !== undefined && item.set !== nowSet);
  const times = (n: number) => `${n} ${n === 1 ? 'time' : 'times'}`;

  // History and Frequency as tabs by the close button (owner, 2026-11-05)
  const [tab, setTab] = React.useState<'history' | 'frequency'>('history');
  // Each opening starts on History, wherever it was left
  const [wasOpen, setWasOpen] = React.useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) { setTab('history'); setPicked(null); }
  }
  const currentLabel = currentKey ? groupLabel(rollHistory, currentKey) : '';
  const currentHasRolls = groups.some(g => g.key === currentKey);
  // A line at the top of each run of rolls from one game, once more than one
  // game is in the log: "Catan · from 3:42 PM"
  // Worked out once per change to the log, and only while History is open
  const runStarts = React.useMemo(() => {
    const starts = new Map<string, string>();
    if (!isOpen) return starts;
    const keys = rollHistory.map(gameKeyOf);
    if (new Set(keys.filter(Boolean)).size < 2) return starts;
    // Each game's name, from its newest roll that recorded one
    const names = new Map<string, string>();
    rollHistory.forEach((item, k) => { const key = keys[k]; if (key && item.game && !names.has(key)) names.set(key, item.game); });
    let i = 0;
    while (i < rollHistory.length) {
      const key = keys[i];
      if (!key) { i++; continue; }
      // The run: this roll and the older ones of the same game, singles in between included
      let j = i;
      let oldest = i;
      while (j < rollHistory.length && (keys[j] === key || keys[j] === null)) {
        if (keys[j] === key) oldest = j;
        j++;
      }
      const from = rollHistory[oldest].at;
      starts.set(rollHistory[i].id, `${names.get(key) ?? diceSummary(key)}${from ? ` · from ${new Date(from).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}`);
      i = oldest + 1;
    }
    return starts;
  }, [isOpen, rollHistory]);
  const tabsId = React.useId();
  const tabsHeader = (
    <div className={tabStyles.tabs} role="tablist" aria-label="Roll history">
      {([['history', 'History'], ['frequency', 'Frequency']] as const).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          id={`${tabsId}-tab-${key}`}
          aria-selected={tab === key}
          aria-controls={`${tabsId}-panel-${key}`}
          className={`${tabStyles.tab} ${tab === key ? tabStyles.tabActive : ''}`}
          onClick={() => setTab(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Roll History & Frequency" header={tabsHeader}>
      {rollHistory.length === 0 ? (
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', padding: '16px 0' }}>No rolls yet. Each roll shows here.</p>
      ) : (
        <div
          role="tabpanel"
          id={`${tabsId}-panel-${tab}`}
          aria-labelledby={`${tabsId}-tab-${tab}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {tab === 'history' && (<>
            {/* Clear History sits at the top, where it is seen without scrolling (owner, 2026-11-02) */}
            <div className={modalStyles.sectionHeaderRow} style={{ borderTop: 'none', paddingTop: 0 }}>
              <span className={modalStyles.toggleDesc}>{rollHistory.length} {rollHistory.length === 1 ? 'roll' : 'rolls'} saved</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {/* One game's rolls go, the others stay (owner, 2026-11-05) */}
                {onClearGame && currentKey && currentHasRolls && groups.length > 1 && (
                  <button className="md-button md-button-surface md-button-compact" onClick={() => onClearGame(currentKey, currentLabel)}>
                    Clear {currentLabel}
                  </button>
                )}
                <button className="md-button md-button-surface md-button-compact" onClick={onClearHistory}>
                  Clear History
                </button>
              </div>
            </div>
            <div className={styles.historyList}>
              <h3 className={modalStyles.sectionHeader}>Roll Log ({rollHistory.length})</h3>
              {rollHistory.map((roll, i) => (
                <React.Fragment key={roll.id}>
                {runStarts.get(roll.id) && (
                  <div className={modalStyles.gameDivider} data-testid="game-divider">
                    {runStarts.get(roll.id)}
                  </div>
                )}
                <div className={styles.historyItem} style={{ borderLeft: roll.isTargetHit ? '4px solid var(--color-gold)' : 'none' }}>
                  <div className={styles.historyIndex}>Roll {rollHistory.length - i}{roll.single ? ' · one die' : ''}{roll.typed ? ` · ${roll.typed}` : ''}</div>
                  <div className={styles.historyDetails}>{roll.details.join(', ')}</div>
                  <div className={styles.historyTotal}>
                    Total: {roll.total}
                    {roll.isTargetHit && <span style={{ marginLeft: 6, color: 'var(--color-gold-ink)', fontSize: '0.75rem' }}>🎯 HIT!</span>}
                  </div>
                </div>
                </React.Fragment>
              ))}
            </div>
          </>)}
          {tab === 'frequency' && (<>
            {/* Session Frequency Histogram */}
            <div>
              <h3 className={modalStyles.sectionHeaderFirst}>Luck Meter</h3>
              {groups.length > 1 && (
                <div className={modalStyles.gameChips} role="group" aria-label="Which game">
                  {groups.map(g => (
                    <button
                      key={g.key}
                      type="button"
                      className={modalStyles.gameChip}
                      aria-pressed={shownKey === g.key}
                      onClick={() => setPicked(g.key)}
                    >
                      {g.label}{g.key === currentKey ? ' (now)' : ''}
                    </button>
                  ))}
                  <button type="button" className={modalStyles.gameChip} aria-pressed={shownKey === null} onClick={() => setPicked('all')}>
                    All
                  </button>
                </div>
              )}
              <div className={modalStyles.freqCard}>
                {showFair && (
                  <p className={modalStyles.freqNote}>
                    <span className={modalStyles.freqFairKey} aria-hidden="true" /> marks what fair dice would give
                    {diceChanged ? ', using the dice and settings now (they changed since some of these rolls)' : ''}.
                  </p>
                )}
                {odd && (
                  <p className={modalStyles.freqNote} data-furthest={odd.total}>
                    Furthest from fair: {odd.total} came up {times(odd.count)}; fair dice would give about {Math.round(odd.fair * 10) / 10}.
                  </p>
                )}
                {rows.map(row => (
                  <div key={row.total} className={modalStyles.freqRow}>
                    <span className={modalStyles.freqLabel}>
                      Total {row.total}:
                    </span>
                    <div className={modalStyles.freqBarContainer}>
                      <div
                        className={modalStyles.freqBarFill}
                        style={{ width: `${(row.count / scale) * 100}%` }}
                      />
                      {showFair && row.fair > 0 && (
                        <div
                          className={modalStyles.freqFairMark}
                          style={{ left: `${(row.fair / scale) * 100}%` }}
                          data-fair={row.fair.toFixed(2)}
                          title={`Fair dice: about ${Math.round(row.fair * 10) / 10}`}
                        />
                      )}
                    </div>
                    <span className={modalStyles.freqCount}>
                      {row.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </>)}
        </div>
      )}
    </Modal>
  );
};

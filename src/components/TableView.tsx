import React from 'react';
import styles from './TableView.module.css';
import { needsUnderline, type TableTile } from '../utils/tableView';

interface TableViewProps {
  total: number;
  math: string | null;
  tiles: TableTile[];
  /** Tapping the big number goes back to the dice */
  onShowDice: () => void;
  /** Turns table view off from here, without a trip to the menu */
  /** The dice are rolling: the last numbers stay, dimmed, until they land */
  rolling?: boolean;
}

/** A number, underlined when it would read as another number upside down. */
const Num: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <span className={`${className ?? ''} ${needsUnderline(text) ? styles.underlined : ''}`}>{text}</span>
);

/**
 * Table view: the last total huge in the dice area, its math under it, the
 * dice as small tiles, and an upside-down copy for the people across the table.
 */
export const TableView: React.FC<TableViewProps> = ({ total, math, tiles, onShowDice, rolling = false }) => {
  const shown = String(total);
  return (
    <div className={`${styles.tableView} ${rolling ? styles.rolling : ''}`} data-testid="table-view" aria-busy={rolling}>
      <div className={styles.flipped} aria-hidden="true">
        <Num text={shown} className={styles.flippedTotal} />
        {math && <span className={styles.math}>{rolling ? '\u00a0' : math}</span>}
      </div>

      <button className={styles.bigTotal} onClick={onShowDice} disabled={rolling} aria-label={rolling ? 'Rolling' : `Total ${shown}. Show the dice`}>
        <Num text={shown} />
      </button>
      {/* The dice already know their new faces while they tumble, so the math and
          tiles wait for the landing rather than give the roll away */}
      {math && <p className={styles.math}>{rolling ? '\u00a0' : math}</p>}

      <ul className={styles.tiles} aria-label="Dice">
        {tiles.map(t => (
          <li
            key={t.id}
            className={`${styles.tile} ${t.dropped ? styles.tileDropped : ''} ${t.held ? styles.tileHeld : ''}`}
            title={t.dropped ? 'Dropped' : t.held ? 'Held' : undefined}
          >
            {rolling ? '–' : <Num text={t.text} />}
          </li>
        ))}
      </ul>
    </div>
  );
};

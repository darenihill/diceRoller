import React from 'react';
import styles from './TableView.module.css';
import { needsUnderline, type TableTile } from '../utils/tableView';

interface TableViewProps {
  total: number;
  math: string | null;
  tiles: TableTile[];
  /** Tapping the big number goes back to the dice */
  onShowDice: () => void;
}

/** A number, underlined when it would read as another number upside down. */
const Num: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <span className={`${className ?? ''} ${needsUnderline(text) ? styles.underlined : ''}`}>{text}</span>
);

/**
 * Table view: the last total huge in the dice area, its math under it, the
 * dice as small tiles, and an upside-down copy for the people across the table.
 */
export const TableView: React.FC<TableViewProps> = ({ total, math, tiles, onShowDice }) => {
  const shown = String(total);
  return (
    <div className={styles.tableView} data-testid="table-view">
      <div className={styles.flipped} aria-hidden="true">
        <Num text={shown} className={styles.flippedTotal} />
        {math && <span className={styles.math}>{math}</span>}
      </div>

      <button className={styles.bigTotal} onClick={onShowDice} aria-label={`Total ${shown}. Show the dice`}>
        <Num text={shown} />
      </button>
      {math && <p className={styles.math}>{math}</p>}

      <ul className={styles.tiles} aria-label="Dice">
        {tiles.map(t => (
          <li
            key={t.id}
            className={`${styles.tile} ${t.dropped ? styles.tileDropped : ''} ${t.held ? styles.tileHeld : ''}`}
            title={t.dropped ? 'Dropped' : t.held ? 'Held' : undefined}
          >
            <Num text={t.text} />
          </li>
        ))}
      </ul>
      <p className={styles.hint}>Tap the number to see the dice</p>
    </div>
  );
};

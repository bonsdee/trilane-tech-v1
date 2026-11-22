import styles from './Table.module.css';

/**
 * Horizontally scrollable table wrapper with consistent styling.
 * With `stacked`, each row turns into a card on phones; give every cell after
 * the first a data-label so its column name shows beside the value.
 */
export default function Table({ caption, stacked = false, children }) {
  return (
    <div className={`${styles.wrap} ${stacked ? styles.stackedWrap : ''}`} tabIndex={0} role="region" aria-label={caption}>
      <table className={`${styles.table} ${stacked ? styles.stacked : ''}`}>
        {caption && <caption className="visually-hidden">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

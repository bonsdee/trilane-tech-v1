import styles from './Table.module.css';

/** Horizontally scrollable table wrapper with consistent styling. */
export default function Table({ caption, children }) {
  return (
    <div className={styles.wrap} tabIndex={0} role="region" aria-label={caption}>
      <table className={styles.table}>
        {caption && <caption className="visually-hidden">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

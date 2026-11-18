import styles from './Logo.module.css';

/**
 * Text wordmark with a mark of three parallel lines (the three lanes of work).
 * Built in code so a designed logo can replace it later.
 */
export default function Logo({ compact = false }) {
  return (
    <span className={styles.logo}>
      <svg className={styles.mark} viewBox="0 0 28 28" aria-hidden="true">
        <rect width="28" height="28" rx="8" />
        <path d="M8 9.5h12M8 14h12M8 18.5h12" />
      </svg>
      {!compact && <span className={styles.word}>Trilane Tech</span>}
      {compact && <span className="visually-hidden">Trilane Tech</span>}
    </span>
  );
}

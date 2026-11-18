import styles from './Spinner.module.css';

export default function Spinner({ size = 'md', label = 'Loading' }) {
  return (
    <span className={`${styles.spinner} ${styles[size]}`} role={label ? 'status' : undefined} aria-label={label || undefined}>
      <span className={styles.ring} aria-hidden="true" />
    </span>
  );
}

/** Centered spinner with text, for whole sections. */
export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className={styles.block} role="status">
      <Spinner label="" />
      <span>{label}</span>
    </div>
  );
}

import Button from './Button';
import styles from './States.module.css';
import { errorMessage } from '../api/client';

export function EmptyState({ title, children, action }) {
  return (
    <div className={styles.state}>
      <p className={styles.title}>{title}</p>
      {children && <p className={styles.text}>{children}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'This section could not load.' }) {
  return (
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <p className={styles.title}>{title}</p>
      <p className={styles.text}>{errorMessage(error)}</p>
      {onRetry && (
        <div className={styles.action}>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

/** Inline banner for form-level messages. */
export function Notice({ tone = 'info', children }) {
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={tone === 'danger' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

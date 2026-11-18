import { useId } from 'react';
import styles from './Field.module.css';

/**
 * Label + control + hint + error, wired up for screen readers.
 * `as` may be 'input', 'textarea' or 'select'.
 */
export default function Field({ label, as = 'input', error, hint, required = false, optionalLabel = true, className = '', children, ...rest }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const Control = as;
  const controlProps = {
    id,
    className: `${styles.control} ${as === 'textarea' ? styles.textarea : ''} ${as === 'select' ? styles.select : ''}`,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    required,
    ...rest,
  };
  return (
    <div className={`${styles.field} ${error ? styles.hasError : ''} ${className}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {!required && optionalLabel && <span className={styles.optional}> (optional)</span>}
      </label>
      {as === 'select' ? <select {...controlProps}>{children}</select> : <Control {...controlProps} />}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** A labelled checkbox or switch-like toggle. */
export function Checkbox({ label, hint, className = '', ...rest }) {
  const id = useId();
  return (
    <div className={`${styles.checkRow} ${className}`}>
      <input id={id} type="checkbox" className={styles.checkbox} {...rest} />
      <label htmlFor={id}>
        {label}
        {hint && <span className={styles.hintInline}>{hint}</span>}
      </label>
    </div>
  );
}

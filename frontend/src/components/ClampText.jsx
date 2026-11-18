import { useEffect, useId, useRef, useState } from 'react';
import styles from './ClampText.module.css';

/**
 * Shows the first few lines of a longer text with a "Read more" toggle.
 * The toggle only appears when the text is actually cut off.
 */
export default function ClampText({ children, lines = 4, className = '' }) {
  const ref = useRef(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      if (open) return; // Measure only while clamped.
      setOverflows(el.scrollHeight - el.clientHeight > 2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, children]);

  return (
    <div className={styles.wrap}>
      <p
        id={id}
        ref={ref}
        className={`${className} ${open ? '' : styles.clamped}`}
        style={{ '--lines': lines }}
      >
        {children}
      </p>
      {(overflows || open) && (
        <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

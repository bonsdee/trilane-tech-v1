import styles from './LaneArt.module.css';

/** Small code-drawn picture for each lane of work: build, convert, operate. */
export default function LaneArt({ lane }) {
  if (lane === 'build') {
    return (
      <div className={styles.art} aria-hidden="true">
        <div className={styles.window}>
          <span className={styles.bar} />
          <span className={styles.block} />
          <span className={styles.row}>
            <span />
            <span />
          </span>
        </div>
        <span className={styles.cursor} />
      </div>
    );
  }
  if (lane === 'convert') {
    return (
      <div className={`${styles.art} ${styles.chart}`} aria-hidden="true">
        {[34, 46, 40, 62, 78, 96].map((h, i) => (
          <span key={i} className={i === 5 ? styles.barTop : styles.barCol} style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }} />
        ))}
        <svg className={styles.trend} viewBox="0 0 100 60" preserveAspectRatio="none">
          <path d="M4 50 L24 40 L42 44 L60 28 L78 18 L96 4" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`${styles.art} ${styles.inbox}`} aria-hidden="true">
      {[true, true, false].map((done, i) => (
        <span key={i} className={styles.item}>
          <span className={done ? styles.checkDone : styles.check}>
            {done && (
              <svg viewBox="0 0 16 16" width="10" height="10">
                <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className={styles.itemLines}>
            <span />
            <span />
          </span>
        </span>
      ))}
    </div>
  );
}

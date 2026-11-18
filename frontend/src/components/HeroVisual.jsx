import styles from './HeroVisual.module.css';

/**
 * Decorative illustration for the Home hero, drawn in code: a website in a
 * browser window, a new inquiry arriving, and the lead moving through the
 * pipeline. It shows the three lanes at a glance. Hidden from screen readers.
 */
export default function HeroVisual() {
  return (
    <div className={styles.visual} aria-hidden="true">
      <div className={styles.browser}>
        <div className={styles.chrome}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.url}>yourbusiness.com</span>
        </div>
        <div className={styles.page}>
          <div className={styles.nav}>
            <span className={styles.brandBar} />
            <span className={styles.navBars}>
              <span />
              <span />
              <span />
            </span>
          </div>
          <div className={styles.heroBlock}>
            <span className={`${styles.line} ${styles.lineLg}`} />
            <span className={`${styles.line} ${styles.lineMd}`} />
            <span className={`${styles.line} ${styles.lineSm}`} />
            <span className={styles.cta}>Get in touch</span>
          </div>
          <div className={styles.cards}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <div className={styles.notify}>
        <span className={styles.notifyIcon}>
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M4 6h16v12H4z M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </span>
        <span className={styles.notifyText}>
          <strong>New inquiry</strong>
          <span>Launch Bundle · from Google</span>
        </span>
        <span className={styles.notifyTime}>now</span>
      </div>

      <div className={styles.pipeline}>
        <span className={styles.pipelineLabel}>Follow-up</span>
        <span className={styles.chips}>
          <span className={`${styles.chip} ${styles.chip1}`}>New</span>
          <span className={styles.arrow}>→</span>
          <span className={`${styles.chip} ${styles.chip2}`}>Contacted</span>
          <span className={styles.arrow}>→</span>
          <span className={`${styles.chip} ${styles.chip3}`}>Won</span>
        </span>
      </div>
    </div>
  );
}

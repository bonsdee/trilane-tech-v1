import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import styles from './ConsentBanner.module.css';
import { GA_ID, getConsent, loadAnalytics, setConsent } from '../utils/analytics';

/**
 * Asks before loading analytics. Only appears when a Google Analytics ID is
 * configured; without one the site sets no optional cookies at all.
 * The footer's "Cookie settings" button reopens it.
 */
export default function ConsentBanner() {
  const [open, setOpen] = useState(() => Boolean(GA_ID) && getConsent() === null);

  useEffect(() => {
    loadAnalytics();
    const reopen = () => GA_ID && setOpen(true);
    window.addEventListener('trilane:open-consent', reopen);
    return () => window.removeEventListener('trilane:open-consent', reopen);
  }, []);

  if (!open) return null;

  const choose = (value) => {
    setConsent(value);
    setOpen(false);
  };

  return (
    <div className={styles.banner} role="region" aria-label="Cookie preferences">
      <p className={styles.text}>
        We'd like to use analytics cookies to see which pages help visitors. They only load if you accept. See our{' '}
        <Link to="/privacy">privacy policy</Link>.
      </p>
      <div className={styles.actions}>
        <Button variant="secondary" size="sm" onClick={() => choose('declined')}>
          Decline
        </Button>
        <Button size="sm" onClick={() => choose('accepted')}>
          Accept
        </Button>
      </div>
    </div>
  );
}

export function openConsentSettings() {
  window.dispatchEvent(new Event('trilane:open-consent'));
}

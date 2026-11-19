import { useSite } from '../context/SiteContext';
import Button from './Button';
import styles from './BookCall.module.css';

/**
 * "Book a call" link to the team's shared booking page. It renders nothing
 * until a booking link is saved in the admin Settings page.
 * variant: "button" (just the button) or "panel" (short heading, text and button).
 */
export default function BookCall({ variant = 'button', size = 'lg', buttonVariant = 'secondary' }) {
  const { site } = useSite();
  const url = site?.bookingUrl;
  if (!url) return null;

  const button = (
    <Button href={url} target="_blank" rel="noopener noreferrer" variant={buttonVariant} size={size}>
      Book a call
      <span className="visually-hidden"> (opens the booking page in a new tab)</span>
    </Button>
  );

  if (variant !== 'panel') return button;
  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Prefer to talk first?</h2>
      <p className="muted">Pick a time that suits you for a short call.</p>
      {button}
    </div>
  );
}

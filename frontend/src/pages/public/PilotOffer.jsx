import Button from '../../components/Button';
import { useSite } from '../../context/SiteContext';
import { formatMoney } from '../../utils/format';
import { contactLink } from '../../utils/leadSource';
import styles from './PilotOffer.module.css';

/**
 * Pilot pricing for the Launch Bundle. Renders nothing when the offer is off
 * or full. `variant="band"` is the full-width dark section used on Home.
 */
export default function PilotOffer({ ctaName, variant = 'card' }) {
  const { site } = useSite();
  const pilot = site?.pilot;
  if (!pilot?.active) return null;
  const spots = pilot.spotsRemaining;

  const content = (
    <div className={styles.pilot}>
      <div className={styles.copy}>
        <p className={styles.tag}>
          <span className={styles.live} aria-hidden="true" />
          Pilot pricing · {spots} {spots === 1 ? 'spot' : 'spots'} remaining
        </p>
        <h2 className={styles.title}>
          {pilot.serviceName} for {formatMoney(pilot.price)}
          <span className={styles.was}>
            <span className="visually-hidden">instead of </span>
            <s>{formatMoney(pilot.regularPrice)}</s>
          </span>
        </h2>
        <p className={styles.text}>
          For our first clients: a Foundation Website plus 60 days of Operations Support — Light, in exchange for a
          short testimonial and permission to use the project as a case study.
        </p>
      </div>
      <Button size="lg" arrow to={contactLink({ service: pilot.serviceSlug, cta: ctaName })} className={`${styles.button} sheen`}>
        Claim a pilot spot
      </Button>
    </div>
  );

  if (variant === 'band') {
    return (
      <section className={styles.band} aria-label="Pilot offer">
        <div className="container">{content}</div>
      </section>
    );
  }
  return <div className={styles.card}>{content}</div>;
}

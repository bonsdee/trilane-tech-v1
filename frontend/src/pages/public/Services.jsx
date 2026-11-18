import { Link } from 'react-router-dom';
import { getPublicServices } from '../../api/services';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Reveal from '../../components/Reveal';
import { Bone, SkeletonCard, SkeletonGroup } from '../../components/Skeleton';
import { EmptyState, ErrorState } from '../../components/States';
import { useSite } from '../../context/SiteContext';
import { useFetch } from '../../hooks/useFetch';
import { usePageMeta } from '../../hooks/usePageMeta';
import { formatMoney, formatPrice } from '../../utils/format';
import { contactLink } from '../../utils/leadSource';
import PageHeader from './PageHeader';
import PilotOffer from './PilotOffer';
import styles from './Services.module.css';

function Check() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className={styles.icon}>
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className={styles.iconMuted}>
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ServiceCard({ service, pilot }) {
  const included = service.items.filter((i) => i.kind === 'INCLUDED');
  const excluded = service.items.filter((i) => i.kind === 'NOT_INCLUDED');
  const hasPilot = pilot?.active && pilot.serviceSlug === service.slug;
  const featured = service.slug === FEATURED_SLUG;
  return (
    <article id={service.slug} className={`${styles.card} spotlight ${featured ? `${styles.featured} sheen` : ''}`}>
      {featured && <p className={styles.ribbon}>Recommended first offer</p>}
      <div className={styles.cardHead}>
        <h3 className={styles.name}>{service.name}</h3>
        {hasPilot && <Badge tone="accent">Pilot price available</Badge>}
      </div>
      <p className={styles.price}>{formatPrice(service.price, service.billingPeriod)}</p>
      {service.regularPrice && Number(service.regularPrice) > Number(service.price) && (
        <p className={styles.saving}>
          {formatMoney(service.regularPrice)}
          {service.billingPeriod === 'MONTHLY' ? ' / month' : ''} if bought separately
        </p>
      )}
      <dl className={styles.facts}>
        {service.timeline && (
          <div>
            <dt>Timeline</dt>
            <dd>{service.timeline}</dd>
          </div>
        )}
        {service.hours && (
          <div>
            <dt>Hours</dt>
            <dd>Up to {service.hours} hours a month</dd>
          </div>
        )}
        {service.idealFor && (
          <div>
            <dt>Ideal for</dt>
            <dd>{service.idealFor}</dd>
          </div>
        )}
      </dl>
      {service.summary && <p className={styles.summary}>{service.summary}</p>}
      {included.length > 0 && (
        <div className={styles.listBlock}>
          <h4 className={styles.listTitle}>Includes</h4>
          <ul className={styles.list}>
            {included.map((item, i) => (
              <li key={i}>
                <Check />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {excluded.length > 0 && (
        <div className={styles.listBlock}>
          <h4 className={styles.listTitle}>Not included</h4>
          <ul className={`${styles.list} ${styles.listMuted}`}>
            {excluded.map((item, i) => (
              <li key={i}>
                <Cross />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.cardAction}>
        <Button arrow variant={service.category === 'BUNDLE' ? 'primary' : 'secondary'} to={contactLink({ service: service.slug, cta: `services-${service.slug}`, from: '/services' })}>
          Ask about {service.name}
        </Button>
      </div>
    </article>
  );
}

/** The package the packages document names as the recommended first offer. */
const FEATURED_SLUG = 'launch-bundle';

const INTROS = {
  ONE_TIME: 'Fixed-price projects with a set timeline.',
  RETAINER: 'Monthly support you can start, change or stop.',
  BUNDLE: 'Combined packages that cost less than buying the parts separately.',
};

export default function Services() {
  usePageMeta({
    title: 'Services & Pricing',
    description:
      'Websites from $2,800, landing pages from $1,200, monthly website care and operations support, and bundles. Clear prices in US dollars.',
    path: '/services',
  });
  const { site } = useSite();
  const { data, loading, error, reload } = useFetch(getPublicServices, []);
  const groups = (data || []).filter((g) => g.services.length > 0);

  return (
    <>
      <PageHeader eyebrow="Services & Pricing" title="Pick a lane, or combine them.">
        Every price is published here, in US dollars, with what is and isn't included.
      </PageHeader>
      {(loading || error || groups.length === 0) && (
        <div className="container">
          {loading && (
            <SkeletonGroup label="Loading services…" className={styles.skeleton}>
              <Bone width="40%" height={30} />
              <Bone width="60%" />
              <div className={styles.grid}>
                {[0, 1, 2].map((i) => (
                  <SkeletonCard key={i} className={styles.card} title="50%" lines={6}>
                    <Bone width="35%" height={28} />
                  </SkeletonCard>
                ))}
              </div>
            </SkeletonGroup>
          )}
          {error && <ErrorState error={error} onRetry={reload} title="Services could not load." />}
          {!loading && !error && groups.length === 0 && (
            <EmptyState title="Services are being updated.">Please check back soon, or get in touch.</EmptyState>
          )}
        </div>
      )}
      {groups.map((group, index) => (
        <section
          key={group.category}
          className={`${styles.group} ${index % 2 === 0 ? styles.groupSurface : ''}`}
          aria-labelledby={`group-${group.category}`}
        >
          <div className="container">
            <Reveal className={styles.groupHead}>
              <p className={styles.groupNumber}>0{index + 1}</p>
              <div>
                <h2 id={`group-${group.category}`} className={styles.groupTitle}>
                  {group.label}
                </h2>
                <p className="muted">{INTROS[group.category]}</p>
              </div>
            </Reveal>
            {group.category === 'BUNDLE' && (
              <Reveal className={styles.pilotWrap}>
                <PilotOffer ctaName="services-pilot" />
              </Reveal>
            )}
            <div className={styles.grid}>
              {group.services.map((service, i) => (
                <Reveal key={service.slug} delay={i * 70}>
                  <ServiceCard service={service} pilot={site?.pilot} />
                </Reveal>
              ))}
            </div>
            {group.category === 'ONE_TIME' && (
              <p className={styles.note}>
                <strong>Redesigns and larger sites (7+ pages):</strong> custom quote, starting at $3,400.{' '}
                <Link to={contactLink({ cta: 'services-custom-quote', from: '/services' })}>Ask for a quote</Link>
              </p>
            )}
          </div>
        </section>
      ))}
    </>
  );
}

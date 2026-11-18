import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { getPublicServices } from '../../api/services';
import { getPublicTeam } from '../../api/team';
import Button from '../../components/Button';
import CountUp from '../../components/CountUp';
import HeroVisual from '../../components/HeroVisual';
import LeadFlowDemo from '../../components/LeadFlowDemo';
import LaneArt from '../../components/LaneArt';
import Reveal from '../../components/Reveal';
import SkillsMarquee from '../../components/SkillsMarquee';
import { Bone, SkeletonCard, SkeletonGroup } from '../../components/Skeleton';
import { EmptyState, ErrorState } from '../../components/States';
import TeamAvatar from '../../components/TeamAvatar';
import { useFetch } from '../../hooks/useFetch';
import { useInView } from '../../hooks/useInView';
import { usePageMeta } from '../../hooks/usePageMeta';
import { formatPrice } from '../../utils/format';
import { contactLink } from '../../utils/leadSource';
import PilotOffer from './PilotOffer';
import styles from './Home.module.css';

const LANES = [
  {
    key: 'build',
    name: 'Build',
    title: 'A website that earns trust',
    text: 'Custom websites and focused landing pages, designed for phones first, with the basics of search set up from day one and a contact form that reaches you.',
    services: 'Foundation Website · Landing Page',
  },
  {
    key: 'convert',
    name: 'Convert',
    title: 'More inquiries from the visitors you already have',
    text: 'A focused sprint on an existing site: faster pages, on-page SEO fixes and clearer calls to action, with a summary of every change.',
    services: 'Website Optimization Sprint',
  },
  {
    key: 'operate',
    name: 'Operate',
    title: 'Someone to keep things running',
    text: 'Monthly care for your site, and hands-on help with lead triage, first replies, follow-ups and your CRM, so nothing slips through.',
    services: 'Website Care · Operations Support',
  },
];

// Facts from the published packages. Update these if the Foundation Website terms change.
const FACTS = [
  { value: '10–14', unit: 'days', label: 'business days from kickoff to a launched Foundation Website' },
  { value: '2', unit: 'rounds', label: 'of revisions included on websites and landing pages' },
  { value: '30', unit: 'days', label: 'of post-launch support for minor fixes' },
  { value: '$95', unit: '/hour', label: 'for extra support hours, and only with your approval' },
];

const HEADLINE = 'Websites that bring in leads, and the hands to follow them up.';

const STEPS = [
  { title: 'Kickoff', text: 'We agree the pages, scope and launch date for your Foundation Website.' },
  { title: 'Your content', text: 'Send your text and images within 10 business days, or add copywriting at $150 per page.' },
  { title: 'Design & build', text: 'Your site takes shape in 10–14 business days, with 2 rounds of revisions.' },
  { title: 'Launch', text: 'We set up on-page SEO, Google Analytics and Search Console, then go live.' },
  { title: 'Support & care', text: '30 days of minor fixes after launch, then optional Website Care at $200/month.' },
];

/** The project timeline; its line draws itself and the steps light up in turn once in view. */
function Steps() {
  const [ref, inView] = useInView({ threshold: 0.35 });
  return (
    <ol ref={ref} className={`${styles.steps} ${inView ? styles.drawn : ''}`}>
      {STEPS.map((step, i) => (
        <li key={step.title} className={styles.step} style={{ '--i': i }}>
          <span className={styles.stepNumber}>{i + 1}</span>
          <h3 className={styles.stepTitle}>{step.title}</h3>
          <p className={styles.stepText}>{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

function ServicesAtAGlance() {
  const { data, loading, error, reload } = useFetch(getPublicServices, []);
  if (loading) {
    return (
      <SkeletonGroup label="Loading services…" className={styles.glance}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} className={styles.glanceGroup} title="45%" lines={4} />
        ))}
      </SkeletonGroup>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} title="Services could not load." />;
  const groups = (data || []).filter((g) => g.services.length > 0);
  if (groups.length === 0) return <EmptyState title="Services are being updated.">Please check back soon, or get in touch.</EmptyState>;
  return (
    <div className={styles.glance}>
      {groups.map((group, i) => (
        <Reveal key={group.category} delay={i * 80} className={`${styles.glanceGroup} spotlight`}>
          <h3 className={styles.glanceTitle}>{group.label}</h3>
          <ul className={styles.glanceList}>
            {group.services.map((s) => (
              <li key={s.slug}>
                <Link to={`/services#${s.slug}`} className={styles.glanceItem}>
                  <span>{s.name}</span>
                  <span className={styles.glancePrice}>{formatPrice(s.price, s.billingPeriod)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </div>
  );
}

function TeamPreview() {
  const { data, loading, error, reload } = useFetch(getPublicTeam, []);
  if (loading) {
    return (
      <SkeletonGroup label="Loading the team…" className={styles.team}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.person} aria-hidden="true">
            <Bone width={112} height={112} round />
            <div style={{ display: 'grid', gap: 10, flex: 1 }}>
              <Bone width="80%" height={18} />
              <Bone width="60%" />
            </div>
          </div>
        ))}
      </SkeletonGroup>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} title="The team could not load." />;
  if (!data?.length) return null;
  return (
    <div className={styles.team}>
      {data.map((m, i) => (
        <Reveal key={m.id} delay={i * 80} className={`${styles.person} spotlight`}>
          <TeamAvatar name={m.fullName} photoUrl={m.photoUrl} size="lg" pattern={i} />
          <div>
            <p className={styles.personName}>{m.fullName}</p>
            {m.position && <p className={styles.personRole}>{m.position}</p>}
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export default function Home() {
  usePageMeta({ path: '/' });
  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <Reveal className={styles.heroCopy}>
            <p className="eyebrow">Websites and lead handling for small businesses</p>
            <h1 className={styles.heroTitle}>
              {HEADLINE.split(' ').map((word, i, words) => (
                <Fragment key={i}>
                  <span className={styles.word} style={{ animationDelay: `${120 + i * 55}ms` }}>
                    {word}
                  </span>
                  {/* The space sits between the animated words, not inside them, so every browser keeps it. */}
                  {i < words.length - 1 && ' '}
                </Fragment>
              ))}
            </h1>
            <p className={`lead ${styles.heroLead}`}>
              Trilane Tech builds and looks after websites for small businesses, startups and service businesses, then
              helps you turn the inquiries they bring into clients.
            </p>
            <div className={styles.heroActions}>
              <Button size="lg" arrow to={contactLink({ cta: 'home-hero-start', from: '/' })}>
                Start a project
              </Button>
              <Button size="lg" variant="secondary" to="/services">
                See services &amp; pricing
              </Button>
            </div>
          </Reveal>
          <Reveal delay={120} className={styles.heroArt}>
            <HeroVisual />
          </Reveal>
        </div>
      </section>

      <section className={styles.facts} aria-label="At a glance">
        <div className={`container ${styles.factsGrid}`}>
          {FACTS.map((f, i) => (
            <Reveal key={f.label} delay={i * 70} className={styles.fact}>
              <p className={styles.factValue}>
                <CountUp value={f.value} />
                <span className={styles.factUnit}>{f.unit}</span>
              </p>
              <p className={styles.factLabel}>{f.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <SkillsMarquee />

      <section className={`section ${styles.surface}`} aria-labelledby="lanes-title">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Three lanes of work</p>
            <h2 id="lanes-title" className={styles.sectionTitle}>
              Build it. Make it convert. Keep it running.
            </h2>
          </Reveal>
          <div className={styles.lanes}>
            {LANES.map((lane, i) => (
              <Reveal key={lane.name} delay={i * 90} className={`${styles.lane} spotlight`}>
                <LaneArt lane={lane.key} />
                <p className={styles.laneName}>
                  <span className={styles.laneNumber}>0{i + 1}</span>
                  {lane.name}
                </p>
                <h3 className={styles.laneTitle}>{lane.title}</h3>
                <p className="muted">{lane.text}</p>
                <p className={styles.laneServices}>{lane.services}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="flow-title">
        <div className="container">
          <Reveal className={styles.splitHead}>
            <div>
              <p className="eyebrow">After someone gets in touch</p>
              <h2 id="flow-title" className={styles.sectionTitle}>
                From first message to signed client.
              </h2>
            </div>
            <p className={`muted ${styles.flowIntro}`}>
              A website only pays off if every inquiry gets an answer. Here is how one can move, step by step.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <LeadFlowDemo />
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.divided}`} aria-labelledby="steps-title">
        <div className="container">
          <Reveal className={styles.splitHead}>
            <div>
              <p className="eyebrow">How a website project runs</p>
              <h2 id="steps-title" className={styles.sectionTitle}>
                From kickoff to launch in about three weeks.
              </h2>
            </div>
          </Reveal>
          <Steps />
        </div>
      </section>

      <section className={`section ${styles.surface}`} aria-labelledby="glance-title">
        <div className="container">
          <Reveal className={styles.splitHead}>
            <div>
              <p className="eyebrow">Services at a glance</p>
              <h2 id="glance-title" className={styles.sectionTitle}>
                Clear prices, published up front.
              </h2>
            </div>
            <Button variant="secondary" to="/services">
              Compare everything
            </Button>
          </Reveal>
          <ServicesAtAGlance />
        </div>
      </section>

      <PilotOffer ctaName="home-pilot" variant="band" />

      <section className="section" aria-labelledby="team-title">
        <div className="container">
          <Reveal className={styles.splitHead}>
            <div>
              <p className="eyebrow">The people</p>
              <h2 id="team-title" className={styles.sectionTitle}>
                Three people. One team you talk to directly.
              </h2>
            </div>
            <Button variant="secondary" to="/about">
              About us
            </Button>
          </Reveal>
          <TeamPreview />
        </div>
      </section>

      <section className={`section ${styles.closingSection}`}>
        <div className="container">
          <Reveal className={styles.closing}>
            <h2 className={styles.closingTitle}>Tell us what you need.</h2>
            <p className="lead">Share a few details about your business and we'll reply personally.</p>
            <Button size="lg" arrow to={contactLink({ cta: 'home-closing', from: '/' })}>
              Get in touch
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}

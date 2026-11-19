import { getPublicTeam } from '../../api/team';
import Button from '../../components/Button';
import ClampText from '../../components/ClampText';
import Reveal from '../../components/Reveal';
import { Bone, SkeletonCard, SkeletonGroup } from '../../components/Skeleton';
import { EmptyState, ErrorState } from '../../components/States';
import TeamAvatar from '../../components/TeamAvatar';
import { useFetch } from '../../hooks/useFetch';
import { usePageMeta } from '../../hooks/usePageMeta';
import { contactLink } from '../../utils/leadSource';
import PageHeader from './PageHeader';
import styles from './About.module.css';

const PRINCIPLES = [
  {
    title: 'Prices you can see',
    text: 'Every package is listed with its price, timeline and what is not included, before you ever talk to us.',
  },
  {
    title: 'You own your accounts',
    text: 'Hosting, your domain and software subscriptions sit in your own accounts and are paid by you directly.',
  },
  {
    title: 'Revisions built in',
    text: 'Websites and landing pages include two rounds of revisions, and new websites get 30 days of support after launch.',
  },
  {
    title: 'Extra work only with a yes',
    text: 'Operations support has a monthly hour cap. Extra hours are only used when you approve them.',
  },
];

function Team() {
  const { data, loading, error, reload } = useFetch(getPublicTeam, [], { seed: 'team' });
  if (loading) {
    return (
      <SkeletonGroup label="Loading the team…" className={styles.team}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.member} aria-hidden="true">
            <Bone height="auto" className={styles.photoBone} />
            <SkeletonCard title="70%" lines={4}>
              <Bone width="45%" />
            </SkeletonCard>
          </div>
        ))}
      </SkeletonGroup>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} title="The team could not load." />;
  if (!data?.length) return <EmptyState title="Team profiles are on their way." />;
  return (
    <div className={styles.team}>
      {data.map((m, i) => (
        <Reveal key={m.id} delay={i * 80} as="article" className={`${styles.member} spotlight`}>
          <TeamAvatar name={m.fullName} photoUrl={m.photoUrl} size="xl" pattern={i} />
          <div className={styles.memberText}>
            <h3 className={styles.memberName}>{m.fullName}</h3>
            {m.position && <p className={styles.position}>{m.position}</p>}
            {m.bio && <ClampText className={styles.bio}>{m.bio}</ClampText>}
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export default function About() {
  usePageMeta({
    title: 'About',
    description:
      'Trilane Tech is a three-person team that builds websites for small businesses and helps handle the leads they bring in.',
    path: '/about',
  });
  return (
    <>
      <PageHeader
        eyebrow="About Trilane Tech"
        title="A small team for the whole path to a client."
        note={
          <p className={styles.location}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
              <circle cx="12" cy="10" r="2.4" />
            </svg>
            <span>
              We're based in Cebu, Philippines (GMT+8) and overlap with US mornings and Australian business hours. Most
              replies go out within one business day.
            </span>
          </p>
        }
      >
        Most small businesses need more than a website. They need visitors to get in touch, and someone to answer when
        they do. Trilane Tech covers all three lanes: building the site, making it convert, and helping run what happens
        after someone reaches out.
      </PageHeader>

      <section className={`section ${styles.surface}`}>
        <div className="container">
          <Reveal>
            <h2 className={styles.sectionTitle}>How we work</h2>
          </Reveal>
          <div className={styles.principles}>
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.title} delay={i * 70} className={`${styles.principle} spotlight`}>
                <h3 className={styles.principleTitle}>{p.title}</h3>
                <p className="muted">{p.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="team-heading">
        <div className="container">
          <Reveal>
            <h2 id="team-heading" className={styles.sectionTitle}>
              The team
            </h2>
            <p className={`muted ${styles.sectionIntro}`}>You work with the same three people from first message to launch and beyond.</p>
          </Reveal>
          <Team />
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <Reveal className={styles.cta}>
            <h2 className={styles.ctaTitle}>Want to work together?</h2>
            <Button size="lg" arrow to={contactLink({ cta: 'about-contact', from: '/about' })}>
              Get in touch
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}

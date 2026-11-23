import { Link } from 'react-router-dom';
import { fileUrl } from '../../api/client';
import { getPublicPortfolio } from '../../api/portfolio';
import Reveal from '../../components/Reveal';
import { LoadingBlock } from '../../components/Spinner';
import { Bone, SkeletonGroup } from '../../components/Skeleton';
import { EmptyState, ErrorState } from '../../components/States';
import { useSite } from '../../context/SiteContext';
import { useFetch } from '../../hooks/useFetch';
import { usePageMeta } from '../../hooks/usePageMeta';
import PageHeader from './PageHeader';
import NotFound from './NotFound';
import styles from './Portfolio.module.css';

export default function Portfolio() {
  const { site, loading: siteLoading } = useSite();
  usePageMeta({ title: 'Work', description: 'Selected projects and concept sites by Trilane Tech.', path: '/portfolio' });
  const { data, loading, error, reload } = useFetch(getPublicPortfolio, []);

  if (siteLoading) return <LoadingBlock />;
  // The portfolio stays hidden until the first project is published.
  if (site && !site.portfolioVisible) return <NotFound />;

  const hasConcepts = (data || []).some((p) => p.concept);
  return (
    <>
      <PageHeader eyebrow="Work" title="Selected work.">
        A look at our work and what each project set out to do.
        {hasConcepts && ' Projects marked "Concept" were built to show our approach, not for a client.'}
      </PageHeader>
      <div className="container">
        {loading && (
          <SkeletonGroup label="Loading projects…" className={styles.grid}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.card} aria-hidden="true">
                <Bone height="auto" className={styles.cover} />
                <div className={styles.body} style={{ display: 'grid', gap: 10 }}>
                  <Bone width="60%" height={20} />
                  <Bone />
                  <Bone width="70%" />
                </div>
              </div>
            ))}
          </SkeletonGroup>
        )}
        {error && <ErrorState error={error} onRetry={reload} title="Projects could not load." />}
        {!loading && !error && data?.length === 0 && <EmptyState title="No projects to show yet." />}
        <div className={styles.grid}>
          {(data || []).map((p, i) => (
            <Reveal key={p.slug} delay={i * 70}>
              <Link to={`/portfolio/${p.slug}`} className={styles.card}>
                <div className={styles.cover}>
                  {p.coverUrl ? (
                    <img src={fileUrl(p.coverUrl)} alt="" loading="lazy" />
                  ) : (
                    <span className={styles.coverFallback} aria-hidden="true">
                      {p.title}
                    </span>
                  )}
                </div>
                <div className={styles.body}>
                  {(p.concept || p.serviceName) && (
                    <p className={styles.service}>
                      {p.concept && <span className={styles.concept}>Concept</span>}
                      {p.serviceName}
                    </p>
                  )}
                  <h2 className={styles.title}>{p.title}</h2>
                  {p.clientName && <p className="muted">{p.clientName}</p>}
                  {p.summary && <p className={styles.summary}>{p.summary}</p>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}

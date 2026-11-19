import { getPublicFaqs } from '../../api/faqs';
import Button from '../../components/Button';
import Reveal from '../../components/Reveal';
import { Bone, SkeletonGroup } from '../../components/Skeleton';
import { EmptyState, ErrorState } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import { usePageMeta } from '../../hooks/usePageMeta';
import { contactLink } from '../../utils/leadSource';
import PageHeader from './PageHeader';
import styles from './Faq.module.css';

export default function Faq() {
  usePageMeta({
    title: 'FAQ',
    description: 'Answers about timelines, revisions, content, hosting, support and pricing at Trilane Tech.',
    path: '/faq',
  });
  const { data, loading, error, reload } = useFetch(getPublicFaqs, [], { seed: 'faqs' });
  return (
    <>
      <PageHeader eyebrow="FAQ" title="Questions, answered.">
        The practical details: timelines, revisions, what you provide and what's included.
      </PageHeader>
      <div className={`container ${styles.wrap}`}>
        {loading && (
          <SkeletonGroup label="Loading questions…" className={styles.list}>
            {[72, 58, 80, 64, 52, 70].map((w) => (
              <div key={w} className={`${styles.item} ${styles.question}`} aria-hidden="true">
                <Bone width={`${w}%`} height={20} />
              </div>
            ))}
          </SkeletonGroup>
        )}
        {error && <ErrorState error={error} onRetry={reload} title="Questions could not load." />}
        {!loading && !error && data?.length === 0 && <EmptyState title="No questions here yet." />}
        {data?.length > 0 && (
          <div className={styles.list}>
            {data.map((faq, i) => (
              <Reveal key={faq.id} delay={Math.min(i, 6) * 40}>
                <details className={styles.item}>
                  <summary className={styles.question}>
                    <span>{faq.question}</span>
                    <span className={styles.chevron} aria-hidden="true" />
                  </summary>
                  <p className={styles.answer}>{faq.answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        )}
        <Reveal className={styles.more}>
          <p>Didn't find your answer?</p>
          <Button variant="secondary" to={contactLink({ cta: 'faq-ask', from: '/faq' })}>
            Ask us directly
          </Button>
        </Reveal>
      </div>
    </>
  );
}

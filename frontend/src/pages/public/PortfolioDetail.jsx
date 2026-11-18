import { Link, useParams } from 'react-router-dom';
import { fileUrl } from '../../api/client';
import { getPublicProject } from '../../api/portfolio';
import Button from '../../components/Button';
import Reveal from '../../components/Reveal';
import { LoadingBlock } from '../../components/Spinner';
import { ErrorState } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import { usePageMeta } from '../../hooks/usePageMeta';
import { formatDate } from '../../utils/format';
import { contactLink } from '../../utils/leadSource';
import NotFound from './NotFound';
import styles from './Portfolio.module.css';

export default function PortfolioDetail() {
  const { slug } = useParams();
  const { data: project, loading, error, reload } = useFetch(() => getPublicProject(slug), [slug]);
  usePageMeta({
    title: project?.title || 'Project',
    description: project?.summary || 'A project by Trilane Tech.',
    path: `/portfolio/${slug}`,
  });

  if (loading) return <LoadingBlock label="Loading project…" />;
  if (error?.response?.status === 404) return <NotFound />;
  if (error)
    return (
      <div className="container section">
        <ErrorState error={error} onRetry={reload} title="This project could not load." />
      </div>
    );

  return (
    <article className="section">
      <div className="container">
        <Link to="/portfolio" className={styles.back}>
          ← All projects
        </Link>
        <Reveal className={styles.detailHead}>
          {project.serviceName && <p className={styles.service}>{project.serviceName}</p>}
          <h1>{project.title}</h1>
          {project.summary && <p className="lead">{project.summary}</p>}
          <div className={styles.meta}>
            {project.clientName && <span>Client: {project.clientName}</span>}
            {project.completedOn && <span>Completed {formatDate(project.completedOn)}</span>}
          </div>
        </Reveal>
        {project.coverUrl && (
          <Reveal className={styles.heroImage}>
            <img src={fileUrl(project.coverUrl)} alt={`${project.title} cover`} />
          </Reveal>
        )}
        {project.description && <Reveal className={styles.description}>{project.description}</Reveal>}
        {project.images?.length > 0 && (
          <div className={styles.gallery}>
            {project.images.map((img, i) => (
              <Reveal as="figure" key={`${img.fileId}-${i}`} delay={i * 60}>
                <img src={fileUrl(img.url)} alt={img.altText || ''} loading="lazy" />
                {img.altText && <figcaption>{img.altText}</figcaption>}
              </Reveal>
            ))}
          </div>
        )}
        <div className={styles.detailActions}>
          {project.projectUrl && (
            <Button variant="secondary" href={project.projectUrl} target="_blank" rel="noopener noreferrer">
              Visit the live site
            </Button>
          )}
          <Button to={contactLink({ service: project.serviceSlug, cta: `portfolio-${project.slug}`, from: `/portfolio/${project.slug}` })}>
            Start a similar project
          </Button>
        </div>
      </div>
    </article>
  );
}

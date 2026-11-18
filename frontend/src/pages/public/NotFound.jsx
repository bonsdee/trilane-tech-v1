import Button from '../../components/Button';
import { usePageMeta } from '../../hooks/usePageMeta';
import styles from './NotFound.module.css';

export default function NotFound() {
  usePageMeta({ title: 'Page not found', noindex: true });
  return (
    <section className={`section ${styles.wrap}`}>
      <div className="container">
        <p className="eyebrow">404</p>
        <h1 className={styles.title}>This page isn't here.</h1>
        <p className="lead">The address may have changed, or the page was never published.</p>
        <div className={styles.actions}>
          <Button to="/">Go to the home page</Button>
          <Button variant="secondary" to="/services">
            See services
          </Button>
        </div>
      </div>
    </section>
  );
}

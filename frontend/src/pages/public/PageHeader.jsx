import Reveal from '../../components/Reveal';
import styles from './PageHeader.module.css';

export default function PageHeader({ eyebrow, title, children }) {
  return (
    <section className={styles.header}>
      <div className="container">
        <Reveal>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className={styles.title}>{title}</h1>
          {children && <div className={`lead ${styles.intro}`}>{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}

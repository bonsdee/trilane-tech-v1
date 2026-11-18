import { Link } from 'react-router-dom';
import Logo from '../../components/Logo';
import ThemeToggle from '../../components/ThemeToggle';
import { usePageMeta } from '../../hooks/usePageMeta';
import styles from './AuthShell.module.css';

/** Centered card used by sign-in, forgot-password and set-password. */
export default function AuthShell({ title, intro, children, metaTitle }) {
  usePageMeta({ title: metaTitle || title, noindex: true });
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link to="/" aria-label="Trilane Tech website">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className={`${styles.main} page-fade`}>
        <div className={styles.card}>
          <h1 className={styles.title}>{title}</h1>
          {intro && <p className={styles.intro}>{intro}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { getSignaturePage } from '../../api/signatures';
import { LoadingBlock } from '../../components/Spinner';
import { ErrorState } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import { useTheme } from '../../hooks/useTheme';
import a from './Admin.module.css';
import styles from './EmailSignatures.module.css';

// Prepares the page for the frame: it starts in the dashboard's light or dark
// theme (no flash), and its links open in a new tab instead of inside the frame.
const prepare = (html, theme) =>
  html
    .replace(/<html([^>]*)>/i, `<html$1 data-theme="${theme}">`)
    .replace(/<head([^>]*)>/i, '<head$1><base target="_blank">');

/**
 * The team's Gmail signature builder. The page comes from the API, so only
 * signed-in admins can see it; its images stay public at trilanetech.com/email/
 * because the people receiving our emails load them from there.
 */
export default function EmailSignatures() {
  const { data, loading, error, reload } = useFetch(getSignaturePage, []);
  const frame = useRef(null);
  const [height, setHeight] = useState(900);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  // Built once per load, so switching the theme doesn't reload the frame.
  const srcDoc = useMemo(() => (data ? prepare(data.html, themeRef.current) : ''), [data]);

  // Follow the dashboard's theme switch while the page is open.
  useEffect(() => {
    frame.current?.contentDocument?.documentElement?.setAttribute('data-theme', theme);
  }, [theme]);

  // Grow the frame with its content so the page scrolls as one.
  useEffect(() => {
    const el = frame.current;
    if (!el || !data) return undefined;
    let observer;
    const fit = () => {
      const doc = el.contentDocument;
      if (doc?.documentElement) setHeight(doc.documentElement.scrollHeight + 4);
    };
    const onLoad = () => {
      el.contentDocument?.documentElement?.setAttribute('data-theme', themeRef.current);
      fit();
      const body = el.contentDocument?.body;
      if (body && 'ResizeObserver' in window) {
        observer = new ResizeObserver(fit);
        observer.observe(body);
      }
    };
    el.addEventListener('load', onLoad);
    return () => {
      el.removeEventListener('load', onLoad);
      observer?.disconnect();
    };
  }, [data]);

  return (
    <>
      <div className={a.pageHead}>
        <div>
          <h1 className={a.pageTitle}>Email signatures</h1>
          <p className={a.pageIntro}>Only signed-in admins can open this page. The images stay public at trilanetech.com/email/.</p>
        </div>
      </div>
      {loading && !data && <LoadingBlock label="Loading signatures…" />}
      {error && !data && <ErrorState error={error} onRetry={reload} title="The signatures could not load." />}
      {data && (
        <iframe
          ref={frame}
          title="Email signature builder"
          className={styles.frame}
          srcDoc={srcDoc}
          allow="clipboard-write"
          style={{ height }}
        />
      )}
    </>
  );
}

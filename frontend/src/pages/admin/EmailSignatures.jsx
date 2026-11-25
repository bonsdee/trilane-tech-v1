import { useEffect, useRef, useState } from 'react';
import { getSignaturePage } from '../../api/signatures';
import { LoadingBlock } from '../../components/Spinner';
import { ErrorState } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import a from './Admin.module.css';
import styles from './EmailSignatures.module.css';

// Links inside the signature page (mail-tester, LinkedIn…) open in a new tab
// instead of replacing the page inside the frame.
const withNewTabLinks = (html) => html.replace(/<head([^>]*)>/i, '<head$1><base target="_blank">');

/**
 * The team's Gmail signature builder. The page comes from the API, so only
 * signed-in admins can see it; its images stay public at trilanetech.com/email/
 * because the people receiving our emails load them from there.
 */
export default function EmailSignatures() {
  const { data, loading, error, reload } = useFetch(getSignaturePage, []);
  const frame = useRef(null);
  const [height, setHeight] = useState(900);

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
          srcDoc={withNewTabLinks(data.html)}
          allow="clipboard-write"
          style={{ height }}
        />
      )}
    </>
  );
}

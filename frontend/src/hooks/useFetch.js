import { useCallback, useEffect, useRef, useState } from 'react';
import { readSeed } from '../prerender/seed';

/**
 * Runs an async loader and tracks loading, error and data, so every
 * data-driven section can show its loading, empty and error states.
 *
 * `options.seed` names data captured when the page was pre-rendered. When it
 * is there, the section shows it straight away and refreshes it quietly.
 */
export function useFetch(loader, deps = [], options = {}) {
  const seeded = readSeed(options.seed);
  const [state, setState] = useState(() =>
    seeded !== undefined ? { data: seeded, loading: false, error: null } : { data: null, loading: true, error: null },
  );
  const latest = useRef(0);
  const quiet = useRef(seeded !== undefined);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const load = useCallback(() => {
    const id = ++latest.current;
    const background = quiet.current;
    quiet.current = false;
    if (!background) setState((s) => ({ ...s, loading: true, error: null }));
    run()
      .then((data) => {
        if (id === latest.current) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        // A failed quiet refresh keeps the pre-rendered content.
        if (id === latest.current && !background) setState({ data: null, loading: false, error });
      });
  }, [run]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) };
}

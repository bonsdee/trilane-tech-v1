import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader and tracks loading, error and data, so every
 * data-driven section can show its loading, empty and error states.
 */
export function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const latest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const load = useCallback(() => {
    const id = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    run()
      .then((data) => {
        if (id === latest.current) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (id === latest.current) setState({ data: null, loading: false, error });
      });
  }, [run]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) };
}

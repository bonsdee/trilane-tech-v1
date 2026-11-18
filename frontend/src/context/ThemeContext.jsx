import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage } from '../utils/storage';

export const ThemeContext = createContext(null);
const KEY = 'trilane-theme';

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Follows the device setting until the visitor picks a theme, then remembers it. */
export function ThemeProvider({ children }) {
  const [choice, setChoice] = useState(() => {
    const saved = readStorage(KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  });
  const [system, setSystem] = useState(systemTheme);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return undefined;
    const listener = () => setSystem(query.matches ? 'dark' : 'light');
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (choice) root.setAttribute('data-theme', choice);
    else root.removeAttribute('data-theme');
  }, [choice]);

  const theme = choice || system;
  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setChoice(next);
    writeStorage(KEY, next);
  }, [theme]);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

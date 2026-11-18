import { createContext, useContext } from 'react';
import { getSite } from '../api/site';
import { useFetch } from '../hooks/useFetch';

const SiteContext = createContext({ site: null, loading: true, error: null });

/** Pilot offer state and portfolio visibility, loaded once for the public site. */
export function SiteProvider({ children }) {
  const { data, loading, error, reload } = useFetch(getSite, []);
  return <SiteContext.Provider value={{ site: data, loading, error, reload }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

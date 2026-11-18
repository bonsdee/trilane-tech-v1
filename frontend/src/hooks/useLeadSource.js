import { useEffect } from 'react';
import { captureLeadSource, getLeadSource } from '../utils/leadSource';

/** Captures the visit's source on first load and returns it. */
export function useLeadSource() {
  useEffect(() => {
    captureLeadSource();
  }, []);
  return getLeadSource;
}

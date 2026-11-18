import { readStorage, writeStorage } from './storage';

const KEY = 'trilane-lead-source';

/**
 * Remembers how the visitor first arrived in this browser session: the
 * referring site and any ad campaign tags (UTM parameters). Captured once,
 * on the first page view, and sent along with the contact form.
 */
export function captureLeadSource() {
  if (readStorage(KEY, 'session')) return;
  const params = new URLSearchParams(window.location.search);
  let referrer = document.referrer || '';
  try {
    if (referrer && new URL(referrer).origin === window.location.origin) referrer = '';
  } catch {
    referrer = '';
  }
  const source = {
    referrer: referrer.slice(0, 500),
    utmSource: (params.get('utm_source') || '').slice(0, 120),
    utmMedium: (params.get('utm_medium') || '').slice(0, 120),
    utmCampaign: (params.get('utm_campaign') || '').slice(0, 120),
    landingPage: window.location.pathname.slice(0, 255),
  };
  writeStorage(KEY, JSON.stringify(source), 'session');
}

export function getLeadSource() {
  try {
    return JSON.parse(readStorage(KEY, 'session')) || {};
  } catch {
    return {};
  }
}

/**
 * Link to the contact form that records which page and button it came from,
 * and optionally pre-selects a service.
 */
export function contactLink({ service, cta, from } = {}) {
  const params = new URLSearchParams();
  if (service) params.set('service', service);
  if (cta) params.set('cta', cta);
  params.set('from', from || window.location.pathname);
  return `/contact?${params.toString()}`;
}

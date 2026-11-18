import { readStorage, writeStorage } from './storage';

export const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
const CONSENT_KEY = 'trilane-analytics-consent';
let loaded = false;

/** 'accepted', 'declined' or null when the visitor has not chosen yet. */
export function getConsent() {
  const value = readStorage(CONSENT_KEY);
  return value === 'accepted' || value === 'declined' ? value : null;
}

export function setConsent(value) {
  writeStorage(CONSENT_KEY, value);
  if (value === 'accepted') loadAnalytics();
  if (value === 'declined' && GA_ID) {
    // Stops collection for the rest of this visit if it was already running.
    window[`ga-disable-${GA_ID}`] = true;
  }
}

/** Loads Google Analytics, only when an ID is configured and the visitor accepted. */
export function loadAnalytics() {
  if (!GA_ID || loaded || getConsent() !== 'accepted') return;
  loaded = true;
  window[`ga-disable-${GA_ID}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
  // Count the page the visitor is on when analytics starts.
  trackPageView(window.location.pathname);
}

export function trackPageView(path) {
  if (!loaded || !window.gtag) return;
  window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: document.title });
}

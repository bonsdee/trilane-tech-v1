import { useEffect } from 'react';

const SITE_NAME = 'Trilane Tech';
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://trilanetech.com').replace(/\/$/, '');
const DEFAULT_DESCRIPTION =
  'Trilane Tech builds websites and landing pages for small businesses, startups and service businesses, and helps handle the leads they bring in.';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Sets the page title, description, canonical address and sharing tags. */
export function usePageMeta({ title, description = DEFAULT_DESCRIPTION, path, noindex = false } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Websites that bring in leads`;
    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', `${SITE_URL}/og-image.png`);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:image', `${SITE_URL}/og-image.png`);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setCanonical(url);
  }, [title, description, path, noindex]);
}

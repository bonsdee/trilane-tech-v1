// Data captured at build time for pre-rendered pages. The build script puts it
// in each page as window.__TRILANE_DATA__; during the build render it is set on
// globalThis. Pages use it to show content straight away, then refresh it.
export const IS_SERVER = typeof window === 'undefined';

export function readSeed(key) {
  if (!key) return undefined;
  const store = globalThis.__TRILANE_DATA__;
  return store && Object.prototype.hasOwnProperty.call(store, key) ? store[key] : undefined;
}

/** The path being pre-rendered (build time) or the current path (browser). */
export function currentPath() {
  return IS_SERVER ? globalThis.__TRILANE_PATH__ || '/' : window.location.pathname;
}

// Browser storage can be unavailable (private modes, blocked cookies), so
// every access is wrapped and failures fall back to "nothing stored".
export function readStorage(key, area = 'local') {
  try {
    return (area === 'session' ? window.sessionStorage : window.localStorage).getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key, value, area = 'local') {
  try {
    const store = area === 'session' ? window.sessionStorage : window.localStorage;
    if (value === null || value === undefined) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    /* storage unavailable; ignore */
  }
}

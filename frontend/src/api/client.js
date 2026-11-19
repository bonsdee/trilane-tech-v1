import axios from 'axios';

/** Base address of the backend API, for example https://api.trilanetech.com/api/v1 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');

/** Host part of the API, used to turn "/api/v1/files/12" into a full image address. */
const API_ORIGIN = new URL(API_BASE_URL, typeof window === 'undefined' ? 'https://trilanetech.com' : window.location.href).origin;

export function fileUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

// The access token lives in memory only. A page reload asks /auth/refresh for
// a new one using the HttpOnly refresh cookie.
let accessToken = null;
let onSessionEnded = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function setSessionEndedHandler(handler) {
  onSessionEnded = handler;
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

function needsAuth(url = '') {
  return url.startsWith('/admin') || url === '/auth/me';
}

http.interceptors.request.use((config) => {
  if (accessToken && needsAuth(config.url)) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshing = null;

/** Gets a new access token; concurrent callers share one request. */
export function refreshSession() {
  if (!refreshing) {
    refreshing = http
      .post('/auth/refresh')
      .then((res) => {
        accessToken = res.data.data.accessToken;
        return res.data.data;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status === 401 && original && needsAuth(original.url) && !original._retried) {
      original._retried = true;
      try {
        await refreshSession();
        return http(original);
      } catch {
        accessToken = null;
        onSessionEnded();
      }
    }
    return Promise.reject(error);
  },
);

/** A readable message for any failed request. */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (error.response?.data?.error?.message) return error.response.data.error.message;
  if (error.code === 'ECONNABORTED') return 'The server took too long to answer. Please try again.';
  if (!error.response) return 'We could not reach the server. Check your connection and try again.';
  return fallback;
}

/** Per-field validation messages from the API, keyed by field name. */
export function fieldErrors(error) {
  return error?.response?.data?.error?.fields || {};
}

export function errorCode(error) {
  return error?.response?.data?.error?.code || null;
}

/** Unwraps the { data } envelope. */
export const unwrap = (res) => res.data.data;

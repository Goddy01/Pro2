/**
 * Backend API base URL. Defaults to Railway backend.
 * Set VITE_API_URL to override (e.g. empty string in dev to use Vite proxy to localhost:4000).
 */
const DEFAULT_API_BASE = 'https://sideline-se-be.up.railway.app';
export const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
    : typeof import.meta !== 'undefined' && import.meta.env?.DEV
    ? ''
    : DEFAULT_API_BASE;

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

const AUTH_SESSION_EXPIRED = 'auth:session-expired';

/** Dispatches event so AuthSessionHandler can logout and redirect. Call after detecting 401. */
export function notifySessionExpired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED));
  }
}

/**
 * Fetch with optional auth token. On 401 response, dispatches session-expired and returns the response.
 * Use this for all admin API calls so expired tokens trigger automatic logout and redirect to login.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  token: string | null
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) notifySessionExpired();
  return res;
}

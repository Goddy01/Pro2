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

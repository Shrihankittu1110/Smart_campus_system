const DEPLOYED_API_URL = 'https://smart-campus-system-1-3uz0.onrender.com';

export const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? DEPLOYED_API_URL : '')
).replace(/\/$/, '');

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};

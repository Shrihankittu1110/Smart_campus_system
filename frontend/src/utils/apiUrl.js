export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};

export const buildImgUrl = (path) => {
  if (!path) return null;
  if (typeof path !== 'string') return null;
  // Base64 and blob URLs are returned directly
  if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http')) return path;
  // fallback for any old /uploads paths still in DB
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}${path}`;
};

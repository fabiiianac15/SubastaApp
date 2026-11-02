const STATIC_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const mediaUrl = (url) => {
  if (!url) return null;
  return /^(https?:|data:|blob:)/.test(url) ? url : `${STATIC_BASE}${url}`;
};

export const coverOf = (auction) => {
  const imgs = auction?.imagenes || [];
  return mediaUrl((imgs.find((i) => i.esPortada) || imgs[0])?.url);
};

export const categoryLabel = (value, categorias = []) =>
  categorias.find((c) => c.value === value)?.label || value;

export const idOf = (x) => x?._id || x?.id;

export const toLocalInput = (date) => {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

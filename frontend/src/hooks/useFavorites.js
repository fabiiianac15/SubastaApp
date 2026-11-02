import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const read = (key) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(key)) || []);
  } catch {
    return new Set();
  }
};

export const useFavorites = () => {
  const { user } = useAuth();
  const key = `favorites_${user?._id}`;
  const [favorites, setFavorites] = useState(() => read(key));

  useEffect(() => setFavorites(read(key)), [key]);

  const toggle = useCallback(
    (id) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        try {
          localStorage.setItem(key, JSON.stringify([...next]));
        } catch {
          /* sin almacenamiento: los favoritos duran hasta recargar */
        }
        return next;
      });
    },
    [key]
  );

  return { favorites, toggle };
};

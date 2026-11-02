import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaHeart } from 'react-icons/fa';
import productService from '../../services/productService';
import AuctionDetailModal from '../../components/auctions/AuctionDetailModal';
import LotCard from '../../components/ui/LotCard';
import { LotSkeletons } from '../../components/ui/Controls';
import { useFavorites } from '../../hooks/useFavorites';
import { spring } from '../../lib/motion';

const FavoritesPage = () => {
  const { favorites, toggle } = useFavorites();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    productService
      .obtenerSubastas({ estado: 'todas', limite: 100, ordenar: '-createdAt' })
      .then((res) => alive && setAll(Array.isArray(res.data) ? res.data : []))
      .catch((e) => {
        console.error('Error loading favorites auctions', e);
        if (alive) setError(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const lots = all.filter((a) => favorites.has(a._id));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="display">Favoritos</h1>
          {!loading && lots.length > 0 && <p className="tnum">{lots.length} {lots.length === 1 ? 'guardada' : 'guardadas'}</p>}
        </div>
      </header>
      {error ? (
        <p className="alert alert--error" role="alert">No pudimos cargar tus favoritos.</p>
      ) : loading ? (
        <LotSkeletons count={4} />
      ) : lots.length === 0 ? (
        <div className="empty">
          <motion.span className="empty__art" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.pop}><FaHeart size={40} /></motion.span>
          <h2 className="display">Sin guardadas todavía</h2>
          <p>Marca el corazón de un lote para seguirle la pista hasta el cierre.</p>
          <Link to="/dashboard/auctions" className="btn btn--primary">Explorar subastas</Link>
        </div>
      ) : (
        <div className="lot-grid">
          <AnimatePresence mode="popLayout">
            {lots.map((a, i) => <LotCard key={a._id} auction={a} index={i} isFavorite onToggleFavorite={toggle} onOpen={setSelected} />)}
          </AnimatePresence>
        </div>
      )}
      <AuctionDetailModal
        open={!!selected}
        auction={selected}
        onClose={() => setSelected(null)}
        onBidSuccess={(n) => setAll((p) => p.map((a) => (a._id === selected?._id ? { ...a, precioActual: n?.monto, numeroOfertas: (a.numeroOfertas || 0) + 1 } : a)))}
      />
    </div>
  );
};

export default FavoritesPage;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FaMagic } from 'react-icons/fa';
import productService from '../../services/productService';
import AuctionDetailModal from '../../components/auctions/AuctionDetailModal';
import LotCard from '../../components/ui/LotCard';
import { LotSkeletons } from '../../components/ui/Controls';
import { useFavorites } from '../../hooks/useFavorites';

const RecommendationsPage = () => {
  const { favorites, toggle } = useFavorites();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    productService
      .obtenerSubastas({ pagina: 1, limite: 12 })
      .then((res) => alive && setLots(res.data || []))
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="display">Para ti</h1>
          <p>Por ahora, las subastas publicadas más recientemente.</p>
        </div>
      </header>
      {error ? (
        <p className="alert alert--error" role="alert">No pudimos cargar esta selección.</p>
      ) : loading ? (
        <LotSkeletons count={8} />
      ) : lots.length === 0 ? (
        <div className="empty">
          <FaMagic size={36} className="empty__art" />
          <h2 className="display">Nada por ahora</h2>
          <p>Cuando se publiquen subastas nuevas aparecerán aquí.</p>
          <Link to="/dashboard/auctions" className="btn">Ir a explorar</Link>
        </div>
      ) : (
        <div className="lot-grid">
          <AnimatePresence>
            {lots.map((a, i) => <LotCard key={a._id} auction={a} index={i} isFavorite={favorites.has(a._id)} onToggleFavorite={toggle} onOpen={setSelected} />)}
          </AnimatePresence>
        </div>
      )}
      <AuctionDetailModal
        open={!!selected}
        auction={selected}
        onClose={() => setSelected(null)}
        onBidSuccess={(n) => setLots((p) => p.map((a) => (a._id === selected?._id ? { ...a, precioActual: n?.monto, numeroOfertas: (a.numeroOfertas || 0) + 1 } : a)))}
      />
    </div>
  );
};

export default RecommendationsPage;

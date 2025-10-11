import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaEye, FaGavel, FaHeart, FaRegHeart, FaUsers } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import './AuctionsPage.css';
import AuctionDetailModal from '../../components/auctions/AuctionDetailModal';

const FavoritesPage = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  // Read favorites for current user
  useEffect(() => {
    const saved = localStorage.getItem(`favorites_${user?._id}`);
    setFavorites(new Set(saved ? JSON.parse(saved) : []));
  }, [user]);

  // Fetch auctions that are in favorites
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (favorites.size === 0) {
          setAuctions([]);
          return;
        }
        // If backend supports filtering by ids, pass them; otherwise fetch and filter client-side
        const params = { estado: 'todas', limite: 100, ordenar: '-createdAt' };
        const res = await productService.obtenerSubastas(params);
        const data = Array.isArray(res.data) ? res.data : [];
        const favSet = new Set(favorites);
        setAuctions(data.filter(a => favSet.has(a._id)));
      } catch (e) {
        console.error('Error loading favorites auctions', e);
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [favorites]);

  const toggleFavorite = (auctionId) => {
    const next = new Set(favorites);
    if (next.has(auctionId)) next.delete(auctionId); else next.add(auctionId);
    setFavorites(next);
    if (user?._id) {
      localStorage.setItem(`favorites_${user._id}`, JSON.stringify([...next]));
    }
    // Also update local auctions list
    setAuctions(prev => prev.filter(a => next.has(a._id)));
  };

  const STATIC_BASE = useMemo(() => (process.env.REACT_APP_API_URL?.replace('/api','')) || 'http://localhost:5000', []);

  const AuctionCard = ({ auction }) => {
    const timeRemaining = productService.calcularTiempoRestante(auction.fechaFin);
    const isFavorite = favorites.has(auction._id);
    return (
      <motion.div className="auction-card-modern" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
        <div className="auction-image-container">
          {auction.imagenes && auction.imagenes.length > 0 ? (
            <img
              src={auction.imagenes[0].url?.startsWith('http') ? auction.imagenes[0].url : `${STATIC_BASE}${auction.imagenes[0].url}`}
              alt={auction.titulo}
              className="auction-image-modern"
              onError={(e) => { e.currentTarget.src = '/logo512.png'; }}
            />
          ) : (
            <div className="auction-placeholder"><FaGavel /></div>
          )}
          <button className={`favorite-btn ${isFavorite ? 'active' : ''}`} onClick={() => toggleFavorite(auction._id)}>
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
          {timeRemaining && timeRemaining.total > 0 && (
            <div className="time-remaining">
              <FaClock />
              {productService.formatearTiempo(timeRemaining)}
            </div>
          )}
        </div>
        <div className="auction-content">
          <h3 className="auction-title">{auction.titulo}</h3>
          <p className="auction-category">{auction.categoria}</p>
          <div className="auction-price">
            <span className="current-price">{productService.formatearMoneda(auction.precioActual || auction.precioInicial)}</span>
            <span className="price-label">Precio actual</span>
          </div>
          <div className="auction-stats">
            <div className="stat"><FaUsers /> <span>{auction.numeroOfertas || 0} ofertas</span></div>
            <div className="stat"><FaEye /> <span>{auction.vistas || 0} vistas</span></div>
          </div>
          <button className="view-auction-btn" onClick={() => { setSelected(auction); setOpen(true); }}>
            <FaEye /> Ver Detalles
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <Layout currentPage="favorites">
      <div className="auctions-page">
        <div className="page-header">
          <div className="header-content">
            <h1>Mis Favoritos</h1>
            <p>Subastas que has marcado con ❤️</p>
          </div>
        </div>
        <div className="auctions-content">
          {loading ? (
            <div className="loading-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="auction-skeleton" />
              ))}
            </div>
          ) : auctions.length > 0 ? (
            <div className="auctions-grid grid">
              {auctions.map(a => (
                <AuctionCard key={a._id} auction={a} />
              ))}
            </div>
          ) : (
            <div className="no-results" style={{ textAlign: 'center' }}>
              <FaHeart style={{ fontSize: '3rem', color: '#cbd5e0' }} />
              <h3>No tienes favoritos aún</h3>
              <p>Explora subastas y marca tus favoritas con el corazón</p>
            </div>
          )}
        </div>

        {/* Auction Detail Modal */}
        <AuctionDetailModal
          open={open}
          onClose={() => setOpen(false)}
          auction={selected}
          onBidSuccess={(nueva) => {
            // Refrescar datos de la subasta seleccionada en la lista (precioActual y numeroOfertas)
            setAuctions(prev => prev.map(a => a._id === (selected?._id) ? {
              ...a,
              precioActual: Math.max(a.precioActual || a.precioInicial || 0, nueva.monto || 0),
              numeroOfertas: (a.numeroOfertas || 0) + 1
            } : a));
            setSelected(s => s ? {
              ...s,
              precioActual: Math.max(s.precioActual || s.precioInicial || 0, nueva.monto || 0),
              numeroOfertas: (s.numeroOfertas || 0) + 1
            } : s);
          }}
        />
      </div>
    </Layout>
  );
};

export default FavoritesPage;

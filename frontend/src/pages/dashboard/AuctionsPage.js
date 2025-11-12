import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaFilter, 
  FaSort, 
  FaTh, 
  FaList, 
  FaGavel,
  FaClock,
  FaUsers,
  FaEye,
  FaHeart,
  FaRegHeart,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { registrarClickCategoria } from '../../services/analyticsService';
import './AuctionsPage.css';

const AuctionsPage = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    categoria: 'todas',
    estado: 'activo',
    busqueda: '',
    precioMin: '',
    precioMax: '',
    ordenar: '-numeroOfertas'
  });
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem(`favorites_${user?._id}`);
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, [user]);

  // Load auctions
  useEffect(() => {
    loadAuctions();
  }, [filters, currentPage]);

  const loadAuctions = async () => {
    try {
      setLoading(true);
      const response = await productService.obtenerSubastas({
        ...filters,
        pagina: currentPage,
        limite: 12
      });
      setAuctions(response.data || []);
      setTotalPages(response.pagination?.totalPaginas || 1);
    } catch (error) {
      console.error('Error loading auctions:', error);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (auctionId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(auctionId)) {
      newFavorites.delete(auctionId);
    } else {
      newFavorites.add(auctionId);
    }
    setFavorites(newFavorites);
    localStorage.setItem(`favorites_${user._id}`, JSON.stringify([...newFavorites]));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    
    // 🔥 TRACKING: Registrar clicks en categorías
    if (key === 'categoria' && value !== 'todas') {
      registrarClickCategoria(value);
    }
  };

  const AuctionCard = ({ auction, isFavorite, onToggleFavorite }) => {
    const STATIC_BASE = (process.env.REACT_APP_API_URL?.replace('/api','')) || 'http://localhost:5000';
    const timeRemaining = productService.calcularTiempoRestante(auction.fechaFin);
    
    return (
      <motion.div
        className="auction-card-modern"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
      >
        <div className="auction-image-container">
          {auction.imagenes && auction.imagenes.length > 0 ? (
            <img
              src={auction.imagenes[0].url?.startsWith('http') 
                ? auction.imagenes[0].url 
                : `${STATIC_BASE}${auction.imagenes[0].url}`}
              alt={auction.titulo}
              className="auction-image-modern"
              onError={(e) => { e.target.src = '/logo512.png'; }}
            />
          ) : (
            <div className="auction-placeholder">
              <FaGavel />
            </div>
          )}
          
          <button 
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(auction._id)}
          >
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
            <span className="current-price">
              {productService.formatearMoneda(auction.precioActual || auction.precioInicial)}
            </span>
            <span className="price-label">Precio actual</span>
          </div>
          
          <div className="auction-stats">
            <div className="stat">
              <FaUsers />
              <span>{auction.numeroOfertas || 0} ofertas</span>
            </div>
            <div className="stat">
              <FaEye />
              <span>{auction.vistas || 0} vistas</span>
            </div>
          </div>
          
          <button className="view-auction-btn" onClick={handleViewDetails}>
            <FaEye />
            Ver Detalles
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <Layout currentPage="auctions">
      <div className="auctions-page">
        <div className="page-header">
          <div className="header-content">
            <h1>Explorar Subastas</h1>
            <p>Encuentra las mejores oportunidades en subastas activas</p>
          </div>
          
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <FaTh />
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FaList />
            </button>
          </div>
        </div>

        <div className="filters-section">
          <div className="search-filter">
            <div className="search-input">
              <FaSearch />
              <input
                type="text"
                placeholder="Buscar subastas..."
                value={filters.busqueda}
                onChange={(e) => handleFilterChange('busqueda', e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-controls">
            <select 
              value={filters.categoria}
              onChange={(e) => handleFilterChange('categoria', e.target.value)}
            >
              <option value="todas">Todas las categorías</option>
              {productService.categorias.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            
            <select 
              value={filters.estado}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
            >
              <option value="activo">Activas</option>
              <option value="todas">Todos los estados</option>
              <option value="finalizado">Finalizadas</option>
            </select>
            
            <select 
              value={filters.ordenar}
              onChange={(e) => handleFilterChange('ordenar', e.target.value)}
            >
              <option value="-numeroOfertas">Más populares</option>
              <option value="-createdAt">Más recientes</option>
              <option value="precioActual">Menor precio</option>
              <option value="-precioActual">Mayor precio</option>
              <option value="fechaFin">Terminan pronto</option>
            </select>
          </div>
        </div>

        <div className="auctions-content">
          {loading ? (
            <div className="loading-grid">
              {Array.from({length: 8}).map((_, i) => (
                <div key={i} className="auction-skeleton" />
              ))}
            </div>
          ) : auctions.length > 0 ? (
            <>
              <div className={`auctions-grid ${viewMode}`}>
                {auctions.map(auction => (
                  <AuctionCard
                    key={auction._id}
                    auction={auction}
                    isFavorite={favorites.has(auction._id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <FaChevronLeft />
                  </button>
                  
                  <div className="page-numbers">
                    {Array.from({length: totalPages}, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === totalPages || 
                        Math.abs(page - currentPage) <= 2
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="ellipsis">...</span>
                          )}
                          <button
                            className={currentPage === page ? 'active' : ''}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))
                    }
                  </div>
                  
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-results">
              <FaGavel className="no-results-icon" />
              <h3>No se encontraron subastas</h3>
              <p>Intenta cambiar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AuctionsPage;

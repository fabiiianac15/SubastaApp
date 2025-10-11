import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FaHeart, 
  FaSearch, 
  FaFilter,
  FaClock,
  FaEye,
  FaDollarSign,
  FaUsers,
  FaCalendarAlt,
  FaGavel,
  FaPlus,
  FaHeartBroken,
  FaSortAmountDown,
  FaTh,
  FaThList,
  FaShare,
  FaBookmark,
  FaStar,
  FaTrophy
} from 'react-icons/fa';
import './Favorites.css';

const Favorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      auctionId: 101,
      title: 'iPhone 14 Pro Max 256GB',
      description: 'Excellent condition, original box included',
      currentBid: 1200,
      startingPrice: 800,
      totalBids: 23,
      timeLeft: '2d 14h 32m',
      category: 'Electronics',
      images: ['/api/placeholder/300/200'],
      seller: 'TechStore',
      addedAt: '2024-01-15T10:30:00',
      views: 156,
      watchers: 12,
      status: 'active',
      hasParticipated: true,
      myHighestBid: 1100
    },
    {
      id: 2,
      auctionId: 102,
      title: 'Vintage Rolex Watch',
      description: 'Authentic vintage piece from 1985',
      currentBid: 2850,
      startingPrice: 2000,
      totalBids: 47,
      timeLeft: '5h 15m',
      category: 'Jewelry',
      images: ['/api/placeholder/300/200'],
      seller: 'LuxuryItems',
      addedAt: '2024-01-10T14:20:00',
      views: 289,
      watchers: 28,
      status: 'active',
      hasParticipated: false,
      myHighestBid: null
    },
    {
      id: 3,
      auctionId: 103,
      title: 'MacBook Pro M2 16"',
      description: 'Like new, purchased 3 months ago',
      currentBid: 1800,
      startingPrice: 1500,
      totalBids: 12,
      timeLeft: 'Ended',
      category: 'Electronics',
      images: ['/api/placeholder/300/200'],
      seller: 'ComputerWorld',
      addedAt: '2024-01-05T09:15:00',
      views: 98,
      watchers: 7,
      status: 'ended',
      hasParticipated: true,
      myHighestBid: 1750
    },
    {
      id: 4,
      auctionId: 104,
      title: 'Vintage Leather Jacket',
      description: 'Rare 1970s motorcycle jacket in mint condition',
      currentBid: 450,
      startingPrice: 300,
      totalBids: 8,
      timeLeft: '1d 8h 45m',
      category: 'Fashion',
      images: ['/api/placeholder/300/200'],
      seller: 'VintageStyle',
      addedAt: '2024-01-12T16:00:00',
      views: 67,
      watchers: 15,
      status: 'active',
      hasParticipated: false,
      myHighestBid: null
    }
  ]);

  const [filteredFavorites, setFilteredFavorites] = useState(favorites);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['all', 'Electronics', 'Jewelry', 'Fashion', 'Art', 'Collectibles'];
  const statusOptions = [
    { value: 'all', label: 'Todos los Estados' },
    { value: 'active', label: 'Activas' },
    { value: 'ending_soon', label: 'Finalizando Pronto' },
    { value: 'ended', label: 'Finalizadas' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Agregados Recientemente' },
    { value: 'oldest', label: 'Agregados Primero' },
    { value: 'ending_soon', label: 'Finalizando Pronto' },
    { value: 'highest_bid', label: 'Mayor Oferta' },
    { value: 'most_watched', label: 'Más Observados' },
    { value: 'alphabetical', label: 'Alfabético' }
  ];

  useEffect(() => {
    let filtered = favorites.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.seller.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && item.status === 'active') ||
                           (statusFilter === 'ended' && item.status === 'ended') ||
                           (statusFilter === 'ending_soon' && item.status === 'active' && item.timeLeft.includes('h'));
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.addedAt) - new Date(b.addedAt);
        case 'ending_soon':
          if (a.status === 'ended' && b.status !== 'ended') return 1;
          if (b.status === 'ended' && a.status !== 'ended') return -1;
          return a.timeLeft === 'Ended' ? 1 : -1;
        case 'highest_bid':
          return b.currentBid - a.currentBid;
        case 'most_watched':
          return b.watchers - a.watchers;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default: // newest
          return new Date(b.addedAt) - new Date(a.addedAt);
      }
    });

    setFilteredFavorites(filtered);
  }, [favorites, searchTerm, categoryFilter, statusFilter, sortBy]);

  const handleRemoveFavorite = (favoriteId) => {
    setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
  };

  const handleViewAuction = (auctionId) => {
    console.log('View auction:', auctionId);
  };

  const handlePlaceBid = (auctionId) => {
    console.log('Place bid on auction:', auctionId);
  };

  const handleShareAuction = (auctionId, title) => {
    console.log('Share auction:', auctionId, title);
  };

  const getTimeLeft = (timeLeft) => {
    if (timeLeft === 'Ended') return 'Finalizada';
    return timeLeft;
  };

  const getStatusColor = (status, timeLeft) => {
    if (status === 'ended') return '#ff6b6b';
    if (timeLeft.includes('h') && !timeLeft.includes('d')) return '#ffd700';
    return '#43e97b';
  };

  return (
    <div className="favorites">
      {/* Header Section */}
      <motion.div 
        className="favorites-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <div className="header-info">
            <h1>
              <FaHeart className="header-icon" />
              Mis Favoritos
            </h1>
            <p>Subastas que has marcado como favoritas</p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{favorites.length}</span>
              <span className="stat-label">Total Favoritos</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{favorites.filter(f => f.status === 'active').length}</span>
              <span className="stat-label">Activos</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{favorites.filter(f => f.hasParticipated).length}</span>
              <span className="stat-label">Participando</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div 
        className="favorites-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="quick-stat">
          <div className="quick-stat-icon active">
            <FaGavel />
          </div>
          <div className="quick-stat-info">
            <h3>${favorites.reduce((sum, f) => f.hasParticipated ? sum + (f.myHighestBid || 0) : sum, 0).toLocaleString()}</h3>
            <p>Total Apostado</p>
          </div>
        </div>

        <div className="quick-stat">
          <div className="quick-stat-icon ending">
            <FaClock />
          </div>
          <div className="quick-stat-info">
            <h3>{favorites.filter(f => f.status === 'active' && f.timeLeft.includes('h') && !f.timeLeft.includes('d')).length}</h3>
            <p>Finalizando Pronto</p>
          </div>
        </div>

        <div className="quick-stat">
          <div className="quick-stat-icon categories">
            <FaBookmark />
          </div>
          <div className="quick-stat-info">
            <h3>{[...new Set(favorites.map(f => f.category))].length}</h3>
            <p>Categorías</p>
          </div>
        </div>

        <div className="quick-stat">
          <div className="quick-stat-icon average">
            <FaStar />
          </div>
          <div className="quick-stat-info">
            <h3>${Math.round(favorites.reduce((sum, f) => sum + f.currentBid, 0) / favorites.length).toLocaleString()}</h3>
            <p>Valor Promedio</p>
          </div>
        </div>
      </motion.div>

      {/* Controls Section */}
      <motion.div 
        className="favorites-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="controls-left">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar en favoritos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            Filtros
          </button>
        </div>

        <div className="controls-right">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="view-toggle">
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
              <FaThList />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="filter-bar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="filter-section">
              <h4>Categoría</h4>
              <div className="category-filters">
                {categories.map(category => (
                  <button
                    key={category}
                    className={`category-filter ${categoryFilter === category ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category === 'all' ? 'Todas' : category}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>Estado</h4>
              <div className="status-filters">
                {statusOptions.map(status => (
                  <button
                    key={status.value}
                    className={`status-filter ${statusFilter === status.value ? 'active' : ''}`}
                    onClick={() => setStatusFilter(status.value)}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Favorites Grid/List */}
      <motion.div 
        className={`favorites-container ${viewMode}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <AnimatePresence>
          {filteredFavorites.map((favorite, index) => (
            <motion.div
              key={favorite.id}
              className="favorite-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: viewMode === 'grid' ? 1.02 : 1.01 }}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="favorite-image">
                    <div className="image-placeholder">
                      <FaGavel />
                    </div>
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(favorite.status, favorite.timeLeft) }}
                    />
                    <button 
                      className="remove-favorite-btn"
                      onClick={() => handleRemoveFavorite(favorite.id)}
                      title="Quitar de favoritos"
                    >
                      <FaHeartBroken />
                    </button>
                  </div>

                  <div className="favorite-content">
                    <div className="favorite-header">
                      <h3>{favorite.title}</h3>
                      <div className="time-left">
                        <FaClock />
                        {getTimeLeft(favorite.timeLeft)}
                      </div>
                    </div>

                    <p className="favorite-description">{favorite.description}</p>

                    <div className="bid-info">
                      <div className="current-bid">
                        <span className="label">Oferta Actual:</span>
                        <span className="amount">${favorite.currentBid.toLocaleString()}</span>
                      </div>
                      {favorite.hasParticipated && (
                        <div className="my-bid">
                          <span className="label">Mi Oferta:</span>
                          <span className="amount">${favorite.myHighestBid?.toLocaleString()}</span>
                          {favorite.myHighestBid === favorite.currentBid && <FaTrophy className="leading-icon" />}
                        </div>
                      )}
                    </div>

                    <div className="favorite-metrics">
                      <div className="metric">
                        <FaUsers />
                        <span>{favorite.totalBids}</span>
                      </div>
                      <div className="metric">
                        <FaEye />
                        <span>{favorite.views}</span>
                      </div>
                      <div className="metric">
                        <FaHeart />
                        <span>{favorite.watchers}</span>
                      </div>
                    </div>

                    <div className="favorite-footer">
                      <span className="seller">Por: {favorite.seller}</span>
                      <span className="category">{favorite.category}</span>
                    </div>

                    <div className="favorite-actions">
                      <button 
                        className="view-auction-btn"
                        onClick={() => handleViewAuction(favorite.auctionId)}
                      >
                        <FaEye />
                        Ver Subasta
                      </button>
                      {favorite.status === 'active' && (
                        <button 
                          className="place-bid-btn"
                          onClick={() => handlePlaceBid(favorite.auctionId)}
                        >
                          <FaPlus />
                          Pujar
                        </button>
                      )}
                      <button 
                        className="share-btn"
                        onClick={() => handleShareAuction(favorite.auctionId, favorite.title)}
                      >
                        <FaShare />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* List View */
                <>
                  <div className="list-image">
                    <div className="image-placeholder">
                      <FaGavel />
                    </div>
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(favorite.status, favorite.timeLeft) }}
                    />
                  </div>

                  <div className="list-content">
                    <div className="list-header">
                      <h3>{favorite.title}</h3>
                      <div className="list-meta">
                        <span className="category">{favorite.category}</span>
                        <span className="seller">Por: {favorite.seller}</span>
                      </div>
                    </div>

                    <p className="list-description">{favorite.description}</p>

                    <div className="list-stats">
                      <div className="stat">
                        <FaDollarSign />
                        <span>${favorite.currentBid.toLocaleString()}</span>
                      </div>
                      <div className="stat">
                        <FaUsers />
                        <span>{favorite.totalBids} pujas</span>
                      </div>
                      <div className="stat">
                        <FaClock />
                        <span>{getTimeLeft(favorite.timeLeft)}</span>
                      </div>
                      <div className="stat">
                        <FaCalendarAlt />
                        <span>Agregado: {new Date(favorite.addedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="list-actions">
                    <button 
                      className="remove-favorite-btn list"
                      onClick={() => handleRemoveFavorite(favorite.id)}
                      title="Quitar de favoritos"
                    >
                      <FaHeartBroken />
                    </button>
                    <button 
                      className="view-auction-btn"
                      onClick={() => handleViewAuction(favorite.auctionId)}
                    >
                      <FaEye />
                      Ver
                    </button>
                    {favorite.status === 'active' && (
                      <button 
                        className="place-bid-btn"
                        onClick={() => handlePlaceBid(favorite.auctionId)}
                      >
                        <FaPlus />
                        Pujar
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredFavorites.length === 0 && (
        <motion.div 
          className="empty-state"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="empty-icon">
            <FaHeartBroken />
          </div>
          <h3>
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
              ? 'No se encontraron favoritos'
              : 'No tienes favoritos aún'
            }
          </h3>
          <p>
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
              ? 'Intenta ajustar tus filtros de búsqueda'
              : 'Explora subastas y marca tus favoritas con el corazón ❤️'
            }
          </p>
          {(!searchTerm && categoryFilter === 'all' && statusFilter === 'all') && (
            <button className="explore-auctions-btn">
              <FaSearch />
              Explorar Subastas
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Favorites;
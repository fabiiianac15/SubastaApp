import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FaGavel, 
  FaPlus, 
  FaSearch, 
  FaFilter,
  FaClock,
  FaEye,
  FaDollarSign,
  FaUsers,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaPause,
  FaPlay,
  FaSortAmountDown,
  FaChartLine,
  FaTrophy,
  FaHeart
} from 'react-icons/fa';
import './MyAuctions.css';

const MyAuctions = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([
    {
      id: 1,
      title: 'iPhone 14 Pro Max 256GB',
      description: 'Excellent condition, original box included',
      currentBid: 1200,
      startingPrice: 800,
      totalBids: 23,
      timeLeft: '2d 14h 32m',
      status: 'active',
      category: 'Electronics',
      images: ['/api/placeholder/300/200'],
      createdAt: '2024-01-15',
      views: 156,
      watchers: 12
    },
    {
      id: 2,
      title: 'Vintage Rolex Watch',
      description: 'Authentic vintage piece from 1985',
      currentBid: 2850,
      startingPrice: 2000,
      totalBids: 47,
      timeLeft: '5h 15m',
      status: 'active',
      category: 'Jewelry',
      images: ['/api/placeholder/300/200'],
      createdAt: '2024-01-10',
      views: 289,
      watchers: 28
    },
    {
      id: 3,
      title: 'MacBook Pro M2 16"',
      description: 'Like new, purchased 3 months ago',
      currentBid: 0,
      startingPrice: 1500,
      totalBids: 0,
      timeLeft: 'Ended',
      status: 'ended',
      category: 'Electronics',
      images: ['/api/placeholder/300/200'],
      createdAt: '2024-01-05',
      views: 98,
      watchers: 7
    }
  ]);

  const [filteredAuctions, setFilteredAuctions] = useState(auctions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Todas las Subastas', color: '#667eea' },
    { value: 'active', label: 'Activas', color: '#43e97b' },
    { value: 'ended', label: 'Finalizadas', color: '#f093fb' },
    { value: 'paused', label: 'Pausadas', color: '#ffd700' },
    { value: 'draft', label: 'Borradores', color: '#a0aec0' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Más Recientes' },
    { value: 'oldest', label: 'Más Antiguas' },
    { value: 'ending_soon', label: 'Finalizando Pronto' },
    { value: 'highest_bid', label: 'Mayor Oferta' },
    { value: 'most_bids', label: 'Más Ofertas' }
  ];

  useEffect(() => {
    let filtered = auctions.filter(auction => {
      const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           auction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || auction.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'ending_soon':
          return a.timeLeft === 'Ended' ? 1 : -1;
        case 'highest_bid':
          return b.currentBid - a.currentBid;
        case 'most_bids':
          return b.totalBids - a.totalBids;
        default: // newest
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredAuctions(filtered);
  }, [auctions, searchTerm, statusFilter, sortBy]);

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : '#667eea';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <FaPlay />;
      case 'ended': return <FaTrophy />;
      case 'paused': return <FaPause />;
      case 'draft': return <FaEdit />;
      default: return <FaGavel />;
    }
  };

  const handleCreateAuction = () => {
    // Handle create auction
    console.log('Create new auction');
  };

  const handleEditAuction = (auctionId) => {
    console.log('Edit auction:', auctionId);
  };

  const handleDeleteAuction = (auctionId) => {
    console.log('Delete auction:', auctionId);
  };

  const handlePauseAuction = (auctionId) => {
    console.log('Pause auction:', auctionId);
  };

  return (
    <div className="my-auctions">
      {/* Header Section */}
      <motion.div 
        className="auctions-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <div className="header-info">
            <h1>Mis Subastas</h1>
            <p>Gestiona y monitorea tus productos en subasta</p>
          </div>
          <motion.button 
            className="create-auction-btn"
            onClick={handleCreateAuction}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaPlus />
            Nueva Subasta
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        className="auction-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon active">
            <FaGavel />
          </div>
          <div className="stat-info">
            <h3>{auctions.filter(a => a.status === 'active').length}</h3>
            <p>Subastas Activas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bids">
            <FaDollarSign />
          </div>
          <div className="stat-info">
            <h3>${auctions.reduce((sum, a) => sum + a.currentBid, 0).toLocaleString()}</h3>
            <p>Total en Ofertas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon views">
            <FaEye />
          </div>
          <div className="stat-info">
            <h3>{auctions.reduce((sum, a) => sum + a.views, 0).toLocaleString()}</h3>
            <p>Total de Vistas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon watchers">
            <FaHeart />
          </div>
          <div className="stat-info">
            <h3>{auctions.reduce((sum, a) => sum + a.watchers, 0)}</h3>
            <p>Total Observando</p>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div 
        className="auction-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar en mis subastas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            Filtros
          </button>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="" disabled>Ordenar por</option>
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            <div className="filter-options">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  className={`status-filter ${statusFilter === status.value ? 'active' : ''}`}
                  style={{ '--status-color': status.color }}
                  onClick={() => setStatusFilter(status.value)}
                >
                  {status.label}
                  <span className="status-count">
                    {status.value === 'all' ? auctions.length : auctions.filter(a => a.status === status.value).length}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auctions Grid */}
      <motion.div 
        className="auctions-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <AnimatePresence>
          {filteredAuctions.map((auction, index) => (
            <motion.div
              key={auction.id}
              className="auction-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="auction-image">
                <div className="image-placeholder">
                  <FaGavel />
                </div>
                <div className={`status-badge ${auction.status}`}>
                  {getStatusIcon(auction.status)}
                  {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                </div>
              </div>

              <div className="auction-content">
                <div className="auction-header">
                  <h3>{auction.title}</h3>
                  <div className="auction-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEditAuction(auction.id)}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="action-btn pause"
                      onClick={() => handlePauseAuction(auction.id)}
                      title="Pausar"
                    >
                      <FaPause />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteAuction(auction.id)}
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <p className="auction-description">{auction.description}</p>

                <div className="auction-stats-row">
                  <div className="bid-info">
                    <span className="current-bid">
                      ${auction.currentBid > 0 ? auction.currentBid.toLocaleString() : 'Sin ofertas'}
                    </span>
                    <span className="starting-price">
                      Precio inicial: ${auction.startingPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="time-left">
                    <FaClock />
                    {auction.timeLeft}
                  </div>
                </div>

                <div className="auction-metrics">
                  <div className="metric">
                    <FaUsers />
                    <span>{auction.totalBids} ofertas</span>
                  </div>
                  <div className="metric">
                    <FaEye />
                    <span>{auction.views} vistas</span>
                  </div>
                  <div className="metric">
                    <FaHeart />
                    <span>{auction.watchers} observando</span>
                  </div>
                </div>

                <div className="auction-footer">
                  <span className="created-date">
                    <FaCalendarAlt />
                    Creada: {new Date(auction.createdAt).toLocaleDateString()}
                  </span>
                  <div className="performance-indicator">
                    <FaChartLine />
                    <span className={auction.currentBid > auction.startingPrice ? 'positive' : 'neutral'}>
                      {auction.currentBid > auction.startingPrice ? 
                        `+${Math.round(((auction.currentBid - auction.startingPrice) / auction.startingPrice) * 100)}%` :
                        'Sin incremento'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredAuctions.length === 0 && (
        <motion.div 
          className="empty-state"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="empty-icon">
            <FaGavel />
          </div>
          <h3>No se encontraron subastas</h3>
          <p>
            {searchTerm || statusFilter !== 'all' 
              ? 'Intenta ajustar tus filtros de búsqueda'
              : 'Crea tu primera subasta para comenzar a vender'
            }
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <button className="create-first-auction" onClick={handleCreateAuction}>
              <FaPlus />
              Crear Primera Subasta
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default MyAuctions;
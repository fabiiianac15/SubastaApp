import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FaGavel, 
  FaSearch, 
  FaFilter,
  FaClock,
  FaEye,
  FaDollarSign,
  FaTrophy,
  FaCalendarAlt,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaHeart,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaPlus
} from 'react-icons/fa';
import './MyBids.css';

const MyBids = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState([
    {
      id: 1,
      auctionId: 101,
      auctionTitle: 'iPhone 14 Pro Max 256GB',
      auctionImage: '/api/placeholder/300/200',
      myBid: 1200,
      currentHighestBid: 1200,
      myBidTime: '2024-01-15T14:30:00',
      auctionEndTime: '2024-01-20T15:00:00',
      status: 'leading',
      bidHistory: [
        { amount: 800, time: '2024-01-15T10:00:00' },
        { amount: 950, time: '2024-01-15T12:15:00' },
        { amount: 1200, time: '2024-01-15T14:30:00' }
      ],
      totalBids: 23,
      position: 1,
      nextBidIncrement: 50
    },
    {
      id: 2,
      auctionId: 102,
      auctionTitle: 'Vintage Rolex Watch',
      auctionImage: '/api/placeholder/300/200',
      myBid: 2500,
      currentHighestBid: 2850,
      myBidTime: '2024-01-10T16:45:00',
      auctionEndTime: '2024-01-18T20:00:00',
      status: 'outbid',
      bidHistory: [
        { amount: 2000, time: '2024-01-10T10:00:00' },
        { amount: 2300, time: '2024-01-10T14:20:00' },
        { amount: 2500, time: '2024-01-10T16:45:00' }
      ],
      totalBids: 47,
      position: 2,
      nextBidIncrement: 100
    },
    {
      id: 3,
      auctionId: 103,
      auctionTitle: 'MacBook Pro M2 16"',
      auctionImage: '/api/placeholder/300/200',
      myBid: 1800,
      currentHighestBid: 1800,
      myBidTime: '2024-01-05T11:20:00',
      auctionEndTime: '2024-01-12T18:00:00',
      status: 'won',
      bidHistory: [
        { amount: 1500, time: '2024-01-05T09:00:00' },
        { amount: 1650, time: '2024-01-05T10:30:00' },
        { amount: 1800, time: '2024-01-05T11:20:00' }
      ],
      totalBids: 12,
      position: 1,
      nextBidIncrement: null
    },
    {
      id: 4,
      auctionId: 104,
      auctionTitle: 'Sony Alpha Camera',
      auctionImage: '/api/placeholder/300/200',
      myBid: 950,
      currentHighestBid: 1150,
      myBidTime: '2024-01-08T13:15:00',
      auctionEndTime: '2024-01-10T16:00:00',
      status: 'lost',
      bidHistory: [
        { amount: 800, time: '2024-01-08T10:00:00' },
        { amount: 950, time: '2024-01-08T13:15:00' }
      ],
      totalBids: 18,
      position: 3,
      nextBidIncrement: null
    }
  ]);

  const [filteredBids, setFilteredBids] = useState(bids);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Todas las Pujas', color: '#667eea', count: bids.length },
    { value: 'leading', label: 'Liderando', color: '#43e97b', count: bids.filter(b => b.status === 'leading').length },
    { value: 'outbid', label: 'Superado', color: '#f093fb', count: bids.filter(b => b.status === 'outbid').length },
    { value: 'won', label: 'Ganadas', color: '#ffd700', count: bids.filter(b => b.status === 'won').length },
    { value: 'lost', label: 'Perdidas', color: '#ff6b6b', count: bids.filter(b => b.status === 'lost').length }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Más Recientes' },
    { value: 'oldest', label: 'Más Antiguas' },
    { value: 'ending_soon', label: 'Finalizando Pronto' },
    { value: 'highest_bid', label: 'Mayor Puja' },
    { value: 'lowest_bid', label: 'Menor Puja' }
  ];

  useEffect(() => {
    let filtered = bids.filter(bid => {
      const matchesSearch = bid.auctionTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.myBidTime) - new Date(b.myBidTime);
        case 'ending_soon':
          return new Date(a.auctionEndTime) - new Date(b.auctionEndTime);
        case 'highest_bid':
          return b.myBid - a.myBid;
        case 'lowest_bid':
          return a.myBid - b.myBid;
        default: // newest
          return new Date(b.myBidTime) - new Date(a.myBidTime);
      }
    });

    setFilteredBids(filtered);
  }, [bids, searchTerm, statusFilter, sortBy]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'leading': return <FaTrophy />;
      case 'outbid': return <FaExclamationTriangle />;
      case 'won': return <FaCheckCircle />;
      case 'lost': return <FaTimesCircle />;
      default: return <FaGavel />;
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : '#667eea';
  };

  const getTimeLeft = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Finalizada';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handlePlaceBid = (auctionId, currentBid, increment) => {
    console.log('Place bid on auction:', auctionId, 'Current:', currentBid, 'Increment:', increment);
  };

  const handleViewAuction = (auctionId) => {
    console.log('View auction:', auctionId);
  };

  const getTotalSpent = () => {
    return bids.filter(bid => bid.status === 'won').reduce((sum, bid) => sum + bid.myBid, 0);
  };

  const getTotalActive = () => {
    return bids.filter(bid => ['leading', 'outbid'].includes(bid.status)).reduce((sum, bid) => sum + bid.myBid, 0);
  };

  return (
    <div className="my-bids">
      {/* Header Section */}
      <motion.div 
        className="bids-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <div className="header-info">
            <h1>Mis Pujas</h1>
            <p>Seguimiento de todas tus ofertas y subastas</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        className="bid-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon active">
            <FaGavel />
          </div>
          <div className="stat-info">
            <h3>{bids.filter(b => ['leading', 'outbid'].includes(b.status)).length}</h3>
            <p>Pujas Activas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon leading">
            <FaTrophy />
          </div>
          <div className="stat-info">
            <h3>{bids.filter(b => b.status === 'leading').length}</h3>
            <p>Liderando</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon won">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{bids.filter(b => b.status === 'won').length}</h3>
            <p>Ganadas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon spent">
            <FaDollarSign />
          </div>
          <div className="stat-info">
            <h3>${getTotalSpent().toLocaleString()}</h3>
            <p>Total Gastado</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon committed">
            <FaChartLine />
          </div>
          <div className="stat-info">
            <h3>${getTotalActive().toLocaleString()}</h3>
            <p>Comprometido</p>
          </div>
        </div>
      </motion.div>

      {/* Controls Section */}
      <motion.div 
        className="bid-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar en mis pujas..."
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
                  <span className="status-count">{status.count}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bids Grid */}
      <motion.div 
        className="bids-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <AnimatePresence>
          {filteredBids.map((bid, index) => (
            <motion.div
              key={bid.id}
              className="bid-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="bid-image">
                <div className="image-placeholder">
                  <FaGavel />
                </div>
                <div className={`status-badge ${bid.status}`}>
                  {getStatusIcon(bid.status)}
                  {bid.status === 'leading' && 'Liderando'}
                  {bid.status === 'outbid' && 'Superado'}
                  {bid.status === 'won' && 'Ganada'}
                  {bid.status === 'lost' && 'Perdida'}
                </div>
                <div className="position-badge">
                  #{bid.position}
                </div>
              </div>

              <div className="bid-content">
                <div className="bid-header">
                  <h3>{bid.auctionTitle}</h3>
                  <div className="time-left">
                    <FaClock />
                    {getTimeLeft(bid.auctionEndTime)}
                  </div>
                </div>

                <div className="bid-stats-row">
                  <div className="bid-amounts">
                    <div className="my-bid">
                      <span className="label">Mi Puja:</span>
                      <span className="amount">${bid.myBid.toLocaleString()}</span>
                    </div>
                    <div className="current-bid">
                      <span className="label">Puja Actual:</span>
                      <span className="amount">${bid.currentHighestBid.toLocaleString()}</span>
                      {bid.myBid === bid.currentHighestBid && (
                        <FaTrophy className="leading-icon" />
                      )}
                    </div>
                  </div>
                  
                  {bid.status === 'outbid' && (
                    <div className="bid-difference">
                      <span className="behind-by">
                        Superado por: ${(bid.currentHighestBid - bid.myBid).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bid-metrics">
                  <div className="metric">
                    <FaUsers />
                    <span>{bid.totalBids} pujas</span>
                  </div>
                  <div className="metric">
                    <FaCalendarAlt />
                    <span>{new Date(bid.myBidTime).toLocaleDateString()}</span>
                  </div>
                  <div className="metric">
                    <FaChartLine />
                    <span>{bid.bidHistory.length} mis pujas</span>
                  </div>
                </div>

                {/* Bid History */}
                <div className="bid-history">
                  <h4>Mi Historial de Pujas</h4>
                  <div className="history-list">
                    {bid.bidHistory.slice(-3).reverse().map((historyBid, idx) => (
                      <div key={idx} className="history-item">
                        <div className="history-amount">
                          ${historyBid.amount.toLocaleString()}
                        </div>
                        <div className="history-time">
                          {new Date(historyBid.time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {idx === 0 && <span className="latest-badge">Última</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bid-actions">
                  <button 
                    className="view-auction-btn"
                    onClick={() => handleViewAuction(bid.auctionId)}
                  >
                    <FaEye />
                    Ver Subasta
                  </button>
                  
                  {bid.status === 'outbid' && bid.nextBidIncrement && (
                    <button 
                      className="place-bid-btn"
                      onClick={() => handlePlaceBid(bid.auctionId, bid.currentHighestBid, bid.nextBidIncrement)}
                    >
                      <FaPlus />
                      Pujar ${(bid.currentHighestBid + bid.nextBidIncrement).toLocaleString()}
                    </button>
                  )}
                  
                  {bid.status === 'leading' && (
                    <div className="leading-status">
                      <FaTrophy />
                      <span>¡Vas ganando!</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredBids.length === 0 && (
        <motion.div 
          className="empty-state"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="empty-icon">
            <FaGavel />
          </div>
          <h3>No se encontraron pujas</h3>
          <p>
            {searchTerm || statusFilter !== 'all' 
              ? 'Intenta ajustar tus filtros de búsqueda'
              : 'Comienza a participar en subastas para ver tus pujas aquí'
            }
          </p>
          {(!searchTerm && statusFilter === 'all') && (
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

export default MyBids;
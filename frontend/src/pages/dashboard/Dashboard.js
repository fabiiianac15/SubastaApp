import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FaGavel, 
  FaPlus, 
  FaEye, 
  FaTrophy, 
  FaChartBar, 
  FaHeart,
  FaClock,
  FaFire,
  FaArrowUp,
  FaArrowDown,
  FaCoins,
  FaUsers,
  FaCalendarAlt,
  FaStar
} from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAuctions: 42,
    activeBids: 8,
    wonAuctions: 12,
    totalEarnings: 2450,
    recentActivity: [
      { type: 'bid', item: 'Vintage Camera', amount: 350, time: '2 min' },
      { type: 'win', item: 'Art Piece', amount: 1200, time: '1 hour' },
      { type: 'outbid', item: 'Watch Collection', amount: 850, time: '3 hours' }
    ]
  });

  const [timeFrame, setTimeFrame] = useState('week');

  const quickActions = [
    {
      icon: FaPlus,
      title: 'Crear Subasta',
      description: 'Publica un nuevo producto',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      action: 'create'
    },
    {
      icon: FaEye,
      title: 'Explorar Subastas',
      description: 'Descubre oportunidades',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      action: 'explore'
    },
    {
      icon: FaHeart,
      title: 'Mis Favoritos',
      description: 'Items guardados',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      action: 'favorites'
    },
    {
      icon: FaTrophy,
      title: 'Mis Logros',
      description: 'Ver estadísticas',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      action: 'achievements'
    }
  ];

  const recentAuctions = [
    {
      id: 1,
      title: 'iPhone 14 Pro Max',
      currentBid: 1200,
      timeLeft: '2h 30m',
      image: '/api/placeholder/80/80',
      status: 'leading'
    },
    {
      id: 2,
      title: 'MacBook Pro M2',
      currentBid: 1800,
      timeLeft: '1d 5h',
      image: '/api/placeholder/80/80',
      status: 'watching'
    },
    {
      id: 3,
      title: 'Sony Camera Alpha',
      currentBid: 950,
      timeLeft: '30m',
      image: '/api/placeholder/80/80',
      status: 'outbid'
    }
  ];

  return (
    <div className="modern-dashboard">
      {/* Welcome Header */}
      <motion.div 
        className="dashboard-welcome"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="welcome-content">
          <h1>¡Hola, {user?.nombre}! 👋</h1>
          <p>Aquí tienes un resumen de tu actividad en SubastaApp</p>
        </div>
        <div className="welcome-badge">
          <FaStar className="badge-icon" />
          <span>Miembro {user?.tipoUsuario === 'vendedor' ? 'Vendedor' : 'Comprador'}</span>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="quick-actions-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h2>Acciones Rápidas</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.action}
              className="quick-action-card"
              style={{ '--card-gradient': action.color }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className="action-icon">
                <action.icon />
              </div>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        className="stats-overview"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="stats-header">
          <h2>Estadísticas</h2>
          <div className="time-filter">
            <button 
              className={timeFrame === 'week' ? 'active' : ''}
              onClick={() => setTimeFrame('week')}
            >
              Semana
            </button>
            <button 
              className={timeFrame === 'month' ? 'active' : ''}
              onClick={() => setTimeFrame('month')}
            >
              Mes
            </button>
            <button 
              className={timeFrame === 'year' ? 'active' : ''}
              onClick={() => setTimeFrame('year')}
            >
              Año
            </button>
          </div>
        </div>
        
        <div className="stats-grid">
          <motion.div 
            className="stat-card total-auctions"
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-icon">
              <FaGavel />
            </div>
            <div className="stat-content">
              <h3>{stats.totalAuctions}</h3>
              <p>Subastas Participadas</p>
              <div className="stat-change positive">
                <FaArrowUp />
                <span>+12% vs mes anterior</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card active-bids"
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-icon">
              <FaFire />
            </div>
            <div className="stat-content">
              <h3>{stats.activeBids}</h3>
              <p>Pujas Activas</p>
              <div className="stat-change positive">
                <FaArrowUp />
                <span>+3 esta semana</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card won-auctions"
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-icon">
              <FaTrophy />
            </div>
            <div className="stat-content">
              <h3>{stats.wonAuctions}</h3>
              <p>Subastas Ganadas</p>
              <div className="stat-change positive">
                <FaArrowUp />
                <span>+2 este mes</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="stat-card earnings"
            whileHover={{ scale: 1.02 }}
          >
            <div className="stat-icon">
              <FaCoins />
            </div>
            <div className="stat-content">
              <h3>${stats.totalEarnings.toLocaleString()}</h3>
              <p>{user?.tipoUsuario === 'vendedor' ? 'Ingresos Totales' : 'Dinero Ahorrado'}</p>
              <div className="stat-change positive">
                <FaArrowUp />
                <span>+15% este mes</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Recent Activity & Auctions */}
      <div className="dashboard-bottom">
        {/* Recent Activity */}
        <motion.div 
          className="recent-activity"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2>Actividad Reciente</h2>
          <div className="activity-list">
            {stats.recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                className={`activity-item ${activity.type}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <div className="activity-icon">
                  {activity.type === 'bid' && <FaGavel />}
                  {activity.type === 'win' && <FaTrophy />}
                  {activity.type === 'outbid' && <FaClock />}
                </div>
                <div className="activity-content">
                  <p className="activity-title">{activity.item}</p>
                  <p className="activity-amount">${activity.amount}</p>
                </div>
                <div className="activity-time">
                  <span>{activity.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Auctions */}
        <motion.div 
          className="recent-auctions"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2>Subastas Recientes</h2>
          <div className="auctions-list">
            {recentAuctions.map((auction, index) => (
              <motion.div
                key={auction.id}
                className="auction-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="auction-image">
                  <div className="image-placeholder">
                    <FaGavel />
                  </div>
                </div>
                <div className="auction-info">
                  <h4>{auction.title}</h4>
                  <p className="current-bid">${auction.currentBid}</p>
                  <p className="time-left">
                    <FaClock />
                    {auction.timeLeft}
                  </p>
                </div>
                <div className={`auction-status ${auction.status}`}>
                  {auction.status === 'leading' && '🥇 Liderando'}
                  {auction.status === 'watching' && '👀 Observando'}
                  {auction.status === 'outbid' && '⚠️ Superado'}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

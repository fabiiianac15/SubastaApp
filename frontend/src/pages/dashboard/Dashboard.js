import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
// import { iniciarSeccion, finalizarSeccion, // registrarClick } from '../../services/analyticsService'; // DESACTIVADO - No requerido
import productService from '../../services/productService';
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
  const [recentAuctions, setRecentAuctions] = useState([]);
  const [loadingAuctions, setLoadingAuctions] = useState(true);

  // Cargar subastas recientes desde la base de datos
  useEffect(() => {
    loadRecentAuctions();
  }, []);

  const loadRecentAuctions = async () => {
    try {
      setLoadingAuctions(true);
      const response = await productService.obtenerSubastas({
        estado: 'activo',
        ordenar: '-createdAt',
        limite: 6
      });
      setRecentAuctions(response.data || []);
    } catch (error) {
      console.error('Error loading recent auctions:', error);
      setRecentAuctions([]);
    } finally {
      setLoadingAuctions(false);
    }
  };

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

  const STATIC_BASE = (process.env.REACT_APP_API_URL?.replace('/api','')) || 'http://localhost:5000';

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
              onClick={() => {
                // 🔥 TRACKING: Click en acción rápida
                // registrarClick('boton', `Acción: ${action.title}`, null);
              }}
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
              onClick={() => {
                setTimeFrame('week');
                // 🔥 TRACKING: Click en filtro temporal
                // registrarClick('boton', 'Estadísticas: Semana', null);
              }}
            >
              Semana
            </button>
            <button 
              className={timeFrame === 'month' ? 'active' : ''}
              onClick={() => {
                setTimeFrame('month');
                // 🔥 TRACKING: Click en filtro temporal
                // registrarClick('boton', 'Estadísticas: Mes', null);
              }}
            >
              Mes
            </button>
            <button 
              className={timeFrame === 'year' ? 'active' : ''}
              onClick={() => {
                setTimeFrame('year');
                // 🔥 TRACKING: Click en filtro temporal
                // registrarClick('boton', 'Estadísticas: Año', null);
              }}
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
          {loadingAuctions ? (
            <div className="auctions-list">
              {Array.from({length: 3}).map((_, i) => (
                <div key={i} className="auction-item skeleton" />
              ))}
            </div>
          ) : recentAuctions.length > 0 ? (
            <div className="auctions-list">
              {recentAuctions.map((auction, index) => {
                const timeRemaining = productService.calcularTiempoRestante(auction.fechaFin);
                const imageUrl = auction.imagenes && auction.imagenes.length > 0
                  ? (auction.imagenes[0].url?.startsWith('http') 
                      ? auction.imagenes[0].url 
                      : `${STATIC_BASE}${auction.imagenes[0].url}`)
                  : null;
                
                return (
                  <motion.div
                    key={auction._id}
                    className="auction-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      // 🔥 TRACKING: Click en subasta reciente
                      // registrarClick('producto', auction.titulo, auction._id);
                    }}
                  >
                    <div className="auction-image">
                      {imageUrl ? (
                        <img src={imageUrl} alt={auction.titulo} onError={(e) => {e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex';}} />
                      ) : null}
                      <div className="image-placeholder" style={{display: imageUrl ? 'none' : 'flex'}}>
                        <FaGavel />
                      </div>
                    </div>
                    <div className="auction-info">
                      <h4>{auction.titulo}</h4>
                      <p className="current-bid">
                        {productService.formatearMoneda(auction.precioActual || auction.precioInicial)}
                      </p>
                      <p className="time-left">
                        <FaClock />
                        {timeRemaining && timeRemaining.total > 0 
                          ? productService.formatearTiempo(timeRemaining)
                          : 'Finalizada'}
                      </p>
                    </div>
                    <div className="auction-status watching">
                      <FaUsers /> {auction.numeroOfertas || 0} ofertas
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="no-auctions-message">
              <FaGavel className="no-auctions-icon" />
              <p>No hay subastas recientes</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaGavel, 
  FaSpinner, 
  FaHome, 
  FaEye, 
  FaPlus, 
  FaListAlt, 
  FaHandHolding, 
  FaHeart, 
  FaChartBar, 
  FaCog 
} from 'react-icons/fa';
import './LoadingTransition.css';

const LoadingTransition = ({ targetPage }) => {
  const pageIcons = {
    dashboard: FaHome,
    auctions: FaEye,
    create: FaPlus,
    'my-auctions': FaListAlt,
    'my-bids': FaHandHolding,
    favorites: FaHeart,
    stats: FaChartBar,
    settings: FaCog
  };

  const pageNames = {
    dashboard: 'Dashboard',
    auctions: 'Ver Subastas',
    create: 'Crear Subasta',
    'my-auctions': 'Mis Subastas',
    'my-bids': 'Mis Pujas',
    favorites: 'Favoritos',
    stats: 'Estadísticas',
    settings: 'Configuración'
  };

  const TargetIcon = pageIcons[targetPage] || FaHome;

  return (
    <motion.div 
      className="loading-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="loading-content">
        {/* Logo Principal */}
        <motion.div 
          className="loading-logo"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div
            className="logo-icon-container"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <FaGavel className="logo-icon" />
          </motion.div>
          <h1>SubastaApp</h1>
        </motion.div>

        {/* Barra de Progreso */}
        <motion.div 
          className="loading-progress"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <motion.div 
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.5, duration: 1 }}
          />
        </motion.div>

        {/* Información de Destino */}
        <motion.div 
          className="loading-destination"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <div className="destination-icon">
            <TargetIcon />
          </div>
          <p>Cargando {pageNames[targetPage]}...</p>
        </motion.div>

        {/* Puntos de Carga Animados */}
        <motion.div 
          className="loading-dots"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="dot"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Partículas de Fondo */}
      <div className="loading-particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default LoadingTransition;
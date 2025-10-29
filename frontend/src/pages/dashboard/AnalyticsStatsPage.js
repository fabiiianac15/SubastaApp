import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaChartBar, 
  FaClock, 
  FaMousePointer, 
  FaEye, 
  FaGavel, 
  FaSearch,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaMobile,
  FaTrophy,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import { obtenerEstadisticas } from '../../services/analyticsService';
import { iniciarSeccion, finalizarSeccion, registrarClick } from '../../services/analyticsService';
import './AnalyticsStatsPage.css';

const AnalyticsStatsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 TRACKING: Iniciar sección
    iniciarSeccion('analytics-stats');
    
    cargarEstadisticas();
    
    return () => {
      finalizarSeccion();
    };
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await obtenerEstadisticas();
      
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  if (loading) {
    return (
      <Layout currentPage="analytics-stats">
        <div className="analytics-stats-page">
          <div className="loading-stats">
            <div className="spinner"></div>
            <p>Cargando estadísticas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout currentPage="analytics-stats">
        <div className="analytics-stats-page">
          <div className="no-stats">
            <FaChartBar className="no-stats-icon" />
            <h2>No hay estadísticas disponibles</h2>
            <p>Comienza a explorar la plataforma para generar datos</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Calcular categorías más vistas
  const topCategorias = Object.entries(stats.categoriasVistas || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calcular secciones más visitadas
  const topSecciones = Object.entries(stats.seccionesMasVisitadas || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Layout currentPage="analytics-stats">
      <div className="analytics-stats-page">
        {/* Header */}
        <motion.div 
          className="stats-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-icon">
            <FaChartBar />
          </div>
          <h1>Mi Actividad Detallada</h1>
          <p>Análisis completo de tu comportamiento en la plataforma</p>
        </motion.div>

        {/* Resumen General */}
        <motion.div 
          className="stats-overview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2>Resumen General</h2>
          <div className="overview-grid">
            <div className="overview-card">
              <div className="card-icon sessions">
                <FaClock />
              </div>
              <div className="card-content">
                <h3>{stats.totalSesiones || 0}</h3>
                <p>Sesiones Totales</p>
                <span className="card-detail">
                  {formatTime(stats.tiempoTotalSegundos)} en total
                </span>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon clicks">
                <FaMousePointer />
              </div>
              <div className="card-content">
                <h3>{stats.totalClicks || 0}</h3>
                <p>Clicks Realizados</p>
                <span className="card-detail">
                  Promedio: {stats.totalSesiones > 0 ? Math.round(stats.totalClicks / stats.totalSesiones) : 0} por sesión
                </span>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon products">
                <FaEye />
              </div>
              <div className="card-content">
                <h3>{stats.productosVistos || 0}</h3>
                <p>Productos Vistos</p>
                <span className="card-detail">
                  Explorando oportunidades
                </span>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon searches">
                <FaSearch />
              </div>
              <div className="card-content">
                <h3>{stats.busquedasRealizadas || 0}</h3>
                <p>Búsquedas</p>
                <span className="card-detail">
                  Buscando lo que necesitas
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Intentos de Subasta */}
        <motion.div 
          className="bids-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2>
            <FaGavel />
            Actividad de Subastas
          </h2>
          <div className="bids-grid">
            <div className="bid-stat-card total">
              <div className="stat-number">{stats.intentosSubasta?.total || 0}</div>
              <p>Intentos Totales</p>
            </div>
            <div className="bid-stat-card success">
              <FaCheckCircle />
              <div className="stat-number">{stats.intentosSubasta?.exitosos || 0}</div>
              <p>Ofertas Exitosas</p>
            </div>
            <div className="bid-stat-card failed">
              <FaTimesCircle />
              <div className="stat-number">{stats.intentosSubasta?.fallidos || 0}</div>
              <p>Intentos Fallidos</p>
            </div>
            {stats.intentosSubasta?.total > 0 && (
              <div className="bid-stat-card rate">
                <FaTrophy />
                <div className="stat-number">
                  {Math.round((stats.intentosSubasta.exitosos / stats.intentosSubasta.total) * 100)}%
                </div>
                <p>Tasa de Éxito</p>
              </div>
            )}
          </div>
        </motion.div>

        <div className="stats-details-grid">
          {/* Categorías Más Vistas */}
          <motion.div 
            className="stats-detail-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3>
              <FaLayerGroup />
              Categorías Más Vistas
            </h3>
            {topCategorias.length > 0 ? (
              <div className="categories-list">
                {topCategorias.map(([categoria, veces], index) => (
                  <div key={categoria} className="category-item">
                    <div className="category-rank">#{index + 1}</div>
                    <div className="category-info">
                      <span className="category-name">{categoria}</span>
                      <div className="category-bar">
                        <div 
                          className="category-bar-fill" 
                          style={{ 
                            width: `${(veces / topCategorias[0][1]) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <span className="category-count">{veces} vistas</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No hay datos de categorías aún</p>
            )}
          </motion.div>

          {/* Secciones Más Visitadas */}
          <motion.div 
            className="stats-detail-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3>
              <FaClock />
              Tiempo por Sección
            </h3>
            {topSecciones.length > 0 ? (
              <div className="sections-list">
                {topSecciones.map(([seccion, segundos], index) => (
                  <div key={seccion} className="section-item">
                    <div className="section-rank">#{index + 1}</div>
                    <div className="section-info">
                      <span className="section-name">
                        {seccion.charAt(0).toUpperCase() + seccion.slice(1)}
                      </span>
                      <div className="section-bar">
                        <div 
                          className="section-bar-fill" 
                          style={{ 
                            width: `${(segundos / topSecciones[0][1]) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <span className="section-time">{formatTime(segundos)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No hay datos de secciones aún</p>
            )}
          </motion.div>
        </div>

        {/* Insights */}
        <motion.div 
          className="insights-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2>💡 Insights</h2>
          <div className="insights-cards">
            <div className="insight-card">
              <FaClock className="insight-icon" />
              <h4>Tiempo Promedio de Sesión</h4>
              <p className="insight-value">
                {stats.totalSesiones > 0 
                  ? formatTime(Math.round(stats.tiempoTotalSegundos / stats.totalSesiones))
                  : '0s'
                }
              </p>
              <p className="insight-description">
                {stats.totalSesiones > 0 && stats.tiempoTotalSegundos / stats.totalSesiones > 300
                  ? '¡Excelente engagement!'
                  : 'Explora más para descubrir mejores ofertas'
                }
              </p>
            </div>

            <div className="insight-card">
              <FaMousePointer className="insight-icon" />
              <h4>Interacción</h4>
              <p className="insight-value">
                {stats.totalSesiones > 0 
                  ? `${Math.round(stats.totalClicks / stats.totalSesiones)} clicks/sesión`
                  : '0 clicks'
                }
              </p>
              <p className="insight-description">
                {stats.totalClicks > 50 
                  ? 'Usuario muy activo'
                  : 'Sigue explorando la plataforma'
                }
              </p>
            </div>

            <div className="insight-card">
              <FaGavel className="insight-icon" />
              <h4>Participación en Subastas</h4>
              <p className="insight-value">
                {stats.intentosSubasta?.total || 0} intentos
              </p>
              <p className="insight-description">
                {stats.intentosSubasta?.exitosos > 5 
                  ? '¡Buen historial de ofertas!'
                  : 'Participa más para ganar mejores subastas'
                }
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AnalyticsStatsPage;

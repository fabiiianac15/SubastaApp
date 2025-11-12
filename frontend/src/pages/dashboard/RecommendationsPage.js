import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaEye, FaGavel, FaUsers, FaChartLine, FaLightbulb } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
// import {// obtenerRecomendaciones } from '../../services/analyticsService';
// import {// iniciarSeccion,// finalizarSeccion,// registrarClick,// registrarProductoVisto } from '../../services/analyticsService';
import productService from '../../services/productService';
import './RecommendationsPage.css';

const RecommendationsPage = () => {
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [razon, setRazon] = useState('');
  const [categoriasPreferidas, setCategoriasPreferidas] = useState([]);
  const [rangoPrecios, setRangoPrecios] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 TRACKING: Iniciar sección
   // iniciarSeccion('recommendations');
    
    cargarRecomendaciones();
    
    return () => {
     // finalizarSeccion();
    };
  }, []);

  const cargarRecomendaciones = async () => {
    try {
      setLoading(true);
      // Intentar obtener recomendaciones (si existe el endpoint). Si no, usar fallback
      let response = { success: false };
      try {
        // Si en algún momento se implementa obtenerRecomendaciones, se puede descomentar
        // const resp = await obtenerRecomendaciones();
        // if (resp && resp.success) response = resp;

        // Fallback: obtener subastas recientes para mostrar como "recomendadas"
        const resp = await productService.obtenerSubastas({ pagina: 1, limite: 12 });
        response = {
          success: true,
          data: {
            recomendaciones: resp.data || [],
            razon: 'Basado en subastas recientes',
            categoriasPreferidas: [],
            rangoPrecios: null
          }
        };
      } catch (err) {
        console.warn('No fue posible obtener recomendaciones, usando fallback:', err);
        response = { success: false };
      }

      if (response && response.success) {
        setRecomendaciones(response.data.recomendaciones || []);
        setRazon(response.data.razon || 'Recomendaciones para ti');
        setCategoriasPreferidas(response.data.categoriasPreferidas || []);
        setRangoPrecios(response.data.rangoPrecios || null);
      }
    } catch (error) {
      console.error('Error cargando recomendaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (producto) => {
    // 🔥 TRACKING: Click en producto recomendado
   // registrarClick('producto', `Recomendación: ${producto.titulo}`, producto._id);
   // registrarProductoVisto(producto._id, producto.categoria, 0);
  };

  const STATIC_BASE = (process.env.REACT_APP_API_URL?.replace('/api','')) || 'http://localhost:5000';

  return (
    <Layout currentPage="recommendations">
      <div className="recommendations-page">
        {/* Header */}
        <motion.div 
          className="recommendations-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-icon">
            <FaLightbulb />
          </div>
          <h1>Recomendaciones Personalizadas</h1>
          <p>{razon}</p>
        </motion.div>

        {/* Insights */}
        {(categoriasPreferidas.length > 0 || rangoPrecios) && (
          <motion.div 
            className="user-insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3>
              <FaChartLine />
              Basado en tu actividad
            </h3>
            <div className="insights-grid">
              {categoriasPreferidas.length > 0 && (
                <div className="insight-card">
                  <FaStar className="insight-icon" />
                  <h4>Categorías de interés</h4>
                  <div className="categories-list">
                    {categoriasPreferidas.map((cat, index) => (
                      <span key={index} className="category-badge">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {rangoPrecios && (
                <div className="insight-card">
                  <FaChartLine className="insight-icon" />
                  <h4>Rango de precios</h4>
                  <p className="price-range">
                    ${rangoPrecios.min?.toLocaleString()} - ${rangoPrecios.max?.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Productos Recomendados */}
        <div className="recommendations-content">
          {loading ? (
            <div className="loading-grid">
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} className="product-skeleton" />
              ))}
            </div>
          ) : recomendaciones.length > 0 ? (
            <motion.div 
              className="recommendations-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {recomendaciones.map((producto, index) => (
                <motion.div
                  key={producto._id}
                  className="recommendation-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ y: -5 }}
                  onClick={() => handleProductClick(producto)}
                >
                  <div className="product-image-container">
                    {producto.imagenes && producto.imagenes.length > 0 ? (
                      <img
                        src={producto.imagenes[0].url?.startsWith('http') 
                          ? producto.imagenes[0].url 
                          : `${STATIC_BASE}${producto.imagenes[0].url}`}
                        alt={producto.titulo}
                        className="product-image"
                        onError={(e) => { e.target.src = '/logo512.png'; }}
                      />
                    ) : (
                      <div className="product-placeholder">
                        <FaGavel />
                      </div>
                    )}
                    
                    <div className="recommendation-badge">
                      <FaStar />
                      Recomendado
                    </div>
                  </div>
                  
                  <div className="product-content">
                    <span className="product-category">{producto.categoria}</span>
                    <h3 className="product-title">{producto.titulo}</h3>
                    
                    <div className="product-price">
                      <span className="current-price">
                        {productService.formatearMoneda(producto.precioActual || producto.precioInicial)}
                      </span>
                      <span className="price-label">Precio actual</span>
                    </div>
                    
                    <div className="product-stats">
                      <div className="stat">
                        <FaUsers />
                        <span>{producto.numeroOfertas || 0} ofertas</span>
                      </div>
                      <div className="stat">
                        <FaEye />
                        <span>{producto.vistas || 0} vistas</span>
                      </div>
                    </div>
                    
                    {producto.vendedor && (
                      <p className="vendor-name">
                        Vendedor: {producto.vendedor.nombre} {producto.vendedor.apellido}
                      </p>
                    )}
                    
                    <button className="view-product-btn">
                      <FaEye />
                      Ver Detalles
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="no-recommendations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FaLightbulb className="no-recs-icon" />
              <h3>Aún no tenemos recomendaciones para ti</h3>
              <p>Explora las subastas y participa para que podamos conocer tus intereses</p>
              <button className="explore-btn" onClick={() => window.location.href = '/dashboard/auctions'}>
                <FaGavel />
                Explorar Subastas
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RecommendationsPage;

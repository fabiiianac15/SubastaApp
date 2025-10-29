import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaGavel, 
  FaTrophy, 
  FaUsers, 
  FaChartLine, 
  FaPlus,
  FaStar,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaQuestionCircle,
  FaShieldAlt,
  FaHandshake,
  FaRocket,
  FaGem,
  FaCrown,
  FaEye,
  FaFire
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import CreateAuctionModal from '../../components/auctions/CreateAuctionModal';
import AuctionDetailModal from '../../components/auctions/AuctionDetailModal';
import Swal from 'sweetalert2';
import productService from '../../services/productService';
import './WelcomePage.css';

// Componente para la tarjeta de subasta mejorada
function AuctionCard({ auction, user, onEdit, onDelete, onView }) {
  const STATIC_BASE = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.replace('/api', '')) || 'http://localhost:5000';
  const [activeImg, setActiveImg] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const isOwner = !!(user && user.tipoUsuario === 'vendedor' && auction.vendedor && (
    String(user._id || user.id) === String(auction.vendedor._id || auction.vendedor.id || auction.vendedor)
  ));
  const images = auction.imagenes && auction.imagenes.length > 0 ? auction.imagenes : [];
  
  // Actualizar tiempo restante cada segundo
  useEffect(() => {
    if (!auction.fechaFin) return;
    
    const updateTimer = () => {
      const remaining = productService.calcularTiempoRestante(auction.fechaFin);
      setTimeRemaining(remaining);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [auction.fechaFin]);
  
  return (
    <motion.div
      className={`auction-card ${auction.featured ? 'featured' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
    >
      {auction.featured && (
        <div className="featured-badge">
          <FaStar />
          Destacado
        </div>
      )}
      
      {/* Carrousel de imágenes mejorado */}
      <div className="wp-auction-image">
        {images.length > 0 ? (
          <div className="carousel-container">
            <img
              src={images[activeImg].url?.startsWith('http')
                ? images[activeImg].url
                : `${STATIC_BASE}${images[activeImg].url}`}
              alt={`${auction.titulo} - imagen ${activeImg + 1}`}
              className="carousel-img"
              onError={(e) => {
                const tried = e.target.getAttribute('data-tried-fallback');
                if (!tried) {
                  e.target.setAttribute('data-tried-fallback', '1');
                  e.target.src = '/logo512.png';
                }
              }}
            />
            
            {images.length > 1 && (
              <>
                <div className="carousel-controls">
                  <button 
                    className="carousel-arrow left"
                    onClick={e => {
                      e.stopPropagation(); 
                      setActiveImg((activeImg - 1 + images.length) % images.length);
                    }}
                    aria-label="Imagen anterior"
                  >
                    ‹
                  </button>
                  <button 
                    className="carousel-arrow right"
                    onClick={e => {
                      e.stopPropagation(); 
                      setActiveImg((activeImg + 1) % images.length);
                    }}
                    aria-label="Siguiente imagen"
                  >
                    ›
                  </button>
                  <span className="carousel-counter">{activeImg + 1}/{images.length}</span>
                </div>
                
                {/* Indicadores de imagen */}
                <div className="image-indicators">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator ${index === activeImg ? 'active' : ''}`}
                      onClick={e => {
                        e.stopPropagation();
                        setActiveImg(index);
                      }}
                      aria-label={`Ir a imagen ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="image-placeholder">
            <FaGavel />
            <span>Sin imagen</span>
          </div>
        )}
        <div className="category-tag">{auction.categoria}</div>
        {timeRemaining && timeRemaining.total > 0 && (
          <div className="time-badge">
            <FaClock />
            {productService.formatearTiempo(timeRemaining)}
          </div>
        )}

        {/* Acciones en overlay: ver, editar y eliminar */}
        <div className="overlay-actions">
          <button className="overlay-button view" onClick={onView} title="Ver detalles">
            <FaEye />
            <span>Ver</span>
          </button>
          {isOwner && (
            <>
              <button className="overlay-button edit" onClick={() => onEdit(auction)} title="Editar">
                Editar
              </button>
              <button
                className="overlay-button delete"
                onClick={(e) => onDelete(auction, e)}
                title="Eliminar"
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="auction-info">
        <h4>{auction.titulo}</h4>
        <div className="auction-meta">
          <div className="current-bid">
            <span className="label">Oferta actual:</span>
            <span className="value">
              {productService.formatearMoneda(auction.precioActual || auction.precioInicial || 0)}
            </span>
          </div>
          <div className="auction-stats">
            <div className="stat">
              <FaClock />
              {timeRemaining ? (
                timeRemaining.total > 0 ? 
                  productService.formatearTiempo(timeRemaining) : 
                  'Finalizada'
              ) : 'Cargando...'}
            </div>
            <div className="stat">
              <FaUsers />
              {auction.numeroOfertas || 0} ofertas
            </div>
          </div>
        </div>
        {/* Las acciones principales están en el overlay para mayor visibilidad */}
      </div>
    </motion.div>
  );
}

const WelcomePage = () => {
  const { user } = useAuth();
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [visibleSection, setVisibleSection] = useState('hero');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editAuction, setEditAuction] = useState(null);
  const [subastas, setSubastas] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalSubastas: 0,
    totalUsuarios: 0,
    satisfaccion: 98,
    transacciones: 0
  });

  // Datos de estadísticas dinámicas
  const stats = [
    { icon: FaGavel, value: statsData.totalSubastas.toLocaleString() + '+', label: 'Subastas Activas', color: '#667eea' },
    { icon: FaUsers, value: '15,000+', label: 'Usuarios Activos', color: '#38a169' },
    { icon: FaTrophy, value: statsData.satisfaccion + '%', label: 'Satisfacción', color: '#ed8936' },
    { icon: FaChartLine, value: '$2.5M+', label: 'Transacciones', color: '#e53e3e' }
  ];

  // Función para cargar subastas
  const cargarSubastas = async () => {
    try {
      setLoading(true);
      const response = await productService.obtenerSubastas({
        limite: 8,
        estado: 'activo',
        ordenar: '-numeroOfertas'
      });
      
      // Agregar imágenes de prueba si no las tienen
      const subastas = response.data?.map((subasta, index) => ({
        ...subasta,
        featured: index === 0, // Marcar la primera como destacada
        imagenes: subasta.imagenes?.length > 0 ? subasta.imagenes : [
          {
            url: `/uploads/products/product-1758258006100-508408191.jpeg`,
            alt: `${subasta.titulo} - imagen 1`,
            esPortada: true
          },
          {
            url: `/uploads/products/product-1758258006288-233267476.jpg`,
            alt: `${subasta.titulo} - imagen 2`,
            esPortada: false
          },
          {
            url: `/uploads/products/product-1758258045170-11283485.jpeg`,
            alt: `${subasta.titulo} - imagen 3`,
            esPortada: false
          }
        ]
      })) || [];
      
      setSubastas(subastas);
      setStatsData(prev => ({
        ...prev,
        totalSubastas: response.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Error cargando subastas:', error);
      setSubastas([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar subastas al montar el componente
  useEffect(() => {
    cargarSubastas();
  }, []);

  // FAQ data
  const faqData = [
    {
      question: '¿Cómo funciona el sistema de subastas?',
      answer: 'Nuestro sistema permite a los vendedores publicar productos y a los compradores hacer ofertas en tiempo real. La oferta más alta al finalizar el tiempo gana la subasta.'
    },
    {
      question: '¿Es seguro comprar en SubastaApp?',
      answer: 'Sí, todas las transacciones están protegidas por nuestro sistema de garantías. Verificamos tanto vendedores como compradores para asegurar transacciones seguras.'
    },
    {
      question: '¿Cómo puedo vender mis productos?',
      answer: 'Si eres vendedor registrado, puedes crear una nueva subasta desde tu dashboard. Solo necesitas subir fotos, describir el producto y establecer el precio inicial.'
    },
    {
      question: '¿Qué métodos de pago aceptan?',
      answer: 'Aceptamos tarjetas de crédito, débito, PayPal y transferencias bancarias. Todos los pagos son procesados de forma segura.'
    },
    {
      question: '¿Puedo cancelar una oferta?',
      answer: 'Las ofertas son vinculantes, pero puedes contactar al soporte dentro de los primeros 30 minutos para casos especiales.'
    }
  ];

  // Categorías populares
  const categories = [
    { name: 'Tecnología', icon: '📱', count: 245, color: '#667eea' },
    { name: 'Arte', icon: '🎨', count: 128, color: '#ed8936' },
    { name: 'Moda', icon: '👔', count: 189, color: '#e53e3e' },
    { name: 'Hogar', icon: '🏠', count: 167, color: '#38a169' },
    { name: 'Deportes', icon: '⚽', count: 98, color: '#3182ce' },
    { name: 'Vehículos', icon: '🚗', count: 76, color: '#805ad5' }
  ];

  // Detectar sección visible
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'stats', 'auctions', 'categories', 'faq'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setVisibleSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  return (
    <Layout currentPage="home">
      <div className="welcome-page">
        {/* Hero Section */}
        <motion.section 
          id="hero"
          className="hero-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="hero-background">
            <div className="hero-pattern"></div>
          </div>
          
          <div className="hero-content">
            <motion.div 
              className="hero-text"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1>
                Bienvenido, <span className="highlight">{user?.nombre}</span>
                <FaCrown className="crown-icon" />
              </h1>
              <p className="hero-subtitle">
                Descubre oportunidades únicas en el mundo de las subastas online
              </p>
              <div className="user-type-badge">
                <FaGem className="gem-icon" />
                {user?.tipoUsuario === 'vendedor' ? 'Vendedor Premium' : 'Comprador Elite'}
              </div>
            </motion.div>

            <motion.div 
              className="hero-actions"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {user?.tipoUsuario === 'vendedor' ? (
                <button 
                  className="cta-button primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <FaPlus />
                  Crear Nueva Subasta
                </button>
              ) : null}
              
              <button className="cta-button secondary">
                <FaEye />
                Explorar Subastas
              </button>
            </motion.div>
          </div>

          <motion.div 
            className="hero-visual"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <div className="floating-cards">
              <div className="card card-1">
                <FaGavel />
                <span>Subastas en vivo</span>
              </div>
              <div className="card card-2">
                <FaFire />
                <span>Ofertas calientes</span>
              </div>
              <div className="card card-3">
                <FaRocket />
                <span>Nuevos productos</span>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Statistics Section */}
        <motion.section 
          id="stats"
          className="stats-section"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="section-header">
            <h2>SubastaApp en Números</h2>
            <p>Más de 50,000 usuarios confían en nosotros</p>
          </div>
          
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="stat-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="stat-icon" style={{ backgroundColor: stat.color }}>
                  <stat.icon />
                </div>
                <div className="stat-content">
                  <h3>{stat.value}</h3>
                  <p>{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Featured Auctions */}
        <motion.section 
          id="auctions"
          className="auctions-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="section-header">
            <h2>Subastas Destacadas</h2>
            <p>No te pierdas estas increíbles oportunidades</p>
          </div>

          <div className="auctions-grid">
            {loading ? (
              // Skeleton loading
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="auction-card skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                  </div>
                </div>
              ))
            ) : subastas.length > 0 ? (
              subastas.map((auction, index) => (
                <AuctionCard
                  key={auction._id || auction.id}
                  auction={auction}
                  user={user}
                  onEdit={setEditAuction}
                  onDelete={async (auction) => {
                    const confirm = await Swal.fire({
                      title: '¿Eliminar subasta?',
                      text: 'Esta acción no se puede deshacer',
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonText: 'Sí, eliminar',
                      cancelButtonText: 'Cancelar'
                    });
                    if (confirm.isConfirmed) {
                      try {
                        await productService.eliminarSubasta(auction._id || auction.id);
                        setSubastas(prev => prev.filter(s => (s._id || s.id) !== (auction._id || auction.id)));
                        Swal.fire('Eliminada', 'La subasta fue eliminada', 'success');
                      } catch (err) {
                        const friendly = err?.status === 403
                          ? 'No tienes permiso para eliminar esta subasta. Debes ser el vendedor propietario. Si ya tiene ofertas, no puedes eliminarla; puedes cancelarla desde el menú de estado.'
                          : err?.message || 'No se pudo eliminar';
                        Swal.fire('Error', friendly, 'error');
                      }
                    }
                  }}
                  onView={() => setSelectedAuction(auction)}
                />
              ))
            ) : (
              <div className="no-auctions">
                <FaGavel />
                <h3>No hay subastas activas</h3>
                <p>Sé el primero en crear una subasta</p>
                {user?.tipoUsuario === 'vendedor' && (
                  <button 
                    className="cta-button primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <FaPlus />
                    Crear Primera Subasta
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="section-footer">
            <button className="view-all-button">
              Ver Todas las Subastas
              <FaChevronDown />
            </button>
          </div>
        </motion.section>

        {/* Categories Section */}
        <motion.section 
          id="categories"
          className="categories-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="section-header">
            <h2>Categorías Populares</h2>
            <p>Encuentra exactamente lo que buscas</p>
          </div>

          <div className="categories-grid">
            {categories.map((category, index) => (
              <motion.div 
                key={category.name}
                className="category-card"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="category-icon">{category.icon}</div>
                <h4>{category.name}</h4>
                <p>{category.count} productos</p>
                <div className="category-color" style={{ backgroundColor: category.color }}></div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* FAQ Section with Accordion */}
        <motion.section 
          id="faq"
          className="faq-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="section-header">
            <h2>Preguntas Frecuentes</h2>
            <p>Todo lo que necesitas saber sobre SubastaApp</p>
          </div>

          <div className="faq-container">
            {faqData.map((faq, index) => (
              <motion.div 
                key={index}
                className={`faq-item ${activeAccordion === index ? 'active' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <button 
                  className="faq-question"
                  onClick={() => toggleAccordion(index)}
                >
                  <FaQuestionCircle className="question-icon" />
                  <span>{faq.question}</span>
                  {activeAccordion === index ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                
                <AnimatePresence>
                  {activeAccordion === index && (
                    <motion.div 
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p>{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Trust Section */}
        <motion.section 
          className="trust-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="trust-content">
            <div className="trust-features">
              <motion.div 
                className="trust-feature"
                whileHover={{ scale: 1.05 }}
              >
                <FaShieldAlt className="trust-icon" />
                <h4>100% Seguro</h4>
                <p>Todas las transacciones están protegidas</p>
              </motion.div>
              
              <motion.div 
                className="trust-feature"
                whileHover={{ scale: 1.05 }}
              >
                <FaHandshake className="trust-icon" />
                <h4>Garantía Total</h4>
                <p>Compra con confianza, vendemos con calidad</p>
              </motion.div>
              
              <motion.div 
                className="trust-feature"
                whileHover={{ scale: 1.05 }}
              >
                <FaRocket className="trust-icon" />
                <h4>Envío Rápido</h4>
                <p>Entregas en 24-48 horas en todo el país</p>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Modal de crear/editar subasta */}
      <CreateAuctionModal
        isOpen={showCreateModal || !!editAuction}
        onClose={() => { setShowCreateModal(false); setEditAuction(null); }}
        auction={editAuction}
        onSuccess={async (auction) => {
          setShowCreateModal(false);
          setEditAuction(null);
          // Recargar todas las subastas para mostrar la nueva
          await cargarSubastas();
        }}
      />

      {/* Modal de detalles y puja para compradores */}
      <AuctionDetailModal
        open={!!selectedAuction}
        auction={selectedAuction}
        onClose={() => setSelectedAuction(null)}
        onBidSuccess={(nuevaOferta) => {
          // Refrescar el precio mostrado en la tarjeta
          setSubastas(prev => prev.map(s => {
            if ((s._id || s.id) === (selectedAuction?._id || selectedAuction?.id)) {
              return { ...s, precioActual: nuevaOferta?.monto, numeroOfertas: (s.numeroOfertas||0)+1 };
            }
            return s;
          }));
        }}
      />
    </Layout>
  );
};

export default WelcomePage;
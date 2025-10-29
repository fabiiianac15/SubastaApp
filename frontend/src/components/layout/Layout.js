import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaGavel, 
  FaHome, 
  FaUser, 
  FaPlus, 
  FaEye, 
  FaChartBar, 
  FaCog, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaBell,
  FaSearch,
  FaCamera,
  FaHeart,
  FaListAlt,
  FaHandHolding,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { useAuth, useAuthActions } from '../../context/AuthContext';
import ProfileModal from '../profile/ProfileModal';
import LoadingTransition from '../common/LoadingTransition';
import NotificationPanel from '../common/NotificationPanel';
import notificationService from '../../services/notificationService';
import './Layout.css';

const Layout = ({ children, currentPage = 'home', onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Iniciar colapsado
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState('');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { logout } = useAuthActions();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.user-profile-section')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  // Cargar imagen de perfil del localStorage
  useEffect(() => {
    const savedImage = localStorage.getItem(`profileImage_${user?._id}`);
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, [user]);

  // Cargar contador de notificaciones no leídas
  useEffect(() => {
    if (user) {
      cargarContadorNotificaciones();
      // Actualizar cada 30 segundos
      const interval = setInterval(cargarContadorNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const cargarContadorNotificaciones = async () => {
    try {
      const res = await notificationService.obtenerContadorNoLeidas();
      setUnreadCount(res.data?.contador || 0);
    } catch (error) {
      console.error('Error cargando contador:', error);
    }
  };

  const menuItems = [
    { icon: FaHome, label: 'Inicio', key: 'dashboard', description: 'Resumen general' },
    { icon: FaEye, label: 'Explorar', key: 'auctions', description: 'Ver todas' },
    ...(user?.tipoUsuario === 'vendedor' ? [{ 
      icon: FaPlus, 
      label: 'Crear', 
      key: 'create', 
      description: 'Nueva subasta' 
    }] : []),
    ...(user?.tipoUsuario === 'vendedor' ? [{ 
      icon: FaListAlt, 
      label: 'Mis Subastas', 
      key: 'my-auctions', 
      description: 'Administrar' 
    }] : []),
    ...(user?.tipoUsuario === 'comprador' ? [{ 
      icon: FaHandHolding, 
      label: 'Mis Pujas', 
      key: 'my-bids', 
      description: 'Historial' 
    }] : []),
    { icon: FaHeart, label: 'Favoritos', key: 'favorites', description: 'Guardados' },
    { icon: FaChartBar, label: 'Estadísticas', key: 'stats', description: 'Análisis' },
    { icon: FaCog, label: 'Ajustes', key: 'settings', description: 'Configurar' }
  ];

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        localStorage.setItem(`profileImage_${user._id}`, reader.result);
        setShowImageUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirigir al landing page
  };

  const handleMenuClick = async (section) => {
    if (section === currentPage) return;
    
    setIsNavigating(true);
    setNavigationTarget(section);
    
    // Simular carga
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Cambiar página
    if (onPageChange) {
      onPageChange(section);
    }
    // Navegar por ruta según la sección
    const routesMap = {
      dashboard: '/dashboard',
      auctions: '/dashboard/auctions',
      create: '/dashboard/create',
      'my-auctions': '/dashboard/my-auctions',
      'my-bids': '/dashboard/my-bids',
      favorites: '/dashboard/favorites',
      stats: '/dashboard/stats',
      settings: '/dashboard/settings'
    };
    if (routesMap[section]) {
      navigate(routesMap[section]);
    }
    
    setIsNavigating(false);
    setNavigationTarget('');
    
    // Cerrar sidebar en móvil
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleNotificationClick = (notification) => {
    // Cerrar panel
    setNotificationPanelOpen(false);
    
    // Navegar según el tipo de notificación
    if (notification.accion) {
      const { tipo, productoId, ofertaId } = notification.accion;
      
      if (tipo === 'ver_subasta' && productoId) {
        // Navegar a la subasta
        navigate(`/dashboard/auctions`);
      } else if (tipo === 'ver_puja' && ofertaId) {
        // Navegar a mis pujas
        navigate('/dashboard/my-bids');
      } else if (tipo === 'pagar' && ofertaId) {
        // Navegar a mis pujas para pagar
        navigate('/dashboard/my-bids');
      }
    }
    
    // Recargar contador
    cargarContadorNotificaciones();
  };

  const handleToggleNotifications = () => {
    setNotificationPanelOpen(!notificationPanelOpen);
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth > 768) && (
          <motion.aside 
            className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
            initial={{ x: sidebarCollapsed ? -200 : -250, width: sidebarCollapsed ? 80 : 250 }}
            animate={{ x: 0, width: sidebarCollapsed ? 80 : 250 }}
            exit={{ x: sidebarCollapsed ? -80 : -250 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="sidebar-header">
              <div className="logo">
                <FaGavel className="logo-icon" />
                {!sidebarCollapsed && <h2>SubastaApp</h2>}
              </div>
              
              <div className="sidebar-controls">
                <button 
                  className="collapse-sidebar"
                  onClick={toggleSidebar}
                  title={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                >
                  {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                </button>
                
                {window.innerWidth <= 768 && (
                  <button 
                    className="close-sidebar"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            <nav className="sidebar-nav">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.key}
                  className={`nav-item ${currentPage === item.key ? 'active' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: sidebarCollapsed ? 0 : 8, scale: sidebarCollapsed ? 1.1 : 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMenuClick(item.key)}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <item.icon className="nav-icon" />
                  {!sidebarCollapsed && (
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  )}
                  {currentPage === item.key && (
                    <motion.div 
                      className="active-indicator"
                      layoutId="activeIndicator"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </nav>

            <div className="sidebar-footer">
              <button 
                className={`logout-btn ${sidebarCollapsed ? 'collapsed' : ''}`}
                onClick={handleLogout}
                title={sidebarCollapsed ? 'Cerrar Sesión' : ''}
              >
                <FaSignOutAlt />
                {!sidebarCollapsed && <span>Cerrar Sesión</span>}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${!sidebarOpen && window.innerWidth <= 768 ? 'sidebar-closed' : ''}`}>
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="navbar-left">
            <button 
              className="menu-toggle"
              onClick={toggleSidebar}
            >
              {sidebarCollapsed || (!sidebarOpen && window.innerWidth <= 768) ? <FaBars /> : <FaChevronLeft />}
            </button>
            
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar subastas..." 
              />
            </div>
          </div>

          <div className="navbar-right">
            <button 
              className="notification-btn"
              onClick={handleToggleNotifications}
            >
              <FaBell />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            <div className="user-profile-section">
              <button 
                className="user-profile-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="user-avatar">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                    </div>
                  )}
                  <div className="avatar-status"></div>
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.nombre} {user?.apellido}</span>
                  <span className="user-type">{user?.tipoUsuario}</span>
                </div>
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div 
                    className="profile-dropdown"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" />
                        ) : (
                          <div className="avatar-placeholder">
                            {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                          </div>
                        )}
                        <button 
                          className="change-photo-btn"
                          onClick={() => setShowImageUpload(true)}
                        >
                          <FaCamera />
                        </button>
                      </div>
                      <div>
                        <h4>{user?.nombre} {user?.apellido}</h4>
                        <p>{user?.email}</p>
                        <span className="user-badge">{user?.tipoUsuario}</span>
                      </div>
                    </div>

                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          setShowProfileModal(true);
                          setProfileDropdownOpen(false);
                        }}
                      >
                        <FaUser />
                        Ver Perfil Completo
                      </button>
                      <button className="dropdown-item">
                        <FaCog />
                        Configuración
                      </button>
                      <div className="dropdown-divider"></div>
                      <button 
                        className="dropdown-item logout"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt />
                        Cerrar Sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="content-area">
          <AnimatePresence mode="wait">
            {isNavigating ? (
              <LoadingTransition key="loading" targetPage={navigationTarget} />
            ) : (
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Backdrop para mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modal de cambio de imagen */}
      <AnimatePresence>
        {showImageUpload && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>Cambiar Foto de Perfil</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowImageUpload(false)}
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="upload-area">
                  <FaCamera className="upload-icon" />
                  <p>Selecciona una nueva foto de perfil</p>
                  <button 
                    className="upload-btn"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Seleccionar Archivo
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Notification Panel */}
      <NotificationPanel
        open={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
        onNotificationClick={handleNotificationClick}
        onCountChange={(c) => setUnreadCount(c)}
      />
    </div>
  );
};

export default Layout;
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaEdit,
  FaCamera,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaGavel,
  FaTrophy,
  FaShoppingBag,
  FaStar
} from 'react-icons/fa';
import { useAuth, useAuthActions } from '../../context/AuthContext';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    direccion: {
      calle: user?.direccion?.calle || '',
      ciudad: user?.direccion?.ciudad || '',
      codigoPostal: user?.direccion?.codigoPostal || '',
      pais: user?.direccion?.pais || ''
    },
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const fileInputRef = useRef(null);

  // Cargar imagen de perfil del localStorage
  useEffect(() => {
    if (user?._id) {
      const savedImage = localStorage.getItem(`profileImage_${user._id}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    }
  }, [user]);

  // Estadísticas del usuario (datos ficticios por ahora)
  const userStats = {
    totalAuctions: user?.tipoUsuario === 'vendedor' ? 15 : 0,
    totalBids: user?.tipoUsuario === 'comprador' ? 47 : 0,
    wonAuctions: user?.tipoUsuario === 'comprador' ? 8 : 0,
    soldItems: user?.tipoUsuario === 'vendedor' ? 12 : 0,
    rating: 4.8,
    totalRatings: 156
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('direccion.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        direccion: {
          ...prev.direccion,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        localStorage.setItem(`profileImage_${user._id}`, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Aquí implementarías la lógica para actualizar el perfil
    console.log('Guardando perfil:', formData);
    setIsEditing(false);
  };

  const handlePasswordChange = () => {
    // Aquí implementarías la lógica para cambiar la contraseña
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    console.log('Cambiando contraseña');
    setShowPasswordChange(false);
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="profile-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="profile-modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="profile-modal-header">
            <h2>Mi Perfil</h2>
            <div className="header-actions">
              {!isEditing ? (
                <button 
                  className="edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <FaEdit /> Editar
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    className="save-btn"
                    onClick={handleSave}
                  >
                    <FaSave /> Guardar
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        nombre: user?.nombre || '',
                        apellido: user?.apellido || '',
                        email: user?.email || '',
                        telefono: user?.telefono || '',
                        direccion: {
                          calle: user?.direccion?.calle || '',
                          ciudad: user?.direccion?.ciudad || '',
                          codigoPostal: user?.direccion?.codigoPostal || '',
                          pais: user?.direccion?.pais || ''
                        }
                      });
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              )}
              <button 
                className="close-btn"
                onClick={onClose}
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="profile-modal-body">
            <div className="profile-content">
              {/* Left Column - Profile Info */}
              <div className="profile-info">
                {/* Avatar Section */}
                <div className="avatar-section">
                  <div className="avatar-container">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" />
                    ) : (
                      <div className="avatar-placeholder">
                        <FaUser />
                      </div>
                    )}
                    {isEditing && (
                      <button 
                        className="change-avatar-btn"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <FaCamera />
                      </button>
                    )}
                    <input 
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                  
                  <div className="user-basic-info">
                    <h3>{user?.nombre} {user?.apellido}</h3>
                    <p className="user-type-badge">
                      <FaGavel /> {user?.tipoUsuario}
                    </p>
                    <div className="user-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < Math.floor(userStats.rating) ? 'filled' : 'empty'} 
                          />
                        ))}
                      </div>
                      <span>{userStats.rating} ({userStats.totalRatings} reseñas)</span>
                    </div>
                    <p className="member-since">
                      Miembro desde {new Date(user?.fechaRegistro).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="stats-section">
                  <h4>Estadísticas</h4>
                  <div className="stats-grid">
                    {user?.tipoUsuario === 'vendedor' ? (
                      <>
                        <div className="stat-item">
                          <FaGavel className="stat-icon" />
                          <div>
                            <span className="stat-value">{userStats.totalAuctions}</span>
                            <span className="stat-label">Subastas Creadas</span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <FaShoppingBag className="stat-icon" />
                          <div>
                            <span className="stat-value">{userStats.soldItems}</span>
                            <span className="stat-label">Productos Vendidos</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="stat-item">
                          <FaEye className="stat-icon" />
                          <div>
                            <span className="stat-value">{userStats.totalBids}</span>
                            <span className="stat-label">Ofertas Realizadas</span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <FaTrophy className="stat-icon" />
                          <div>
                            <span className="stat-value">{userStats.wonAuctions}</span>
                            <span className="stat-label">Subastas Ganadas</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Form */}
              <div className="profile-form">
                <div className="form-section">
                  <h4>Información Personal</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre</label>
                      <div className="input-with-icon">
                        <FaUser className="input-icon" />
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Apellido</label>
                      <div className="input-with-icon">
                        <FaUser className="input-icon" />
                        <input
                          type="text"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <div className="input-with-icon">
                      <FaEnvelope className="input-icon" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Teléfono</label>
                    <div className="input-with-icon">
                      <FaPhone className="input-icon" />
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4><FaMapMarkerAlt /> Dirección</h4>
                  <div className="form-group">
                    <label>Calle</label>
                    <input
                      type="text"
                      name="direccion.calle"
                      value={formData.direccion.calle}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Ciudad</label>
                      <input
                        type="text"
                        name="direccion.ciudad"
                        value={formData.direccion.ciudad}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="form-group">
                      <label>Código Postal</label>
                      <input
                        type="text"
                        name="direccion.codigoPostal"
                        value={formData.direccion.codigoPostal}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>País</label>
                    <input
                      type="text"
                      name="direccion.pais"
                      value={formData.direccion.pais}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Password Section */}
                <div className="form-section">
                  <div className="section-header">
                    <h4>Seguridad</h4>
                    <button 
                      className="toggle-password-btn"
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                    >
                      {showPasswordChange ? <FaEyeSlash /> : <FaEye />}
                      {showPasswordChange ? 'Ocultar' : 'Cambiar Contraseña'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showPasswordChange && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="password-change-form"
                      >
                        <div className="form-group">
                          <label>Contraseña Actual</label>
                          <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            placeholder="Ingresa tu contraseña actual"
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Nueva Contraseña</label>
                            <input
                              type="password"
                              name="newPassword"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              placeholder="Nueva contraseña"
                            />
                          </div>
                          <div className="form-group">
                            <label>Confirmar Contraseña</label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              placeholder="Confirma la contraseña"
                            />
                          </div>
                        </div>

                        <button 
                          className="change-password-btn"
                          onClick={handlePasswordChange}
                        >
                          Actualizar Contraseña
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileModal;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { FaFacebookF, FaTwitter, FaGoogle, FaLinkedinIn } from 'react-icons/fa';
import { useAuthActions, useAuth } from '../../context/AuthContext';
import './AuthForm.css';

const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    // Login fields
    email: '',
    password: '',
    // Register fields
    nombre: '',
    apellido: '',
    telefono: '',
    tipoUsuario: 'comprador',
    direccion: {
      calle: '',
      ciudad: '',
      codigoPostal: '',
      pais: 'Colombia'
    }
  });

  const { login, register, clearError } = useAuthActions();
  const { loading, error } = useAuth();
  // Estado local para errores detallados
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors([]);
    try {
      if (isSignUp) {
        // REGISTRO: Envía datos completos (nombre, apellido, email, teléfono, contraseña, tipo usuario, dirección)
        await register(formData);
      } else {
        // LOGIN: Envía solo email y contraseña
        await login({
          email: formData.email,
          password: formData.password
        });
      }
      // Redirección se maneja en el contexto
    } catch (err) {
      // Si la respuesta tiene errores de validación, mostrarlos
      if (err.errors && Array.isArray(err.errors)) {
        setFieldErrors(err.errors);
      } else {
        setFieldErrors([]);
      }
      console.error('Error en autenticación:', err);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    clearError();
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      telefono: '',
      tipoUsuario: 'comprador',
      direccion: {
        calle: '',
        ciudad: '',
        codigoPostal: '',
        pais: 'Colombia'
      }
    });
  };

  return (
    <div className="auth-container">
      {/* Panel Izquierdo - Azul con ilustraciones */}
      <motion.div 
        className={`auth-left-panel ${isSignUp ? 'move-right' : ''}`}
        animate={{
          x: isSignUp ? '100%' : '0%'
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <div className="auth-content">
          <motion.div
            key={isSignUp ? 'signup-content' : 'signin-content'}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2>{isSignUp ? '¿Ya tienes cuenta?' : '¿Nuevo aquí?'}</h2>
            <p>
              {isSignUp 
                ? 'Ingresa con tus datos personales y comienza tu experiencia de subastas con nosotros'
                : 'Regístrate y descubre un mundo de oportunidades únicas en nuestras subastas exclusivas'
              }
            </p>
            <button 
              className="auth-toggle-btn"
              onClick={toggleMode}
              disabled={loading}
            >
              {isSignUp ? 'SIGN IN' : 'SIGN UP'}
            </button>
          </motion.div>

          {/* Ilustraciones */}
          <div className="auth-illustration">
            <AnimatePresence mode="wait">
              {isSignUp ? (
                <motion.div
                  key="signin-illustration"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  className="illustration-content"
                >
                  {/* Martillo de subasta */}
                  <div className="auction-hammer">
                    <div className="hammer-head"></div>
                    <div className="hammer-handle"></div>
                  </div>
                  {/* Monedas flotantes */}
                  <div className="floating-coins">
                    <div className="coin coin-1">$</div>
                    <div className="coin coin-2">€</div>
                    <div className="coin coin-3">¥</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-illustration"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  className="illustration-content"
                >
                  {/* Cohete de subastas */}
                  <div className="auction-rocket">
                    <div className="rocket-body"></div>
                    <div className="rocket-window"></div>
                    <div className="rocket-flames">
                      <div className="flame"></div>
                      <div className="flame"></div>
                      <div className="flame"></div>
                    </div>
                  </div>
                  {/* Persona con laptop */}
                  <div className="person-bidding">
                    <div className="person-body"></div>
                    <div className="person-head"></div>
                    <div className="laptop"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Panel Derecho - Formulario */}
      <motion.div 
        className={`auth-right-panel ${isSignUp ? 'move-left' : ''}`}
        animate={{
          x: isSignUp ? '-100%' : '0%'
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <div className="auth-form-container">
          <AnimatePresence mode="wait">
            <motion.form
              key={isSignUp ? 'signup-form' : 'signin-form'}
              initial={{ opacity: 0, x: isSignUp ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -100 : 100 }}
              transition={{ duration: 0.5 }}
              onSubmit={handleSubmit}
              className="auth-form"
            >
              <h2>{isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
              

              {(error || fieldErrors.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="error-message"
                >
                  {error && <div>{error}</div>}
                  {fieldErrors.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {fieldErrors.map((err, idx) => (
                        <li key={idx}>{err.msg}</li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}

              {isSignUp ? (
                // Formulario de Registro
                <div className="form-fields">
                  <div className="form-row">
                    <div className="input-group">
                      <FaUser className="input-icon" />
                      <input
                        type="text"
                        name="nombre"
                        placeholder="Nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <FaUser className="input-icon" />
                      <input
                        type="text"
                        name="apellido"
                        placeholder="Apellido"
                        value={formData.apellido}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <FaPhone className="input-icon" />
                    <input
                      type="tel"
                      name="telefono"
                      placeholder="Teléfono (+573001234567)"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <FaLock className="input-icon" />
                    <input
                      type="password"
                      name="password"
                      placeholder="Contraseña"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength="6"
                    />
                  </div>

                  <div className="input-group">
                    <select
                      name="tipoUsuario"
                      value={formData.tipoUsuario}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="comprador">Comprador</option>
                      <option value="vendedor">Vendedor</option>
                    </select>
                  </div>

                  <div className="form-section">
                    <h4><FaMapMarkerAlt /> Dirección</h4>
                    <div className="form-row">
                      <div className="input-group">
                        <input
                          type="text"
                          name="direccion.calle"
                          placeholder="Calle"
                          value={formData.direccion.calle}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <input
                          type="text"
                          name="direccion.ciudad"
                          placeholder="Ciudad"
                          value={formData.direccion.ciudad}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="input-group">
                        <input
                          type="text"
                          name="direccion.codigoPostal"
                          placeholder="Código Postal"
                          value={formData.direccion.codigoPostal}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <input
                          type="text"
                          name="direccion.pais"
                          placeholder="País"
                          value={formData.direccion.pais}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Formulario de Login
                <div className="form-fields">
                  <div className="input-group">
                    <FaUser className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <FaLock className="input-icon" />
                    <input
                      type="password"
                      name="password"
                      placeholder="Contraseña"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? 'Cargando...' : (isSignUp ? 'REGISTRARSE' : 'INICIAR SESIÓN')}
              </button>

              {!isSignUp && (
                <div className="social-login">
                  <p>O inicia sesión con redes sociales</p>
                  <div className="social-buttons">
                    <button type="button" className="social-btn facebook">
                      <FaFacebookF />
                    </button>
                    <button type="button" className="social-btn twitter">
                      <FaTwitter />
                    </button>
                    <button type="button" className="social-btn google">
                      <FaGoogle />
                    </button>
                    <button type="button" className="social-btn linkedin">
                      <FaLinkedinIn />
                    </button>
                  </div>
                </div>
              )}
            </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthForm;

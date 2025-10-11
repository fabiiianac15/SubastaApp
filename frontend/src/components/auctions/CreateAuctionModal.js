import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaUpload, 
  FaImage, 
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaCalendarAlt,
  FaDollarSign,
  FaPercentage,
  FaGavel,
  FaSave,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import productService from '../../services/productService';
import authService from '../../services/authService';
import './CreateAuctionModal.css';

const CreateAuctionModal = ({ isOpen, onClose, auction = null, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [imagenes, setImagenes] = useState([]);
  const [imagenesPreview, setImagenesPreview] = useState([]);
  const [focusedField, setFocusedField] = useState(null);
  const [validatedFields, setValidatedFields] = useState(new Set());
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'tecnologia',
    precioInicial: '',
    porcentajeMinimo: '5',
    fechaInicio: '',
    fechaFin: '',
    tipoSubasta: 'publica',
    condiciones: '',
    tags: ''
  });
  const [iniciarAhora, setIniciarAhora] = useState(false);

  // Actualizar fecha/hora de inicio cada segundo si 'Iniciar ahora' está activo
  useEffect(() => {
    let interval;
    if (iniciarAhora) {
      interval = setInterval(() => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - tzOffset).toISOString().slice(0, 16);
        setFormData(prev => ({ ...prev, fechaInicio: localISOTime }));
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [iniciarAhora]);

  // Cargar datos si es edición
  useEffect(() => {
    if (auction) {
      setFormData({
        titulo: auction.titulo || '',
        descripcion: auction.descripcion || '',
        categoria: auction.categoria || 'tecnologia',
        precioInicial: auction.precioInicial?.toString() || '',
        porcentajeMinimo: auction.porcentajeMinimo?.toString() || '5',
        fechaInicio: auction.fechaInicio ? new Date(auction.fechaInicio).toISOString().slice(0, 16) : '',
        fechaFin: auction.fechaFin ? new Date(auction.fechaFin).toISOString().slice(0, 16) : '',
        tipoSubasta: auction.tipoSubasta || 'publica',
        condiciones: auction.condiciones || '',
        tags: auction.tags ? auction.tags.join(', ') : ''
      });

      if (auction.imagenes && auction.imagenes.length > 0) {
        setImagenesPreview(auction.imagenes.map(img => ({
          id: img._id || Math.random(),
          url: img.url.startsWith('http') ? img.url : `${process.env.REACT_APP_API_URL.replace('/api', '')}${img.url}`,
          isExisting: true
        })));
      }
    }
  }, [auction]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear error when user starts typing
    if (error) setError(null);
    
    if (name === 'iniciarAhora') {
      setIniciarAhora(checked);
      if (checked) {
        // Obtener fecha/hora local en formato compatible con input datetime-local
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - tzOffset).toISOString().slice(0, 16);
        setFormData(prev => ({ ...prev, fechaInicio: localISOTime }));
      } else {
        setFormData(prev => ({ ...prev, fechaInicio: '' }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Real-time validation
    validateField(name, value);
  };

  const validateField = (fieldName, value) => {
    let isValid = false;
    
    switch (fieldName) {
      case 'titulo':
        isValid = value.trim().length >= 5 && value.trim().length <= 100;
        break;
      case 'descripcion':
        isValid = value.trim().length >= 20 && value.trim().length <= 2000;
        break;
      case 'precioInicial':
        isValid = Number(value) > 0;
        break;
      case 'fechaInicio':
      case 'fechaFin':
        isValid = value !== '';
        break;
      default:
        isValid = value.trim() !== '';
    }
    
    setValidatedFields(prev => {
      const newSet = new Set(prev);
      if (isValid) {
        newSet.add(fieldName);
      } else {
        newSet.delete(fieldName);
      }
      return newSet;
    });
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (imagenesPreview.length + files.length > 5) {
      setError('Máximo 5 imágenes permitidas');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Cada imagen debe ser menor a 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Math.random(),
          file,
          url: e.target.result,
          isNew: true
        };
        
        setImagenes(prev => [...prev, file]);
        setImagenesPreview(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => {
    setImagenesPreview(prev => prev.filter(img => img.id !== id));
    setImagenes(prev => {
      const imageToRemove = imagenesPreview.find(img => img.id === id);
      if (imageToRemove?.isNew) {
        return prev.filter(file => file !== imageToRemove.file);
      }
      return prev;
    });
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.titulo.trim()) errors.push('El título es requerido');
    if (!formData.descripcion.trim()) errors.push('La descripción es requerida');
    if (!formData.precioInicial || Number(formData.precioInicial) <= 0) {
      errors.push('El precio inicial debe ser mayor a 0');
    }
    if (!formData.fechaInicio) errors.push('La fecha de inicio es requerida');
    if (!formData.fechaFin) errors.push('La fecha de fin es requerida');
    
    if (formData.fechaInicio && formData.fechaFin) {
      const inicio = new Date(formData.fechaInicio);
      const fin = new Date(formData.fechaFin);

      if (fin <= inicio) {
        errors.push('La fecha de fin debe ser posterior al inicio');
      }

      // Redondear ambos a minutos para evitar falsos positivos por segundos/milisegundos
      if (!auction) {
        const ahora = new Date();
        inicio.setSeconds(0, 0);
        ahora.setSeconds(0, 0);
        if (inicio < ahora) {
          errors.push('La fecha de inicio no puede ser en el pasado');
        }
      }

      const duracion = fin - inicio;
      const unaHora = 60 * 60 * 1000;
      if (duracion < unaHora) {
        errors.push('La subasta debe durar al menos 1 hora');
      }
    }

    if (!auction && imagenesPreview.length === 0) {
      errors.push('Debe subir al menos una imagen');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar autenticación y tipo de usuario antes de enviar
    const token = localStorage.getItem('token');
    const user = authService.getCurrentUser();
    console.log('=== DEBUG INICIO CREACIÓN SUBASTA ===');
    console.log('Token:', token);
    console.log('Usuario:', user);
    if (!token) {
      setError('Debes iniciar sesión para crear una subasta.');
      return;
    }
    if (!user || user.tipoUsuario !== 'vendedor') {
      setError('Solo los usuarios con perfil de vendedor pueden crear subastas.');
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      // Agregar campos de texto
      Object.keys(formData).forEach(key => {
        console.log(`Agregando campo ${key}:`, formData[key]);
        formDataToSend.append(key, formData[key]);
      });

      // Agregar imágenes nuevas
      console.log('Número de imágenes a enviar:', imagenes.length);
      imagenes.forEach((file, index) => {
        console.log(`Imagen ${index + 1}:`, file.name, file.size, 'bytes');
        formDataToSend.append('imagenes', file);
      });

      // Debug FormData
      console.log('=== CONTENIDO DE FORMDATA ===');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, ':', value);
      }

      let response;
      if (auction) {
        // Si es edición, solo enviar campos permitidos
        const allowedFields = ['descripcion', 'condiciones', 'fechaFin'];
        const updateData = {};
        allowedFields.forEach(field => {
          if (formData[field] !== undefined) {
            updateData[field] = formData[field];
          }
        });
        console.log('Actualizando subasta con:', updateData);
        response = await productService.actualizarSubasta(auction._id, updateData);
      } else {
        console.log('Creando nueva subasta...');
        response = await productService.crearSubasta(formDataToSend);
        console.log('Respuesta del servidor:', response);
      }

      onSuccess?.(response.data);
      
      // Show success message briefly before closing
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);

      // Reset form
      setFormData({
        titulo: '',
        descripcion: '',
        categoria: 'tecnologia',
        precioInicial: '',
        porcentajeMinimo: '5',
        fechaInicio: '',
        fechaFin: '',
        tipoSubasta: 'publica',
        condiciones: '',
        tags: ''
      });
      setImagenes([]);
      setImagenesPreview([]);
      setValidatedFields(new Set());

    } catch (error) {
      console.error('=== ERROR COMPLETO ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Mostrar errores de validación múltiples si existen
      if (error.errors && Array.isArray(error.errors)) {
        setError(error.errors.map(e => e.msg).join('. '));
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Error procesando la solicitud');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="create-auction-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
      >
        <motion.div 
          className="create-auction-modal"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ 
            duration: 0.5, 
            type: "spring",
            stiffness: 300,
            damping: 30 
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <motion.div 
            className="modal-header"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2>
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <FaGavel />
              </motion.div>
              {auction ? 'Editar Subasta' : 'Crear Nueva Subasta'}
            </h2>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </motion.div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="modal-content">
            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, x: -50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{ whiteSpace: 'pre-line' }}
              >
                <FaExclamationTriangle />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                className="success-message"
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <FaCheckCircle />
                ¡Subasta {auction ? 'actualizada' : 'creada'} exitosamente!
              </motion.div>
            )}

            <motion.div 
              className="form-sections"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {/* Información Básica */}
              <motion.div 
                className="form-section"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h3>📝 Información Básica</h3>
                
                <div className={`form-group ${focusedField === 'titulo' ? 'focused' : ''} ${validatedFields.has('titulo') ? 'success' : ''}`}>
                  <label>Título de la Subasta *</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('titulo')}
                    onBlur={handleBlur}
                    placeholder="Ej: iPhone 14 Pro Max - Nuevo en caja"
                    maxLength="100"
                    disabled={auction?.numeroOfertas > 0}
                    data-tooltip="Mínimo 5 caracteres, máximo 100"
                    required
                  />
                  <span className="char-count">{formData.titulo.length}/100</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Categoría *</label>
                    <select
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      disabled={auction?.numeroOfertas > 0}
                      required
                    >
                      {productService.categorias.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tipo de Subasta *</label>
                    <div className="radio-group">
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="tipoSubasta"
                          value="publica"
                          checked={formData.tipoSubasta === 'publica'}
                          onChange={handleInputChange}
                          disabled={auction?.numeroOfertas > 0}
                        />
                        <FaEye /> Pública
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="tipoSubasta"
                          value="privada"
                          checked={formData.tipoSubasta === 'privada'}
                          onChange={handleInputChange}
                          disabled={auction?.numeroOfertas > 0}
                        />
                        <FaEyeSlash /> Privada
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción *</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    placeholder="Describe detalladamente el producto, su estado, características especiales, etc."
                    rows="5"
                    maxLength="2000"
                    required
                  />
                  <span className="char-count">{formData.descripcion.length}/2000</span>
                </div>

                <div className="form-group">
                  <label>Etiquetas (opcional)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="Ej: nuevo, original, garantía (separadas por comas)"
                    disabled={auction?.numeroOfertas > 0}
                  />
                  <small>Máximo 10 etiquetas, separadas por comas</small>
                </div>
              </motion.div>

              {/* Precios y Tiempo */}
              <motion.div 
                className="form-section"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3>💰 Precios y Duración</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Precio Inicial *</label>
                    <div className="input-with-icon">
                      <FaDollarSign className="input-icon" />
                      <input
                        type="number"
                        name="precioInicial"
                        value={formData.precioInicial}
                        onChange={handleInputChange}
                        min="1"
                        step="any"
                        placeholder="1"
                        disabled={auction?.numeroOfertas > 0}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Incremento Mínimo *</label>
                    <div className="input-with-icon">
                      <FaPercentage className="input-icon" />
                      <input
                        type="number"
                        name="porcentajeMinimo"
                        value={formData.porcentajeMinimo}
                        onChange={handleInputChange}
                        min="1"
                        max="50"
                        step="0.1"
                        placeholder="5"
                        disabled={auction?.numeroOfertas > 0}
                        required
                      />
                    </div>
                    <small>% del precio actual que debe incrementar cada oferta</small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha y Hora de Inicio *</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="input-with-icon" style={{ flex: 1 }}>
                        <FaCalendarAlt className="input-icon" />
                        <input
                          type="datetime-local"
                          name="fechaInicio"
                          value={formData.fechaInicio}
                          onChange={handleInputChange}
                          min={new Date().toISOString().slice(0, 16)}
                          disabled={auction?.numeroOfertas > 0 || iniciarAhora}
                          required
                        />
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                        <input
                          type="checkbox"
                          name="iniciarAhora"
                          checked={iniciarAhora}
                          onChange={handleInputChange}
                          disabled={auction?.numeroOfertas > 0}
                        />
                        Iniciar ahora
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Fecha y Hora de Fin *</label>
                    <div className="input-with-icon">
                      <FaCalendarAlt className="input-icon" />
                      <input
                        type="datetime-local"
                        name="fechaFin"
                        value={formData.fechaFin}
                        onChange={handleInputChange}
                        min={formData.fechaInicio || new Date().toISOString().slice(0, 16)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {formData.precioInicial && formData.porcentajeMinimo && (
                  <div className="price-preview">
                    <p>💡 <strong>Vista previa:</strong></p>
                    <p>Precio inicial: <strong>{productService.formatearMoneda(Number(formData.precioInicial))}</strong></p>
                    <p>Incremento mínimo: <strong>{productService.formatearMoneda(Math.ceil(Number(formData.precioInicial) * (Number(formData.porcentajeMinimo) / 100)))}</strong></p>
                  </div>
                )}
              </motion.div>

              {/* Imágenes */}
              <motion.div 
                className="form-section"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h3>📷 Imágenes del Producto</h3>
                
                <div className="upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  
                  {imagenesPreview.length < 5 && (
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={() => fileInputRef.current.click()}
                      disabled={loading}
                    >
                      <FaUpload />
                      {imagenesPreview.length === 0 ? 'Subir Imágenes *' : 'Agregar Más'}
                    </button>
                  )}

                  <div className="images-preview">
                    {imagenesPreview.map((image, index) => (
                      <div key={image.id} className={`image-preview ${index === 0 ? 'primary' : ''}`}>
                        <img src={image.url} alt={`Preview ${index + 1}`} />
                        {index === 0 && <span className="primary-badge">Principal</span>}
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => removeImage(image.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="upload-info">
                    <FaImage /> Formatos: JPG, PNG, GIF, WEBP. Máximo 5MB por imagen.
                    {imagenesPreview.length > 0 && (
                      <span> ({imagenesPreview.length}/5 imágenes)</span>
                    )}
                  </p>
                </div>
              </motion.div>

              {/* Condiciones */}
              <motion.div 
                className="form-section"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3>📋 Condiciones Adicionales</h3>
                
                <div className="form-group">
                  <label>Términos y Condiciones (opcional)</label>
                  <textarea
                    name="condiciones"
                    value={formData.condiciones}
                    onChange={handleInputChange}
                    placeholder="Ej: Producto en perfecto estado, incluye caja original, entrega en Bogotá..."
                    rows="3"
                    maxLength="500"
                  />
                  <span className="char-count">{formData.condiciones.length}/500</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Footer */}
            <motion.div 
              className="modal-footer"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinning" />
                    {auction ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    <FaSave />
                    {auction ? 'Actualizar Subasta' : 'Crear Subasta'}
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateAuctionModal;

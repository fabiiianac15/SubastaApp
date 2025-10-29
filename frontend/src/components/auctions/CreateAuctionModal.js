import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaUpload, FaImage, FaTrash, FaEye, FaEyeSlash,
  FaCalendarAlt, FaDollarSign, FaPercentage, FaGavel,
  FaSave, FaSpinner, FaExclamationTriangle, FaCheckCircle
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
  const fileInputRef = useRef(null);
  const [iniciarAhora, setIniciarAhora] = useState(false);

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
    if (error) setError(null);
    
    if (name === 'iniciarAhora') {
      setIniciarAhora(checked);
      if (checked) {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - tzOffset).toISOString().slice(0, 16);
        setFormData(prev => ({ ...prev, fechaInicio: localISOTime }));
      } else {
        setFormData(prev => ({ ...prev, fechaInicio: '' }));
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      titulo: '', descripcion: '', categoria: 'tecnologia',
      precioInicial: '', porcentajeMinimo: '5', fechaInicio: '',
      fechaFin: '', tipoSubasta: 'publica', condiciones: '', tags: ''
    });
    setImagenes([]);
    setImagenesPreview([]);
    setIniciarAhora(false);
    setError(null);
    setSuccess(false);
  };

  const handleImageSelect = (e) => {
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
        setImagenes(prev => [...prev, file]);
        setImagenesPreview(prev => [...prev, {
          id: Math.random(), file, url: e.target.result, isNew: true
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => {
    const imageToRemove = imagenesPreview.find(img => img.id === id);
    setImagenesPreview(prev => prev.filter(img => img.id !== id));
    if (imageToRemove?.isNew) {
      setImagenes(prev => prev.filter(file => file !== imageToRemove.file));
    }
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
        errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      const duracionMinutos = (fin - inicio) / 60000;
      if (duracionMinutos < 60) {
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

    const token = localStorage.getItem('token');
    const user = authService.getCurrentUser();
    
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
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      imagenes.forEach((file) => {
        formDataToSend.append('imagenes', file);
      });

      let response;
      if (auction) {
        const updateFormData = new FormData();
        if (!auction.numeroOfertas || auction.numeroOfertas === 0) {
          Object.keys(formData).forEach(key => updateFormData.append(key, formData[key]));
          imagenes.forEach((file) => updateFormData.append('imagenes', file));
        } else {
          ['titulo', 'descripcion', 'condiciones', 'tags'].forEach(field => {
            if (formData[field]) updateFormData.append(field, formData[field]);
          });
        }
        response = await productService.actualizarSubasta(auction._id, updateFormData);
      } else {
        response = await productService.crearSubasta(formDataToSend);
      }

      onSuccess?.(response.data);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        resetForm();
      }, 1500);

    } catch (error) {
      if (error.errors && Array.isArray(error.errors)) {
        setError(error.errors.map(e => e.msg).join('. '));
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message || 'Error procesando la solicitud');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="create-auction-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="create-auction-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
          
          <div className="modal-header">
            <h2><FaGavel /> {auction ? 'Editar Subasta' : 'Crear Nueva Subasta'}</h2>
            <button className="close-btn" onClick={onClose}><FaTimes /></button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body">
            {error && <div className="error-message"><FaExclamationTriangle /> {error}</div>}
            {success && <div className="success-message"><FaCheckCircle /> ¡Subasta {auction ? 'actualizada' : 'creada'} exitosamente!</div>}

            <div className="form-group">
              <label>Título *</label>
              <input type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} 
                placeholder="Ej: iPhone 14 Pro Max" maxLength="100" disabled={auction?.numeroOfertas > 0} required />
              <span className="char-count">{formData.titulo.length}/100</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoría *</label>
                <select name="categoria" value={formData.categoria} onChange={handleInputChange} disabled={auction?.numeroOfertas > 0} required>
                  {productService.categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tipo *</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input type="radio" name="tipoSubasta" value="publica" checked={formData.tipoSubasta === 'publica'} onChange={handleInputChange} disabled={auction?.numeroOfertas > 0} />
                    <FaEye /> Pública
                  </label>
                  <label className="radio-option">
                    <input type="radio" name="tipoSubasta" value="privada" checked={formData.tipoSubasta === 'privada'} onChange={handleInputChange} disabled={auction?.numeroOfertas > 0} />
                    <FaEyeSlash /> Privada
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Descripción *</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} 
                placeholder="Describe el producto..." rows="4" maxLength="2000" required />
              <span className="char-count">{formData.descripcion.length}/2000</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Precio Inicial *</label>
                <div className="input-with-icon">
                  <FaDollarSign />
                  <input type="number" name="precioInicial" value={formData.precioInicial} onChange={handleInputChange} 
                    min="1" step="any" placeholder="1000" disabled={auction?.numeroOfertas > 0} required />
                </div>
              </div>

              <div className="form-group">
                <label>Incremento (%) *</label>
                <div className="input-with-icon">
                  <FaPercentage />
                  <input type="number" name="porcentajeMinimo" value={formData.porcentajeMinimo} onChange={handleInputChange} 
                    min="1" max="50" step="0.1" placeholder="5" disabled={auction?.numeroOfertas > 0} required />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Inicio *</label>
                <div className="datetime-wrapper">
                  <div className="input-with-icon">
                    <FaCalendarAlt />
                    <input type="datetime-local" name="fechaInicio" value={formData.fechaInicio} onChange={handleInputChange} 
                      disabled={auction?.numeroOfertas > 0 || iniciarAhora} required />
                  </div>
                  <label className="checkbox-label">
                    <input type="checkbox" name="iniciarAhora" checked={iniciarAhora} onChange={handleInputChange} disabled={auction?.numeroOfertas > 0} />
                    Ahora
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Fin *</label>
                <div className="input-with-icon">
                  <FaCalendarAlt />
                  <input type="datetime-local" name="fechaFin" value={formData.fechaFin} onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Imágenes *</label>
              <div className="upload-area">
                <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                
                {imagenesPreview.length < 5 && (
                  <button type="button" className="upload-btn" onClick={() => fileInputRef.current.click()} disabled={loading}>
                    <FaUpload /> {imagenesPreview.length === 0 ? 'Subir Imágenes' : 'Agregar Más'}
                  </button>
                )}

                {imagenesPreview.length > 0 && (
                  <div className="images-preview">
                    {imagenesPreview.map((image, index) => (
                      <div key={image.id} className={`image-preview ${index === 0 ? 'primary' : ''}`}>
                        <img src={image.url} alt={`Preview ${index + 1}`} />
                        {index === 0 && <span className="primary-badge">Principal</span>}
                        <button type="button" className="remove-image" onClick={() => removeImage(image.id)}><FaTrash /></button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="upload-info"><FaImage /> JPG, PNG, GIF, WEBP. Max 5MB. ({imagenesPreview.length}/5)</p>
              </div>
            </div>

            <div className="form-group">
              <label>Etiquetas (opcional)</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} 
                placeholder="nuevo, original, garantía" disabled={auction?.numeroOfertas > 0} />
            </div>

            <div className="form-group">
              <label>Condiciones (opcional)</label>
              <textarea name="condiciones" value={formData.condiciones} onChange={handleInputChange} 
                placeholder="Términos especiales..." rows="3" maxLength="500" />
              <span className="char-count">{formData.condiciones.length}/500</span>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <><FaSpinner className="spinning" /> {auction ? 'Actualizando...' : 'Creando...'}</>
                ) : (
                  <><FaSave /> {auction ? 'Actualizar' : 'Crear Subasta'}</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateAuctionModal;

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaCamera, 
  FaPlus, 
  FaTimes, 
  FaCalendarAlt, 
  FaDollarSign,
  FaPercent,
  FaImage,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import productService from '../../services/productService';
import { registrarIntentoSubasta } from '../../services/analyticsService';
import Swal from 'sweetalert2';
import './CreateAuctionPage.css';

const CreateAuctionPage = () => {
  const navigate = useNavigate();
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
  
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef(null);

  const steps = [
    { number: 1, title: 'Información Básica', description: 'Título, descripción y categoría' },
    { number: 2, title: 'Imágenes', description: 'Sube fotos de tu producto' },
    { number: 3, title: 'Precios y Fechas', description: 'Configura precios y duración' },
    { number: 4, title: 'Configuración Final', description: 'Términos y publicación' }
  ];

  const localNowISO = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzOffset).toISOString().slice(0, 16);
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.titulo.trim()) newErrors.titulo = 'El título es requerido';
        if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida';
        if (formData.descripcion.length < 10) newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
        break;
      case 2:
        if (images.length === 0) newErrors.images = 'Debes subir al menos una imagen';
        break;
      case 3:
        if (!formData.precioInicial || formData.precioInicial <= 0) {
          newErrors.precioInicial = 'El precio inicial debe ser mayor a 0';
        }
        if (!formData.fechaInicio) newErrors.fechaInicio = 'La fecha de inicio es requerida';
        if (!formData.fechaFin) newErrors.fechaFin = 'La fecha de fin es requerida';
        if (formData.fechaInicio && formData.fechaFin && 
            new Date(formData.fechaFin) <= new Date(formData.fechaInicio)) {
          newErrors.fechaFin = 'La fecha de fin debe ser posterior a la de inicio';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImageFiles = [...imageFiles];
    const newImages = [...images];

    files.forEach(file => {
      if (file.type.startsWith('image/') && newImages.length < 5) {
        newImageFiles.push(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          newImages.push({
            id: Date.now() + Math.random(),
            url: event.target.result,
            file: file
          });
          setImages([...newImages]);
        };
        reader.readAsDataURL(file);
      }
    });

    setImageFiles(newImageFiles);
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    setImageFiles(prev => prev.filter((_, index) => 
      images.findIndex(img => img.id === imageId) !== index
    ));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setIsSubmitting(true);
      
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      imageFiles.forEach(file => {
        formDataToSend.append('imagenes', file);
      });

      const result = await productService.crearSubasta(formDataToSend);
      const creada = result?.data;
      const esActiva = creada?.estado === 'activo';
      
      // ✅ Registrar intento EXITOSO de crear subasta
      await registrarIntentoSubasta(
        creada?._id || 'nuevo',
        formData.titulo,
        formData.categoria,
        parseFloat(formData.precioInicial) || 0,
        true, // exitoso
        null
      );
      
      const mensaje = esActiva 
        ? 'Tu subasta ha sido publicada exitosamente'
        : 'Tu subasta fue creada como borrador y se activará automáticamente en la fecha y hora de inicio';

      Swal.fire({
        title: '¡Subasta Creada!',
        text: mensaje,
        icon: 'success',
        confirmButtonText: 'Ver Mis Subastas',
        confirmButtonColor: '#667eea'
      }).then(() => {
        // Reset form
        setFormData({
          titulo: '', descripcion: '', categoria: 'tecnologia',
          precioInicial: '', porcentajeMinimo: '5', fechaInicio: '',
          fechaFin: '', tipoSubasta: 'publica', condiciones: '', tags: ''
        });
        setImages([]);
        setImageFiles([]);
        setCurrentStep(1);
        setErrors({});
        // Ir a Mis Subastas para ver el nuevo registro
        navigate('/dashboard/my-auctions');
      });
      
    } catch (error) {
      // ❌ Registrar intento FALLIDO de crear subasta
      await registrarIntentoSubasta(
        null,
        formData.titulo,
        formData.categoria,
        parseFloat(formData.precioInicial) || 0,
        false, // no exitoso
        error.message || 'Error desconocido'
      );
      
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo crear la subasta',
        icon: 'error',
        confirmButtonColor: '#e53e3e'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="form-group">
              <label htmlFor="titulo">Título de la Subasta *</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                placeholder="Ej: iPhone 14 Pro Max 256GB Nuevo"
                className={errors.titulo ? 'error' : ''}
              />
              {errors.titulo && <span className="error-message">{errors.titulo}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="descripcion">Descripción *</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Describe detalladamente tu producto, estado, características especiales..."
                rows={4}
                className={errors.descripcion ? 'error' : ''}
              />
              <div className="char-counter">
                {formData.descripcion.length}/2000 caracteres
              </div>
              {errors.descripcion && <span className="error-message">{errors.descripcion}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="categoria">Categoría *</label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
              >
                {productService.categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="image-upload-section">
              <h3>Imágenes del Producto</h3>
              <p>Sube hasta 5 imágenes para mostrar tu producto (la primera será la imagen principal)</p>
              
              <div className="images-grid">
                {images.map((image, index) => (
                  <div key={image.id} className="image-preview">
                    <img src={image.url} alt={`Preview ${index + 1}`} />
                    <button 
                      type="button" 
                      className="remove-image"
                      onClick={() => removeImage(image.id)}
                    >
                      <FaTimes />
                    </button>
                    {index === 0 && <span className="main-image-badge">Principal</span>}
                  </div>
                ))}
                
                {images.length < 5 && (
                  <div 
                    className="upload-placeholder"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FaCamera />
                    <span>Agregar Imagen</span>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              
              {errors.images && <span className="error-message">{errors.images}</span>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="precioInicial">Precio Inicial *</label>
                <div className="input-with-icon">
                  <FaDollarSign />
                  <input
                    type="number"
                    id="precioInicial"
                    name="precioInicial"
                    value={formData.precioInicial}
                    onChange={handleInputChange}
                    placeholder="1000"
                    min="1"
                    className={errors.precioInicial ? 'error' : ''}
                  />
                </div>
                {errors.precioInicial && <span className="error-message">{errors.precioInicial}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="porcentajeMinimo">Incremento Mínimo *</label>
                <div className="input-with-icon">
                  <FaPercent />
                  <select
                    id="porcentajeMinimo"
                    name="porcentajeMinimo"
                    value={formData.porcentajeMinimo}
                    onChange={handleInputChange}
                  >
                    <option value="1">1% - Muy competitivo</option>
                    <option value="5">5% - Equilibrado</option>
                    <option value="10">10% - Conservador</option>
                    <option value="15">15% - Alto incremento</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fechaInicio">Fecha de Inicio *</label>
                <div className="input-with-icon">
                  <FaCalendarAlt />
                  <input
                    type="datetime-local"
                    id="fechaInicio"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleInputChange}
                    min={localNowISO()}
                    className={errors.fechaInicio ? 'error' : ''}
                  />
                </div>
                {errors.fechaInicio && <span className="error-message">{errors.fechaInicio}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="fechaFin">Fecha de Fin *</label>
                <div className="input-with-icon">
                  <FaCalendarAlt />
                  <input
                    type="datetime-local"
                    id="fechaFin"
                    name="fechaFin"
                    value={formData.fechaFin}
                    onChange={handleInputChange}
                    min={formData.fechaInicio || localNowISO()}
                    className={errors.fechaFin ? 'error' : ''}
                  />
                </div>
                {errors.fechaFin && <span className="error-message">{errors.fechaFin}</span>}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <div className="form-group">
              <label htmlFor="tipoSubasta">Tipo de Subasta</label>
              <select
                id="tipoSubasta"
                name="tipoSubasta"
                value={formData.tipoSubasta}
                onChange={handleInputChange}
              >
                <option value="publica">Pública - Todos pueden participar</option>
                <option value="privada">Privada - Solo usuarios invitados</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="condiciones">Condiciones Especiales</label>
              <textarea
                id="condiciones"
                name="condiciones"
                value={formData.condiciones}
                onChange={handleInputChange}
                placeholder="Términos de envío, garantías, condiciones de pago..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Etiquetas (separadas por comas)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="nuevo, smartphone, apple, 256gb"
              />
            </div>

            <div className="summary-section">
              <h3>Resumen de la Subasta</h3>
              <div className="summary-card">
                <div className="summary-item">
                  <strong>Título:</strong> {formData.titulo}
                </div>
                <div className="summary-item">
                  <strong>Categoría:</strong> {productService.categorias.find(c => c.value === formData.categoria)?.label}
                </div>
                <div className="summary-item">
                  <strong>Precio inicial:</strong> ${parseInt(formData.precioInicial || 0).toLocaleString()}
                </div>
                <div className="summary-item">
                  <strong>Incremento mínimo:</strong> {formData.porcentajeMinimo}%
                </div>
                <div className="summary-item">
                  <strong>Duración:</strong> {formData.fechaInicio && formData.fechaFin ? 
                    `${new Date(formData.fechaInicio).toLocaleDateString()} - ${new Date(formData.fechaFin).toLocaleDateString()}` : 
                    'No configurada'}
                </div>
                <div className="summary-item">
                  <strong>Imágenes:</strong> {images.length} subidas
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout currentPage="create">
      <div className="create-auction-page">
        <div className="page-header">
          <h1>Crear Nueva Subasta</h1>
          <p>Sigue los pasos para publicar tu producto en SubastaApp</p>
        </div>

        <div className="creation-wizard">
          <div className="steps-indicator">
            {steps.map((step) => (
              <div 
                key={step.number} 
                className={`step ${currentStep >= step.number ? 'completed' : ''} ${currentStep === step.number ? 'active' : ''}`}
              >
                <div className="step-number">
                  {currentStep > step.number ? <FaCheckCircle /> : step.number}
                </div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          <motion.div 
            className="step-content-container"
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>

          <div className="wizard-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Anterior
            </button>

            {currentStep < 4 ? (
              <button 
                type="button" 
                className="btn-primary"
                onClick={nextStep}
              >
                Siguiente
              </button>
            ) : (
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Publicando...' : 'Publicar Subasta'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateAuctionPage;

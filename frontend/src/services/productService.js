import API from './api';

const productService = {
  // Crear nueva subasta
  crearSubasta: async (formData) => {
    try {
      // Forzar el header Authorization manualmente para multipart/form-data
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No autorizado: falta el token');
      }
      const response = await API.post('/products', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error creando la subasta' };
    }
  },

  // Obtener todas las subastas
  obtenerSubastas: async (params = {}) => {
    try {
      const response = await API.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error obteniendo subastas' };
    }
  },

  // Obtener subasta por ID
  obtenerSubastaPorId: async (id) => {
    try {
      const response = await API.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error obteniendo la subasta' };
    }
  },

  // Obtener mis subastas (vendedor)
  obtenerMisSubastas: async (params = {}) => {
    try {
      const response = await API.get('/products/vendedor/mis-subastas', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error obteniendo mis subastas' };
    }
  },

  // Actualizar subasta
  actualizarSubasta: async (id, data) => {
    try {
      // Si data es FormData (tiene imágenes), usar headers apropiados
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Si es FormData, no establecer Content-Type manualmente
      if (!(data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await API.put(`/products/${id}`, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error actualizando la subasta' };
    }
  },

  // Eliminar subasta
  eliminarSubasta: async (id, forzar = false) => {
    try {
      const url = forzar ? `/products/${id}?forzar=true` : `/products/${id}`;
      const response = await API.delete(url);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data || { message: 'Error eliminando la subasta' };
      const err = new Error(data.message || 'Error eliminando la subasta');
      err.status = status;
      Object.assign(err, data);
      throw err;
    }
  },

  // Cambiar estado de subasta
  cambiarEstadoSubasta: async (id, estado) => {
    try {
      const response = await API.patch(`/products/${id}/estado`, { estado });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data || { message: 'Error cambiando el estado' };
      const err = new Error(data.message || 'Error cambiando el estado');
      err.status = status;
      Object.assign(err, data);
      throw err;
    }
  },

  // Crear oferta
  crearOferta: async (productId, ofertaData) => {
    try {
      const response = await API.post(`/bids/products/${productId}/ofertas`, ofertaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error realizando la oferta' };
    }
  },

  // Obtener ofertas de un producto
  obtenerOfertasProducto: async (productId, params = {}) => {
    try {
      const response = await API.get(`/bids/products/${productId}/ofertas`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error obteniendo ofertas' };
    }
  },

  // Obtener mis ofertas (comprador)
  obtenerMisOfertas: async (params = {}) => {
    try {
      const response = await API.get('/bids/mis-ofertas', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error obteniendo mis ofertas' };
    }
  },

  // Retirar oferta
  retirarOferta: async (bidId) => {
    try {
      const response = await API.delete(`/bids/${bidId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error retirando la oferta' };
    }
  },

  // Pagar oferta ganadora
  pagarOfertaGanadora: async (bidId, paymentData) => {
    try {
      const response = await API.patch(`/bids/${bidId}/pagar`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error procesando el pago' };
    }
  },

  // Obtener historial de ofertas (vendedor)
  obtenerHistorialOfertas: async (productId) => {
    try {
      const response = await API.get(`/bids/products/${productId}/historial-ofertas`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error obteniendo historial' };
    }
  },

  // Utilidades
  calcularTiempoRestante: (fechaFin) => {
    const ahora = new Date();
    const fin = new Date(fechaFin);
    const diferencia = fin - ahora;

    if (diferencia <= 0) return null;

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    return { dias, horas, minutos, segundos, total: diferencia };
  },

  formatearMoneda: (monto, opts = {}) => {
    if (typeof monto !== 'number' || isNaN(monto)) {
      return 'Sin ofertas';
    }
    // Leer preferencias del usuario si existen
    let currency = opts.currency;
    let locale = opts.locale;
    try {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const key = user?._id ? `prefs_${user._id}` : null;
      if (!currency || !locale) {
        if (key) {
          const prefsRaw = localStorage.getItem(key);
          if (prefsRaw) {
            const prefs = JSON.parse(prefsRaw);
            currency = currency || prefs.currency;
            locale = locale || (prefs.language === 'en' ? 'en-US' : 'es-CO');
          }
        }
      }
    } catch {}
    const finalCurrency = currency || 'COP';
    const finalLocale = locale || 'es-CO';
    return new Intl.NumberFormat(finalLocale, {
      style: 'currency',
      currency: finalCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  },

  formatearTiempo: (tiempo) => {
    if (!tiempo) return 'Finalizada';

    const { dias, horas, minutos } = tiempo;

    if (dias > 0) return `${dias}d ${horas}h`;
    if (horas > 0) return `${horas}h ${minutos}m`;
    return `${minutos}m`;
  },

  // Categorías disponibles
  categorias: [
    { value: 'tecnologia', label: 'Tecnología', icon: '📱' },
    { value: 'moda', label: 'Moda', icon: '👔' },
    { value: 'hogar', label: 'Hogar', icon: '🏠' },
    { value: 'deportes', label: 'Deportes', icon: '⚽' },
    { value: 'arte', label: 'Arte', icon: '🎨' },
    { value: 'vehiculos', label: 'Vehículos', icon: '🚗' },
    { value: 'otros', label: 'Otros', icon: '📦' }
  ],

  // Estados de subasta
  estadosSubasta: [
    { value: 'borrador', label: 'Borrador', color: '#718096' },
    { value: 'activo', label: 'Activa', color: '#38a169' },
    { value: 'pausado', label: 'Pausada', color: '#ed8936' },
    { value: 'finalizado', label: 'Finalizada', color: '#3182ce' },
    { value: 'cancelado', label: 'Cancelada', color: '#e53e3e' }
  ]
};

export default productService;

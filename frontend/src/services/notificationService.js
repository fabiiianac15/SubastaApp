import API from './api';

const notificationService = {
  // Obtener notificaciones del usuario
  obtenerNotificaciones: async (params = {}) => {
    try {
      const response = await API.get('/notifications', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error obteniendo notificaciones' };
    }
  },

  // Marcar notificación como leída
  marcarComoLeida: async (notificationId) => {
    try {
      const response = await API.patch(`/notifications/${notificationId}/leer`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error marcando notificación' };
    }
  },

  // Marcar todas como leídas
  marcarTodasComoLeidas: async () => {
    try {
      const response = await API.patch('/notifications/leer-todas');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error marcando notificaciones' };
    }
  },

  // Eliminar notificación
  eliminarNotificacion: async (notificationId) => {
    try {
      const response = await API.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error eliminando notificación' };
    }
  },

  // Obtener contador de no leídas
  obtenerContadorNoLeidas: async () => {
    try {
      const response = await API.get('/notifications/contador');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error obteniendo contador' };
    }
  },

  // Formatear tiempo relativo
  formatearTiempoRelativo: (fecha) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diferencia = ahora - fechaNotif;

    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 7) {
      return fechaNotif.toLocaleDateString('es-CO', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
    if (dias > 0) return `Hace ${dias}d`;
    if (horas > 0) return `Hace ${horas}h`;
    if (minutos > 0) return `Hace ${minutos}m`;
    return 'Ahora';
  },

  // Obtener icono según tipo de notificación
  obtenerIconoNotificacion: (tipo) => {
    const iconos = {
      'puja_superada': '🔔',
      'puja_ganadora': '🏆',
      'subasta_finalizada': '⏰',
      'nueva_puja': '💰',
      'subasta_cancelada': '❌',
      'recordatorio_pago': '💳',
      'pago_recibido': '✅',
      'mensaje_vendedor': '💬',
      'favorito_pronto': '⭐',
      'favorito_activo': '🔥'
    };
    return iconos[tipo] || '📌';
  },

  // Obtener color según tipo
  obtenerColorNotificacion: (tipo) => {
    const colores = {
      'puja_superada': '#ed8936',
      'puja_ganadora': '#ffd700',
      'subasta_finalizada': '#3182ce',
      'nueva_puja': '#10b981',
      'subasta_cancelada': '#e53e3e',
      'recordatorio_pago': '#805ad5',
      'pago_recibido': '#38a169',
      'mensaje_vendedor': '#4299e1',
      'favorito_pronto': '#ecc94b',
      'favorito_activo': '#f56565'
    };
    return colores[tipo] || '#718096';
  }
};

export default notificationService;

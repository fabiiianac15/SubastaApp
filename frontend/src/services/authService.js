import API from './api';

const authService = {
  // Registrar usuario
  register: async (userData) => {
    try {
      const response = await API.post('/auth/register', userData);
      
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error en el registro' };
    }
  },

  // Iniciar sesión
  login: async (credentials) => {
    try {
      const response = await API.post('/auth/login', credentials);
      
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error en el login' };
    }
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Obtener perfil
  getProfile: async () => {
    try {
      const response = await API.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error obteniendo perfil' };
    }
  },

  // Actualizar perfil
  updateProfile: async (userData) => {
    try {
      const response = await API.put('/auth/profile', userData);
      
      if (response.data.success) {
        // Actualizar usuario en localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = {
          ...currentUser,
          ...response.data.data
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error actualizando perfil' };
    }
  },

  // Cambiar contraseña
  changePassword: async (passwords) => {
    try {
      const response = await API.put('/auth/change-password', passwords);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error cambiando contraseña' };
    }
  },

  // Eliminar cuenta
  deleteAccount: async (password) => {
    try {
      const response = await API.delete('/auth/profile', {
        data: { password }
      });
      
      if (response.data.success) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error eliminando cuenta' };
    }
  },

  // Verificar si está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default authService;

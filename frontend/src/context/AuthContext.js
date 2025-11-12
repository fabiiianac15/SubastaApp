import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';
import { 
  iniciarSesionTracking, 
  finalizarSesion, 
  iniciarHeartbeat,
  configurarVisibilityTracking 
} from '../services/analyticsService';

// Estado inicial
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Tipos de acciones
const ActionTypes = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN_START:
    case ActionTypes.REGISTER_START:
      return {
        ...state,
        loading: true,
        error: null
      };

    case ActionTypes.LOGIN_SUCCESS:
    case ActionTypes.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };

    case ActionTypes.LOGIN_FAILURE:
    case ActionTypes.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };

    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };

    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    default:
      return state;
  }
};

// Crear contextos
const AuthContext = createContext();
const AuthDispatchContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = () => {
      const user = authService.getCurrentUser();
      if (user && authService.isAuthenticated()) {
        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: user
        });
        
        // Iniciar tracking si usuario ya está autenticado
        iniciarSesionTracking().then(() => {
          iniciarHeartbeat();
        });
      } else {
        dispatch({
          type: ActionTypes.SET_LOADING,
          payload: false
        });
      }
    };

    checkAuth();
    
    // Configurar tracking de visibilidad de página
    configurarVisibilityTracking();
  }, []);

  const actions = {
    login: async (credentials) => {
      dispatch({ type: ActionTypes.LOGIN_START });
      try {
        const response = await authService.login(credentials);
        // authService.login devuelve response.data (envoltura) y ya guarda user en localStorage.
        // Aquí aseguramos que el estado tenga el objeto de usuario interno (response.data.data)
        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: response.data?.data || response.data
        });
        
        // Iniciar tracking de analytics con heartbeat
        await iniciarSesionTracking();
        iniciarHeartbeat();
        
        return response;
      } catch (error) {
        dispatch({
          type: ActionTypes.LOGIN_FAILURE,
          payload: error.message || 'Error en el login'
        });
        throw error;
      }
    },

    register: async (userData) => {
      dispatch({ type: ActionTypes.REGISTER_START });
      try {
        const response = await authService.register(userData);
        dispatch({
          type: ActionTypes.REGISTER_SUCCESS,
          payload: response.data?.data || response.data
        });
        return response;
      } catch (error) {
        dispatch({
          type: ActionTypes.REGISTER_FAILURE,
          payload: error.message || 'Error en el registro'
        });
        throw error;
      }
    },

    logout: () => {
      // Finalizar sesión de analytics
      finalizarSesion();
      
      authService.logout();
      dispatch({ type: ActionTypes.LOGOUT });
    },

    updateUser: (userData) => {
      dispatch({ 
        type: ActionTypes.UPDATE_USER, 
        payload: userData 
      });
    },

    clearError: () => {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
    }
  };

  return (
    <AuthContext.Provider value={state}>
      <AuthDispatchContext.Provider value={actions}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthContext.Provider>
  );
};

// Hooks personalizados
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const useAuthActions = () => {
  const context = useContext(AuthDispatchContext);
  if (!context) {
    throw new Error('useAuthActions debe ser usado dentro de un AuthProvider');
  }
  return context;
};

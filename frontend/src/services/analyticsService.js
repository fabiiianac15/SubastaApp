// ============================================================================
// 📸 PUNTO 2: SERVICIO FRONTEND DE ANALYTICS - CAPTURA AUTOMÁTICA
// ============================================================================
// Este servicio se ejecuta automáticamente en el frontend para capturar:
// 1. ✅ Ubicación del usuario (HTML5 Geolocation API)
// 2. ✅ Tiempo en página (heartbeat cada 30 segundos)
// 3. ✅ Clicks en categorías
// 4. ✅ Hora de ingreso (al hacer login)
// 5. ✅ Intentos de crear subastas
// ============================================================================

import api from './api';

let currentSessionId = null;
let sessionStartTime = null;
let heartbeatInterval = null;

// ============================================================================
// FUNCIÓN AUXILIAR: Obtener Ubicación del Navegador
// ============================================================================
// Solicita permisos al usuario para acceder a su ubicación GPS
// Usa HTML5 Geolocation API para obtener coordenadas precisas
// Si el usuario rechaza o no está disponible, retorna null y usa IP como fallback
// ============================================================================
const obtenerUbicacionNavegador = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          precision: position.coords.accuracy,
          zona_horaria: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      },
      (error) => {
        console.log('⚠️ No se pudo obtener ubicación del navegador:', error.message);
        resolve(null);
      },
      {
        timeout: 5000,
        maximumAge: 0,
        enableHighAccuracy: false
      }
    );
  });
};

// ============================================================================
// FRONTEND - FUNCIÓN 1: Iniciar Sesión de Tracking
// ============================================================================
// Se ejecuta automáticamente cuando el usuario hace LOGIN
// Captura:
// - ✅ UBICACIÓN: Solicita geolocalización del navegador (lat/lng precisas)
// - ✅ HORA DE INGRESO: El backend registra automáticamente día/mes/año
// - Envía los datos al endpoint /api/analytics/session/start
// - Guarda el sessionId para usar en los siguientes registros
// ============================================================================
export const iniciarSesionTracking = async () => {
  try {
    sessionStartTime = Date.now();
    const ubicacionNavegador = await obtenerUbicacionNavegador();
    
    const response = await api.post('/analytics/session/start', {
      ubicacionNavegador
    });

    if (response.data.success) {
      currentSessionId = response.data.data.sessionId;
      console.log('📍 Sesión de tracking iniciada:', currentSessionId);
      if (ubicacionNavegador) {
        console.log('📍 Ubicación capturada:', ubicacionNavegador);
      }
      return currentSessionId;
    }
  } catch (error) {
    console.error('❌ Error iniciando sesión de tracking:', error);
  }
};

// ============================================================================
// FRONTEND - FUNCIÓN 2: Heartbeat (Actualización Automática de Tiempo)
// ============================================================================
// Se ejecuta automáticamente cada 30 SEGUNDOS mientras el usuario está activo
// Actualiza:
// - ✅ TIEMPO EN PÁGINA: Incrementa duracionSegundos en MongoDB
// - Solo se ejecuta si la pestaña está visible (document.hidden = false)
// - Pausa automáticamente cuando el usuario cambia de pestaña
// - Llama al endpoint PUT /api/analytics/session/:sessionId/tiempo
// ============================================================================
export const iniciarHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(async () => {
    if (currentSessionId && !document.hidden) {
      try {
        await api.put(`/analytics/session/${currentSessionId}/tiempo`);
        console.log('💓 Heartbeat - Tiempo actualizado');
      } catch (error) {
        console.error('❌ Error en heartbeat:', error);
      }
    }
  }, 30000);

  console.log('💓 Heartbeat iniciado');
};

export const detenerHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('💓 Heartbeat detenido');
  }
};

// ============================================================================
// FRONTEND - FUNCIÓN 3: Registrar Click en Categoría
// ============================================================================
// Se ejecuta cuando el usuario hace CLICK en un filtro de categoría
// Por ejemplo: tecnología, moda, hogar, deportes, arte, vehículos
// Registra:
// - ✅ CATEGORÍA CLICKEADA: El nombre de la categoría
// - El backend automáticamente agrega timestamp completo (día/mes/año/hora)
// - Llama al endpoint POST /api/analytics/session/:sessionId/categoria
// ============================================================================
export const registrarClickCategoria = async (categoria) => {
  if (!currentSessionId) {
    console.warn('⚠️ No hay sesión activa para registrar click');
    return;
  }

  try {
    console.log('📂 Registrando click en categoría:', categoria);
    
    await api.post(`/analytics/session/${currentSessionId}/categoria`, {
      categoria
    });
    
    console.log('✅ Click en categoría registrado');
  } catch (error) {
    console.error('❌ Error registrando click en categoría:', error);
  }
};

// ============================================================================
// FRONTEND - FUNCIÓN 4: Registrar Intento de Crear Subasta
// ============================================================================
// Se ejecuta cuando el usuario intenta CREAR UNA SUBASTA
// Registra:
// - ✅ INTENTO DE SUBASTA: exitoso=true si se creó, false si falló
// - ID del producto, título del producto, categoría, precio inicial
// - razonFallo: mensaje de error si falló (ej: "Debes subir al menos una imagen")
// - El backend automáticamente agrega timestamp completo
// - Llama al endpoint POST /api/analytics/intento-subasta
// ============================================================================
export const registrarIntentoSubasta = async (productoId, tituloProducto, categoria, precioInicial, exitoso, razonFallo = null) => {
  if (!currentSessionId) {
    console.warn('⚠️ No hay sesión activa para registrar intento de subasta');
    return;
  }

  try {
    console.log('🎯 Registrando intento de subasta:', { 
      productoId, 
      tituloProducto,
      categoria, 
      precioInicial,
      exitoso, 
      razonFallo 
    });
    
    await api.post('/analytics/intento-subasta', {
      sessionId: currentSessionId,
      productoId,
      tituloProducto,
      categoria,
      precioInicial,
      exitoso,
      razonFallo
    });
    
    console.log('✅ Intento de subasta registrado correctamente');
  } catch (error) {
    console.error('❌ Error registrando intento de subasta:', error);
  }
};

// Obtener resumen de actividad
export const obtenerResumen = async () => {
  try {
    const response = await api.get('/analytics/resumen');
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo resumen:', error);
    return null;
  }
};

// Configurar visibility tracking
export const configurarVisibilityTracking = () => {
  if (typeof document === 'undefined') return;

  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
      console.log('👁️ Página oculta - pausando heartbeat');
      detenerHeartbeat();
      
      if (currentSessionId) {
        try {
          await api.put(`/analytics/session/${currentSessionId}/tiempo`);
        } catch (error) {
          console.error('Error actualizando tiempo:', error);
        }
      }
    } else {
      console.log('��️ Página visible - reanudando heartbeat');
      iniciarHeartbeat();
    }
  });

  console.log('👁️ Visibility tracking configurado');
};

// Finalizar sesión
export const finalizarSesion = async () => {
  detenerHeartbeat();
  
  if (currentSessionId) {
    try {
      await api.put(`/analytics/session/${currentSessionId}/tiempo`);
      console.log('✅ Sesión finalizada');
    } catch (error) {
      console.error('Error finalizando sesión:', error);
    }
  }
  
  currentSessionId = null;
  sessionStartTime = null;
};

export default {
  iniciarSesionTracking,
  iniciarHeartbeat,
  detenerHeartbeat,
  registrarClickCategoria,
  registrarIntentoSubasta,
  obtenerResumen,
  configurarVisibilityTracking,
  finalizarSesion
};

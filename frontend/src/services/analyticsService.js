import api from './api';

let currentSessionId = null;
let sessionStartTime = null;
let sectionStartTime = null;
let currentSection = null;
let isInitializing = false; // Bandera para evitar múltiples inicializaciones simultáneas

// Función helper para asegurar que hay sesión activa
const ensureSession = async () => {
  // Si ya hay sesión, retornar true
  if (currentSessionId) {
    return true;
  }
  
  // Si ya se está inicializando, esperar
  if (isInitializing) {
    console.log('⏳ Esperando inicialización de sesión...');
    // Esperar hasta 3 segundos
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (currentSessionId) {
        console.log('✅ Sesión establecida después de esperar');
        return true;
      }
    }
    console.error('❌ Timeout esperando sesión');
    return false;
  }
  
  // Intentar iniciar sesión
  console.log('🔄 Iniciando nueva sesión de tracking...');
  isInitializing = true;
  
  try {
    await iniciarSesionTracking();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (currentSessionId) {
      console.log('✅ Sesión iniciada exitosamente:', currentSessionId);
      isInitializing = false;
      return true;
    } else {
      console.error('❌ No se pudo establecer sessionId');
      isInitializing = false;
      return false;
    }
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error);
    isInitializing = false;
    return false;
  }
};

// Detectar tipo de dispositivo
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Obtener ubicación del navegador
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
        console.log('No se pudo obtener ubicación del navegador:', error.message);
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

// Iniciar sesión de tracking
export const iniciarSesionTracking = async () => {
  try {
    sessionStartTime = Date.now();
    
    // Intentar obtener ubicación del navegador
    const ubicacionNavegador = await obtenerUbicacionNavegador();
    
    const response = await api.post('/analytics/session/start', {
      userAgent: navigator.userAgent,
      dispositivo: getDeviceType(),
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
    console.error('Error iniciando sesión de tracking:', error);
  }
};

// Actualizar sesión
const actualizarSesionTracking = async (data) => {
  // Asegurar que hay sesión activa
  const hasSession = await ensureSession();
  
  if (!hasSession) {
    console.error('❌ No se pudo establecer sesión de tracking. Datos no enviados:', data);
    return;
  }

  try {
    console.log('📤 Actualizando sesión:', currentSessionId, data);
    const response = await api.put(`/analytics/session/${currentSessionId}`, data);
    console.log('✅ Sesión actualizada correctamente:', response.data);
  } catch (error) {
    console.error('❌ Error actualizando sesión:', error);
    console.error('Detalles:', error.response?.data || error.message);
  }
};

// Registrar click
export const registrarClick = async (tipo, elemento, elementoId = null) => {
  console.log('🖱️ [CLICK]', { tipo, elemento, elementoId });
  
  const tiempoEnPagina = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
  
  await actualizarSesionTracking({
    clicks: [{
      tipo,
      elemento,
      elementoId,
      tiempoEnPagina
    }]
  });
};

// Registrar vista de categoría
export const registrarVistaCategoria = async (categoria) => {
  console.log('📂 [CATEGORIA]', categoria);
  
  await actualizarSesionTracking({
    categoria
  });
};

// Registrar producto visto
export const registrarProductoVisto = async (productoId, categoria, tiempoViendo = 0) => {
  console.log('👁️ [PRODUCTO VISTO]', { productoId, categoria, tiempoViendo });
  
  await actualizarSesionTracking({
    productoVisto: {
      productoId,
      categoria,
      tiempoViendo
    }
  });
};

// Registrar búsqueda
export const registrarBusqueda = async (termino, categoria = null, resultados = 0) => {
  console.log('🔍 [BUSQUEDA]', { termino, categoria, resultados });
  
  await actualizarSesionTracking({
    busqueda: {
      termino,
      categoria,
      resultados
    }
  });
};

// Iniciar tracking de sección
export const iniciarSeccion = (nombreSeccion) => {
  // Si hay sección previa, guardar su tiempo
  if (currentSection && sectionStartTime) {
    const tiempoSegundos = Math.floor((Date.now() - sectionStartTime) / 1000);
    actualizarSesionTracking({
      seccion: currentSection,
      tiempoSeccion: tiempoSegundos
    });
  }

  currentSection = nombreSeccion;
  sectionStartTime = Date.now();
};

// Finalizar tracking de sección
export const finalizarSeccion = async () => {
  if (currentSection && sectionStartTime) {
    const tiempoSegundos = Math.floor((Date.now() - sectionStartTime) / 1000);
    await actualizarSesionTracking({
      seccion: currentSection,
      tiempoSeccion: tiempoSegundos
    });
    
    currentSection = null;
    sectionStartTime = null;
  }
};

// Registrar intento de subasta
export const registrarIntentoSubasta = async (productoId, categoria, monto, exitoso, razonFallo = null) => {
  console.log('🎯 [INTENTO SUBASTA]', { productoId, categoria, monto, exitoso, razonFallo });
  
  // Asegurar que hay sesión activa
  const hasSession = await ensureSession();
  
  if (!hasSession) {
    console.error('❌ No se pudo registrar intento de subasta - Sin sesión');
    return;
  }

  try {
    console.log('📊 Registrando intento de subasta:', { 
      sessionId: currentSessionId,
      productoId, 
      categoria, 
      monto, 
      exitoso, 
      razonFallo 
    });
    
    await api.post('/analytics/bid-attempt', {
      sessionId: currentSessionId,
      productoId,
      categoria,
      monto,
      exitoso,
      razonFallo
    });
    
    console.log('✅ Intento de subasta registrado correctamente');
  } catch (error) {
    console.error('❌ Error registrando intento de subasta:', error);
    console.error('Detalles del error:', error.response?.data || error.message);
  }
};

// Obtener recomendaciones personalizadas
export const obtenerRecomendaciones = async () => {
  try {
    const response = await api.get('/analytics/recommendations');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo recomendaciones:', error);
    return { success: false, data: { recomendaciones: [] } };
  }
};

// Obtener estadísticas del usuario
export const obtenerEstadisticas = async () => {
  try {
    const response = await api.get('/analytics/stats');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
};

// Finalizar sesión (llamar al cerrar la app o logout)
export const finalizarSesion = async () => {
  await finalizarSeccion();
  currentSessionId = null;
  sessionStartTime = null;
};

export default {
  iniciarSesionTracking,
  registrarClick,
  registrarVistaCategoria,
  registrarProductoVisto,
  registrarBusqueda,
  iniciarSeccion,
  finalizarSeccion,
  registrarIntentoSubasta,
  obtenerRecomendaciones,
  obtenerEstadisticas,
  finalizarSesion
};

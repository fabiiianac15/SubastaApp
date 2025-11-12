// ============================================================================
// 📸 PUNTO 2: CONTROLADOR DE ANALYTICS - CAPTURA DE LOS 5 REQUISITOS
// ============================================================================
// Este controlador implementa las funciones para registrar:
// 1. ✅ Ubicación (geoip-lite + HTML5 Geolocation)
// 2. ✅ Tiempo en página (heartbeat cada 30 segundos)
// 3. ✅ Clicks en categorías
// 4. ✅ Hora de ingreso (automático al iniciar sesión)
// 5. ✅ Intentos de subastar producto
// ============================================================================

const UserActivity = require('../models/UserActivity');
const geoip = require('geoip-lite');

// ============================================================================
// FUNCIÓN 1: Iniciar Sesión de Tracking
// ============================================================================
// Esta función se ejecuta cuando el usuario hace LOGIN
// Captura automáticamente:
// - ✅ UBICACIÓN: Usa geoip-lite (IP) como fallback y HTML5 Geolocation del navegador
// - ✅ HORA DE INGRESO: Timestamp completo con día, mes, año, hora, minuto, segundo
// - ✅ TIEMPO INICIAL: Marca horaInicio para empezar a contar duración
// ============================================================================
const iniciarSesion = async (req, res) => {
  try {
    const { ubicacionNavegador } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    
    let ubicacion = null;
    
    if (ubicacionNavegador && ubicacionNavegador.latitud && ubicacionNavegador.longitud) {
      ubicacion = {
        pais: ubicacionNavegador.pais || (geo ? geo.country : 'Desconocido'),
        ciudad: ubicacionNavegador.ciudad || (geo ? geo.city : 'Desconocida'),
        region: ubicacionNavegador.region || (geo ? geo.region : null),
        latitud: ubicacionNavegador.latitud,
        longitud: ubicacionNavegador.longitud,
        zona_horaria: ubicacionNavegador.zona_horaria || (geo ? geo.timezone : null),
        proveedor: 'navegador'
      };
    } else if (geo) {
      ubicacion = {
        pais: geo.country,
        ciudad: geo.city || 'Desconocida',
        region: geo.region,
        latitud: geo.ll[0],
        longitud: geo.ll[1],
        zona_horaria: geo.timezone,
        proveedor: 'geoip-lite'
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'No se pudo determinar la ubicación del usuario'
      });
    }
    
    const activity = await UserActivity.create({
      usuario: req.user._id,
      ubicacion,
      tiempoEnPagina: {
        horaInicio: new Date()
      },
      horaIngreso: UserActivity.crearHoraIngreso()
    });

    console.log('📍 Sesión iniciada:', activity._id);

    res.status(201).json({
      success: true,
      data: {
        sessionId: activity._id
      }
    });
  } catch (error) {
    console.error('❌ Error iniciando sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// ============================================================================
// FUNCIÓN 2: Actualizar Tiempo en Página (Heartbeat)
// ============================================================================
// Esta función se ejecuta automáticamente cada 30 segundos desde el frontend
// Actualiza:
// - ✅ TIEMPO EN PÁGINA: Incrementa duracionSegundos
// - Actualiza horaFin al momento actual
// - Calcula duración total en segundos desde horaInicio
// Se pausa cuando el usuario cambia de pestaña (Visibility API)
// ============================================================================
const actualizarTiempo = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const activity = await UserActivity.findById(sessionId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    activity.actualizarTiempoEnPagina();
    await activity.save();

    console.log('⏱️  Tiempo actualizado:', activity.tiempoEnPagina.duracionSegundos, 'seg');

    res.json({
      success: true,
      data: {
        duracionSegundos: activity.tiempoEnPagina.duracionSegundos
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando tiempo:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// ============================================================================
// FUNCIÓN 3: Registrar Click en Categoría
// ============================================================================
// Esta función se ejecuta cuando el usuario hace CLICK en un filtro de categoría
// Registra:
// - ✅ CATEGORÍA CLICKEADA: tecnología, moda, hogar, deportes, arte, vehículos, otros
// - Timestamp completo: segundo, minuto, hora, día, mes, año, día de la semana
// - Permite analizar qué categorías interesan más al usuario
// ============================================================================
const registrarClickCategoria = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { categoria } = req.body;

    if (!categoria) {
      return res.status(400).json({
        success: false,
        message: 'La categoría es requerida'
      });
    }

    const activity = await UserActivity.findById(sessionId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    activity.agregarClickCategoria(categoria);
    await activity.save();

    console.log('📂 Click en categoría:', categoria);

    res.json({
      success: true,
      message: `Click en categoría '${categoria}' registrado`,
      data: {
        totalClicks: activity.categoriasClicks.length
      }
    });
  } catch (error) {
    console.error('❌ Error registrando click:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// ============================================================================
// FUNCIÓN 4: Registrar Intento de Subastar Producto
// ============================================================================
// Esta función se ejecuta cuando el usuario intenta CREAR UNA SUBASTA
// Registra:
// - ✅ INTENTO DE SUBASTA: exitoso=true si se creó, false si falló
// - ID del producto, título, categoría, precio inicial
// - razonFallo: mensaje de error si no se pudo crear (ej: falta imagen)
// - Timestamp completo del intento
// Permite analizar cuántos intentos tiene el usuario y tasa de éxito
// ============================================================================
const registrarIntentoSubasta = async (req, res) => {
  try {
    const { sessionId, productoId, tituloProducto, categoria, precioInicial, exitoso, razonFallo } = req.body;

    const activity = await UserActivity.findById(sessionId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    activity.agregarIntentoSubasta(productoId, tituloProducto, categoria, precioInicial, exitoso, razonFallo);
    await activity.save();

    console.log('🎯 Intento de subasta registrado');

    res.json({
      success: true,
      message: 'Intento de subasta registrado correctamente',
      data: {
        totalIntentos: activity.intentosSubasta.length
      }
    });
  } catch (error) {
    console.error('❌ Error registrando intento:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// Obtener resumen
const obtenerResumen = async (req, res) => {
  try {
    const userId = req.user._id;
    const actividades = await UserActivity.find({ usuario: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    if (!actividades || actividades.length === 0) {
      return res.json({
        success: true,
        data: {
          totalSesiones: 0,
          tiempoTotalSegundos: 0,
          categoriasClickeadas: {},
          intentosSubasta: {
            total: 0,
            exitosos: 0,
            fallidos: 0
          }
        }
      });
    }

    const tiempoTotal = actividades.reduce((sum, act) => sum + (act.tiempoEnPagina.duracionSegundos || 0), 0);
    const categoriasMap = {};
    actividades.forEach(act => {
      act.categoriasClicks?.forEach(cc => {
        categoriasMap[cc.categoria] = (categoriasMap[cc.categoria] || 0) + 1;
      });
    });

    let totalIntentos = 0;
    let exitosos = 0;
    actividades.forEach(act => {
      act.intentosSubasta?.forEach(intento => {
        totalIntentos++;
        if (intento.exitoso) exitosos++;
      });
    });

    res.json({
      success: true,
      data: {
        totalSesiones: actividades.length,
        tiempoTotalSegundos: tiempoTotal,
        tiempoPromedioSegundos: actividades.length > 0 ? Math.round(tiempoTotal / actividades.length) : 0,
        categoriasClickeadas: categoriasMap,
        intentosSubasta: {
          total: totalIntentos,
          exitosos,
          fallidos: totalIntentos - exitosos,
          tasaExito: totalIntentos > 0 ? ((exitosos / totalIntentos) * 100).toFixed(2) + '%' : '0%'
        },
        ultimaUbicacion: actividades[0]?.ubicacion || null
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// Obtener reporte completo
const obtenerReporteCompleto = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, userId } = req.query;
    let filtro = {};
    
    if (userId) filtro.usuario = userId;
    if (fechaInicio || fechaFin) {
      filtro['horaIngreso.fechaCompleta'] = {};
      if (fechaInicio) filtro['horaIngreso.fechaCompleta'].$gte = new Date(fechaInicio);
      if (fechaFin) filtro['horaIngreso.fechaCompleta'].$lte = new Date(fechaFin);
    }

    const actividades = await UserActivity.find(filtro)
      .populate('usuario', 'nombre apellido email')
      .sort({ 'horaIngreso.fechaCompleta': -1 });

    const reporte = {
      totalSesiones: actividades.length,
      usuariosUnicos: new Set(actividades.map(a => a.usuario?._id.toString())).size,
      categoriasPopulares: {},
      horasPico: {},
      diasSemanaActivos: {},
      ubicaciones: {},
      intentosSubasta: { total: 0, exitosos: 0, fallidos: 0 }
    };

    let tiempoTotal = 0;
    let intentosExitosos = 0;
    let intentosTotales = 0;

    actividades.forEach(act => {
      tiempoTotal += act.tiempoEnPagina.duracionSegundos || 0;

      act.categoriasClicks?.forEach(cc => {
        reporte.categoriasPopulares[cc.categoria] = (reporte.categoriasPopulares[cc.categoria] || 0) + 1;
        const hora = cc.horaCompleta?.hora;
        if (hora !== undefined) {
          reporte.horasPico[hora] = (reporte.horasPico[hora] || 0) + 1;
        }
        const dia = cc.horaCompleta?.diaSemana;
        if (dia) {
          reporte.diasSemanaActivos[dia] = (reporte.diasSemanaActivos[dia] || 0) + 1;
        }
      });

      if (act.ubicacion?.pais) {
        const ubicacionKey = `${act.ubicacion.ciudad}, ${act.ubicacion.pais}`;
        reporte.ubicaciones[ubicacionKey] = (reporte.ubicaciones[ubicacionKey] || 0) + 1;
      }

      act.intentosSubasta?.forEach(intento => {
        intentosTotales++;
        if (intento.exitoso) intentosExitosos++;
      });
    });

    reporte.tiempoPromedioSesion = actividades.length > 0 ? Math.round(tiempoTotal / actividades.length) : 0;
    reporte.intentosSubasta = {
      total: intentosTotales,
      exitosos: intentosExitosos,
      fallidos: intentosTotales - intentosExitosos,
      tasaExito: intentosTotales > 0 ? ((intentosExitosos / intentosTotales) * 100).toFixed(2) + '%' : '0%'
    };

    res.json({
      success: true,
      data: reporte
    });
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

module.exports = {
  iniciarSesion,
  actualizarTiempo,
  registrarClickCategoria,
  registrarIntentoSubasta,
  obtenerResumen,
  obtenerReporteCompleto
};

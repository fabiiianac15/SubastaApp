const UserActivity = require('../models/UserActivity');
const Product = require('../models/Product');
const geoip = require('geoip-lite');

// @desc    Iniciar sesión de tracking
// @route   POST /api/analytics/session/start
// @access  Private
const iniciarSesion = async (req, res) => {
  try {
    const { userAgent, dispositivo, ubicacionNavegador } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    // Obtener geolocalización desde IP como respaldo
    const geo = geoip.lookup(ip);
    
    // Usar ubicación del navegador si está disponible, si no usar IP
    let ubicacion = null;
    
    if (ubicacionNavegador && ubicacionNavegador.latitud && ubicacionNavegador.longitud) {
      // Usar geolocalización precisa del navegador
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
      // Fallback a IP
      ubicacion = {
        pais: geo.country,
        ciudad: geo.city || 'Desconocida',
        region: geo.region,
        latitud: geo.ll[0],
        longitud: geo.ll[1],
        zona_horaria: geo.timezone,
        proveedor: 'geoip-lite'
      };
    }
    
    const activity = await UserActivity.create({
      usuario: req.user._id,
      sesion: {
        horaInicio: new Date(),
        ip,
        userAgent,
        dispositivo
      },
      ubicacion
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId: activity._id
      }
    });
  } catch (error) {
    console.error('Error iniciando sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Actualizar sesión (tiempo, clicks, etc)
// @route   PUT /api/analytics/session/:sessionId
// @access  Private
const actualizarSesion = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { 
      clicks, 
      categoria, 
      productoVisto, 
      busqueda, 
      seccion, 
      tiempoSeccion 
    } = req.body;

    console.log('📥 [ANALYTICS] Actualizar sesión:', {
      sessionId,
      userId: req.user?._id,
      datos: { clicks, categoria, productoVisto, busqueda, seccion, tiempoSeccion }
    });

    const activity = await UserActivity.findById(sessionId);

    if (!activity) {
      console.error('❌ [ANALYTICS] Sesión no encontrada:', sessionId);
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    console.log('✅ [ANALYTICS] Sesión encontrada, procesando datos...');

    // Actualizar tiempo de sesión
    activity.actualizarTiempoSesion();

    // Agregar click si viene
    if (clicks) {
      console.log('🖱️ [ANALYTICS] Registrando', clicks.length, 'click(s)');
      clicks.forEach(click => {
        activity.agregarClick(
          click.tipo,
          click.elemento,
          click.elementoId,
          click.tiempoEnPagina
        );
      });
    }

    // Agregar vista de categoría
    if (categoria) {
      console.log('📂 [ANALYTICS] Registrando categoría vista:', categoria);
      activity.agregarVistaCategoria(categoria);
    }

    // Agregar producto visto
    if (productoVisto) {
      console.log('👁️ [ANALYTICS] Registrando producto visto:', productoVisto.productoId);
      const productoExistente = activity.productosVistos.find(
        p => p.producto?.toString() === productoVisto.productoId
      );

      if (productoExistente) {
        productoExistente.veces++;
        productoExistente.tiempoViendo += productoVisto.tiempoViendo || 0;
        productoExistente.ultimaVista = new Date();
        console.log('  → Producto ya existía, actualizado. Veces:', productoExistente.veces);
      } else {
        activity.productosVistos.push({
          producto: productoVisto.productoId,
          categoria: productoVisto.categoria,
          tiempoViendo: productoVisto.tiempoViendo || 0,
          ultimaVista: new Date()
        });
        console.log('  → Nuevo producto agregado');
      }
    }

    // Agregar búsqueda
    if (busqueda) {
      console.log('🔍 [ANALYTICS] Registrando búsqueda:', busqueda.termino);
      activity.busquedas.push({
        termino: busqueda.termino,
        categoria: busqueda.categoria,
        resultados: busqueda.resultados,
        timestamp: new Date()
      });
    }

    // Actualizar tiempo en sección
    if (seccion && tiempoSeccion) {
      console.log('⏱️ [ANALYTICS] Registrando tiempo en sección:', seccion, '-', tiempoSeccion, 'seg');
      const seccionExistente = activity.tiempoPorSeccion.find(
        s => s.seccion === seccion
      );

      if (seccionExistente) {
        seccionExistente.tiempoSegundos += tiempoSeccion;
        seccionExistente.ultimaVisita = new Date();
      } else {
        activity.tiempoPorSeccion.push({
          seccion,
          tiempoSegundos: tiempoSeccion,
          ultimaVisita: new Date()
        });
      }
    }

    // Calcular preferencias
    activity.calcularPreferencias();

    await activity.save();

    console.log('✅ [ANALYTICS] Sesión actualizada y guardada. Stats:', {
      totalClicks: activity.clicks.length,
      categoriasVistas: activity.categoriasVistas.length,
      productosVistos: activity.productosVistos.length,
      busquedas: activity.busquedas.length
    });

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error actualizando sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Registrar intento de subasta
// @route   POST /api/analytics/bid-attempt
// @access  Private
const registrarIntentoSubasta = async (req, res) => {
  try {
    const { sessionId, productoId, categoria, monto, exitoso, razonFallo } = req.body;

    console.log('📊 [ANALYTICS] Registrando intento de subasta:', {
      sessionId,
      productoId,
      categoria,
      monto,
      exitoso,
      razonFallo,
      userId: req.user?._id
    });

    const activity = await UserActivity.findById(sessionId);

    if (!activity) {
      console.error('❌ [ANALYTICS] Sesión no encontrada:', sessionId);
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    console.log('✅ [ANALYTICS] Sesión encontrada para usuario:', activity.usuario);

    const ahora = new Date();
    
    activity.intentosSubasta.push({
      productoId,
      categoria,
      monto,
      exitoso,
      razonFallo,
      timestamp: ahora,
      horaCompleta: {
        segundo: ahora.getSeconds(),
        minuto: ahora.getMinutes(),
        hora: ahora.getHours(),
        dia: ahora.getDate(),
        mes: ahora.getMonth() + 1,
        ano: ahora.getFullYear()
      }
    });

    await activity.save();

    console.log('✅ [ANALYTICS] Intento de subasta guardado. Total intentos:', activity.intentosSubasta.length);

    res.json({
      success: true,
      message: 'Intento de subasta registrado',
      data: {
        totalIntentos: activity.intentosSubasta.length
      }
    });
  } catch (error) {
    console.error('❌ [ANALYTICS] Error registrando intento:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener recomendaciones personalizadas
// @route   GET /api/analytics/recommendations
// @access  Private
const obtenerRecomendaciones = async (req, res) => {
  try {
    const userId = req.user._id;

    // Obtener todas las actividades del usuario
    const actividades = await UserActivity.find({ usuario: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    if (!actividades || actividades.length === 0) {
      // Si no hay historial, devolver productos populares
      const productosPopulares = await Product.find({ estado: 'activo' })
        .sort({ numeroOfertas: -1, vistas: -1 })
        .limit(10)
        .populate('vendedor', 'nombre apellido');

      return res.json({
        success: true,
        data: {
          recomendaciones: productosPopulares,
          razon: 'Productos populares (sin historial)'
        }
      });
    }

    // Agregar categorías de todas las actividades
    const todasCategorias = {};
    const todosProductosVistos = new Set();

    actividades.forEach(act => {
      act.categoriasVistas?.forEach(cv => {
        todasCategorias[cv.categoria] = (todasCategorias[cv.categoria] || 0) + cv.veces;
      });
      
      act.productosVistos?.forEach(pv => {
        if (pv.producto) {
          todosProductosVistos.add(pv.producto.toString());
        }
      });
    });

    // Ordenar categorías por frecuencia
    const categoriasOrdenadas = Object.entries(todasCategorias)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Calcular rango de precios
    const todosPrecios = [];
    actividades.forEach(act => {
      act.intentosSubasta?.forEach(intento => {
        if (intento.monto) todosPrecios.push(intento.monto);
      });
    });

    let filtro = {
      estado: 'activo',
      _id: { $nin: Array.from(todosProductosVistos) } // Excluir ya vistos
    };

    // Si tiene categorías preferidas, buscar en esas
    if (categoriasOrdenadas.length > 0) {
      filtro.categoria = { $in: categoriasOrdenadas };
    }

    // Si tiene rango de precios, filtrar
    if (todosPrecios.length > 0) {
      const precioMin = Math.min(...todosPrecios);
      const precioMax = Math.max(...todosPrecios);
      filtro.precioInicial = {
        $gte: precioMin * 0.5, // 50% del mínimo
        $lte: precioMax * 1.5  // 150% del máximo
      };
    }

    const recomendaciones = await Product.find(filtro)
      .sort({ createdAt: -1, numeroOfertas: -1 })
      .limit(10)
      .populate('vendedor', 'nombre apellido');

    // Si no hay suficientes, agregar productos similares
    if (recomendaciones.length < 5) {
      const adicionales = await Product.find({
        estado: 'activo',
        _id: { 
          $nin: [
            ...Array.from(todosProductosVistos),
            ...recomendaciones.map(r => r._id)
          ]
        }
      })
        .sort({ numeroOfertas: -1, vistas: -1 })
        .limit(10 - recomendaciones.length)
        .populate('vendedor', 'nombre apellido');

      recomendaciones.push(...adicionales);
    }

    res.json({
      success: true,
      data: {
        recomendaciones,
        razon: 'Basado en tu actividad',
        categoriasPreferidas: categoriasOrdenadas,
        rangoPrecios: todosPrecios.length > 0 ? {
          min: Math.min(...todosPrecios),
          max: Math.max(...todosPrecios)
        } : null
      }
    });
  } catch (error) {
    console.error('Error obteniendo recomendaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Obtener estadísticas del usuario
// @route   GET /api/analytics/stats
// @access  Private
const obtenerEstadisticas = async (req, res) => {
  try {
    const userId = req.user._id;

    const actividades = await UserActivity.find({ usuario: userId })
      .sort({ createdAt: -1 });

    const stats = {
      totalSesiones: actividades.length,
      tiempoTotalSegundos: actividades.reduce((sum, act) => sum + (act.sesion.duracionSegundos || 0), 0),
      totalClicks: actividades.reduce((sum, act) => sum + (act.clicks?.length || 0), 0),
      categoriasVistas: {},
      productosVistos: actividades.reduce((sum, act) => sum + (act.productosVistos?.length || 0), 0),
      intentosSubasta: {
        total: actividades.reduce((sum, act) => sum + (act.intentosSubasta?.length || 0), 0),
        exitosos: 0,
        fallidos: 0
      },
      busquedasRealizadas: actividades.reduce((sum, act) => sum + (act.busquedas?.length || 0), 0),
      seccionesMasVisitadas: {}
    };

    // Categorías más vistas
    actividades.forEach(act => {
      act.categoriasVistas?.forEach(cv => {
        stats.categoriasVistas[cv.categoria] = (stats.categoriasVistas[cv.categoria] || 0) + cv.veces;
      });

      act.intentosSubasta?.forEach(intento => {
        if (intento.exitoso) {
          stats.intentosSubasta.exitosos++;
        } else {
          stats.intentosSubasta.fallidos++;
        }
      });

      act.tiempoPorSeccion?.forEach(seccion => {
        stats.seccionesMasVisitadas[seccion.seccion] = 
          (stats.seccionesMasVisitadas[seccion.seccion] || 0) + seccion.tiempoSegundos;
      });
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

module.exports = {
  iniciarSesion,
  actualizarSesion,
  registrarIntentoSubasta,
  obtenerRecomendaciones,
  obtenerEstadisticas
};

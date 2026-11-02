// ============================================================================
// PUNTO 1: TRAZABILIDAD COMPLETA DEL PROCESO DE SUBASTA
// ============================================================================
// Este archivo maneja toda la gestión de subastas:
// - VENDEDOR: Crear, administrar, recibir ofertas, cerrar subasta
// - COMPRADOR: Ver subastas, realizar ofertas, recibir notificaciones
// ============================================================================

const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const { validateProduct } = require('../middleware/validators');
const { eliminarImagenes, eliminarSubidas } = require('../services/imageStorage');
const { adjudicar, cancelar } = require('../services/auctionLifecycle');
const { escaparRegex, texto, paginacion, respuestaPaginacion } = require('../utils/query');
const { mismoId } = require('../utils/ids');
const multer = require('multer');
const path = require('path');

// ============================================================================
// VENDEDOR - PASO 1: Configuración para subir imágenes de productos
// ============================================================================
// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Usar ruta absoluta para evitar problemas de cwd
    const dest = path.join(__dirname, '../uploads/products');
    cb(null, dest);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: function(req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
}).array('imagenes', 5); // Máximo 5 imágenes

// ============================================================================
// VENDEDOR - PASO 2: Crear nueva subasta (INICIO DEL PROCESO)
// ============================================================================
// Esta función permite al vendedor:
// - Crear una subasta con título, descripción, categoría
// - Subir imágenes del producto
// - Establecer precio inicial y fechas de inicio/fin
// - La subasta queda en estado "borrador" o "activo" según las fechas
// ============================================================================
const crearProducto = async (req, res) => {
  // multer va primero: hasta que procesa el multipart no hay req.body que validar.
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Este callback es asíncrono y Express no captura sus errores: sin este try,
    // un fallo aquí sería una promesa rechazada y server.js apagaría el servidor.
    try {
      await Promise.all(validateProduct.map((regla) => regla.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await eliminarSubidas(req.files);
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
          errors: errors.array()
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'Sube al menos una imagen' });
      }

      const { titulo, descripcion, categoria, fechaInicio, fechaFin, tipoSubasta, condiciones, tags, usuariosInvitados } = req.body;
      const precioInicial = Number(req.body.precioInicial);
      const porcentajeMinimo = Number(req.body.porcentajeMinimo);

      const producto = await Product.create({
        titulo,
        descripcion,
        categoria,
        precioInicial,
        porcentajeMinimo,
        incrementoMinimo: Math.ceil(precioInicial * (porcentajeMinimo / 100)),
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        tipoSubasta: tipoSubasta || 'publica',
        imagenes: req.files.map((file, index) => ({
          url: `/uploads/products/${file.filename}`,
          alt: `${titulo} - imagen ${index + 1}`,
          esPortada: index === 0
        })),
        vendedor: req.user._id,
        condiciones,
        tags: typeof tags === 'string' ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
        usuariosInvitados: usuariosInvitados || [],
        estado: new Date(fechaInicio) <= new Date() ? 'activo' : 'borrador'
      });

      return res.status(201).json({
        success: true,
        message: 'Subasta creada exitosamente',
        data: producto
      });
    } catch (error) {
      console.error('Error creando producto:', error);
      await eliminarSubidas(req.files);
      return res.status(500).json({ success: false, message: 'Error del servidor' });
    }
  });
};

// ============================================================================
// COMPRADOR - PASO 1: Ver todas las subastas disponibles
// ============================================================================
// Esta función permite al comprador:
// - Ver todas las subastas activas
// - Filtrar por categoría, estado, rango de precio
// - Buscar por texto (título/descripción)
// - Ordenar por diferentes criterios
// - Paginación para mejor rendimiento
// ============================================================================
const obtenerProductos = async (req, res) => {
  try {
    const categoria = texto(req.query.categoria);
    const estado = texto(req.query.estado) || 'activo';
    const busqueda = texto(req.query.busqueda);
    const ordenar = texto(req.query.ordenar) || '-createdAt';
    const { precioMin, precioMax } = req.query;
    const pag = paginacion(req.query);

    // Cada condición va en su propio bloque de $and: antes la búsqueda pisaba el
    // $or de permisos y dejaba ver subastas privadas de otros.
    const condiciones = [];

    const accesibles = [{ tipoSubasta: 'publica' }];
    if (req.user) {
      accesibles.push({ vendedor: req.user._id }, { usuariosInvitados: req.user._id });
    }
    condiciones.push({ $or: accesibles });

    // Borradores y canceladas son asuntos de su vendedor.
    const ESTADOS_PUBLICOS = ['activo', 'pausado', 'finalizado'];
    if (estado === 'todas') {
      condiciones.push({ estado: { $in: ESTADOS_PUBLICOS } });
    } else if (ESTADOS_PUBLICOS.includes(estado)) {
      condiciones.push({ estado });
    } else {
      condiciones.push({ estado, vendedor: req.user ? req.user._id : null });
    }

    if (categoria && categoria !== 'todas') {
      condiciones.push({ categoria });
    }

    const rango = {};
    if (Number.isFinite(Number(precioMin)) && precioMin !== undefined && precioMin !== '') rango.$gte = Number(precioMin);
    if (Number.isFinite(Number(precioMax)) && precioMax !== undefined && precioMax !== '') rango.$lte = Number(precioMax);
    if (Object.keys(rango).length) condiciones.push({ precioActual: rango });

    if (busqueda) {
      const patron = new RegExp(escaparRegex(busqueda.slice(0, 100)), 'i');
      condiciones.push({ $or: [{ titulo: patron }, { descripcion: patron }, { tags: patron }] });
    }

    if (estado === 'activo') {
      const ahora = new Date();
      condiciones.push({ fechaInicio: { $lte: ahora }, fechaFin: { $gt: ahora } });
    }

    const query = { $and: condiciones };

    const productos = await Product.find(query)
      .populate('vendedor', 'nombre apellido')
      .sort(ordenar)
      .limit(pag.limite)
      .skip(pag.skip);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: productos,
      pagination: respuestaPaginacion(pag, total)
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// Obtener subasta por ID

const obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id)
      .populate('vendedor', 'nombre apellido fechaRegistro')
      .populate('ofertaGanadora')
      .populate('ganador', 'nombre apellido');

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Subasta no encontrada'
      });
    }

    // Verificar permisos para subastas privadas
    if (!producto.puedeVerSubasta(req.user?._id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta subasta'
      });
    }

    // Incrementar vistas solo si no es el vendedor
    if (!req.user || req.user._id.toString() !== producto.vendedor._id.toString()) {
      await Product.findByIdAndUpdate(req.params.id, { $inc: { vistas: 1 } });
    }

    // Obtener las últimas ofertas
    const ofertas = await Bid.find({ producto: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        ...producto.toJSON(),
        ultimasOfertas: ofertas
      }
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// Actualizar subasta

const actualizarProducto = async (req, res) => {
  try {
    // Primero ejecutar multer para procesar multipart/form-data si hay imágenes nuevas
    upload(req, res, async function(err) {
      if (err) {
        console.log('Error en multer:', err);
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      try {
        const producto = await Product.findById(req.params.id);

        if (!producto) {
          return res.status(404).json({
            success: false,
            message: 'Subasta no encontrada'
          });
        }

        // Verificar que sea el vendedor (soporta vendedor poblado u ObjectId)
        if (!mismoId(producto.vendedor, req.user._id)) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para editar esta subasta'
          });
        }

        // Preparar datos para actualizar
        const datosActualizar = {};

        // Campos que siempre se pueden actualizar
        const camposEditables = ['titulo', 'descripcion', 'condiciones', 'tags'];
        
        // Si NO hay ofertas, permitir editar más campos
        if (producto.numeroOfertas === 0) {
          camposEditables.push('categoria', 'precioInicial', 'porcentajeMinimo', 'fechaInicio', 'fechaFin', 'tipoSubasta');
        }

        // Actualizar solo los campos permitidos que vengan en el body
        camposEditables.forEach(campo => {
          if (req.body[campo] !== undefined) {
            producto[campo] = req.body[campo];
          }
        });

        // Procesar tags si vienen como string
        if (req.body.tags && typeof req.body.tags === 'string') {
          producto.tags = req.body.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        }

        // Sin ofertas, el precio de salida manda: antes precioActual se quedaba con
        // el valor viejo y la gente ofertaba sobre un precio que ya no existía.
        if (producto.numeroOfertas === 0 && (req.body.precioInicial || req.body.porcentajeMinimo)) {
          producto.incrementoMinimo = Math.ceil(Number(producto.precioInicial) * (Number(producto.porcentajeMinimo) / 100));
          producto.precioActual = Number(producto.precioInicial);
        }

        // Si cambian las fechas de una subasta sin ofertas, su estado debe seguirlas.
        if (producto.numeroOfertas === 0 && req.body.fechaInicio && ['borrador', 'activo'].includes(producto.estado)) {
          producto.estado = producto.fechaInicio <= new Date() ? 'activo' : 'borrador';
        }

        // Procesar nuevas imágenes si se subieron
        if (req.files && req.files.length > 0) {
          const nuevasImagenes = req.files.map((file, index) => ({
            url: `/uploads/products/${file.filename}`,
            alt: `${producto.titulo} - imagen ${producto.imagenes.length + index + 1}`,
            esPortada: index === 0 && producto.imagenes.length === 0
          }));
          
          // Agregar las nuevas imágenes a las existentes
          producto.imagenes = [...producto.imagenes, ...nuevasImagenes];
        }

        // Guardar el producto actualizado
        const productoActualizado = await producto.save();

        res.json({
          success: true,
          message: 'Subasta actualizada exitosamente',
          data: productoActualizado
        });
      } catch (error) {
        console.error('Error actualizando producto:', error);
        
        // Manejar errores de validación de manera más clara
        if (error.name === 'ValidationError') {
          const mensajes = Object.values(error.errors).map(err => err.message);
          return res.status(400).json({
            success: false,
            message: mensajes.join('. ')
          });
        }
        
        res.status(500).json({
          success: false,
          message: 'Error del servidor',
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error('Error en actualizarProducto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// Eliminar subasta

const eliminarProducto = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Subasta no encontrada'
      });
    }

    // Verificar que sea el vendedor (soporta vendedor poblado u ObjectId)
    if (!mismoId(producto.vendedor, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta subasta'
      });
    }

    // Opcional: Permitir forzar eliminación aunque haya ofertas
    const { forzar } = req.query;
    
    if (producto.numeroOfertas > 0 && !forzar) {
      return res.status(400).json({
        success: false,
        message: 'Esta subasta tiene ofertas. ¿Estás seguro de que quieres eliminarla? Esto eliminará también todas las ofertas asociadas.',
        confirmarRequerido: true,
        numeroOfertas: producto.numeroOfertas
      });
    }

    // Eliminar todas las pujas asociadas a este producto
    const pujasEliminadas = await Bid.deleteMany({ producto: req.params.id });

    // Eliminar el producto y sus archivos
    await Product.findByIdAndDelete(req.params.id);
    await eliminarImagenes(producto.imagenes);

    res.json({
      success: true,
      message: 'Subasta eliminada exitosamente',
      detalles: {
        pujasEliminadas: pujasEliminadas.deletedCount
      }
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// Obtener subastas del vendedor

const obtenerMisSubastas = async (req, res) => {
  try {
    const estado = texto(req.query.estado);
    const ordenar = texto(req.query.ordenar) || '-createdAt';
    const pag = paginacion(req.query);

    let query = { vendedor: req.user._id };

    if (estado && estado !== 'todas') {
      query.estado = estado;
    }

    const productos = await Product.find(query)
      .sort(ordenar)
      .limit(pag.limite)
      .skip(pag.skip);

    const total = await Product.countDocuments(query);

    // Obtener estadísticas
    const estadisticas = await Product.aggregate([
      { $match: { vendedor: req.user._id } },
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
          totalVentas: { $sum: '$precioActual' }
        }
      }
    ]);

    res.json({
      success: true,
      data: productos,
      estadisticas,
      pagination: respuestaPaginacion(pag, total)
    });
  } catch (error) {
    console.error('Error obteniendo mis subastas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// Cambiar estado de subasta

const cambiarEstadoSubasta = async (req, res) => {
  try {
    const { estado } = req.body;
    const producto = await Product.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Subasta no encontrada'
      });
    }

    // Verificar que sea el vendedor (soporta vendedor poblado u ObjectId)
    if (!mismoId(producto.vendedor, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado de esta subasta'
      });
    }

    // Validar transiciones de estado
    const transicionesValidas = {
      'borrador': ['activo', 'cancelado'],
      'activo': ['pausado', 'finalizado', 'cancelado'],
      'pausado': ['activo', 'cancelado'],
      'finalizado': [],
      'cancelado': []
    };

    if (!transicionesValidas[producto.estado].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de ${producto.estado} a ${estado}`
      });
    }

    // Adjudicar y cancelar notifican a los involucrados; el resto es solo cambio de estado.
    let actualizado;
    if (estado === 'finalizado') {
      actualizado = await adjudicar(producto._id, producto.estado);
    } else if (estado === 'cancelado') {
      actualizado = await cancelar(producto._id, producto.estado);
    } else {
      actualizado = await Product.findOneAndUpdate(
        { _id: producto._id, estado: producto.estado },
        { estado },
        { new: true }
      );
    }

    if (!actualizado) {
      return res.status(409).json({
        success: false,
        message: 'El estado de la subasta acaba de cambiar. Recarga e inténtalo de nuevo.'
      });
    }

    res.json({
      success: true,
      message: `Subasta ${estado === 'activo' ? 'activada' : estado} exitosamente`,
      data: actualizado
    });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
  obtenerMisSubastas,
  cambiarEstadoSubasta,
  upload
};

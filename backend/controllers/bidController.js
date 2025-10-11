const { validationResult } = require('express-validator');
const Bid = require('../models/Bid');
const Product = require('../models/Product');

// @desc    Crear nueva oferta
// @route   POST /api/products/:productId/ofertas
// @access  Private (Solo compradores)
const crearOferta = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

  const { monto, mensaje } = req.body;
    const productoId = req.params.productId;

    // Obtener el producto
    const producto = await Product.findById(productoId);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Subasta no encontrada'
      });
    }

    // Verificar que la subasta esté activa
    if (producto.estado !== 'activo') {
      return res.status(400).json({
        success: false,
        message: 'La subasta no está activa'
      });
    }

    // Verificar que no haya terminado
    if (new Date() > producto.fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'La subasta ya ha terminado'
      });
    }

    // Verificar que no haya empezado aún
    if (new Date() < producto.fechaInicio) {
      return res.status(400).json({
        success: false,
        message: 'La subasta aún no ha comenzado'
      });
    }

    // Verificar que no sea el vendedor
    {
      const vendedorId = producto.vendedor && producto.vendedor._id ? producto.vendedor._id : producto.vendedor;
      if (String(vendedorId) === String(req.user._id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes ofertar en tu propia subasta'
        });
      }
    }

    // Verificar permisos para subastas privadas
    if (!producto.puedeVerSubasta(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ofertar en esta subasta'
      });
    }

    // Verificar que el monto sea mayor al precio actual más el incremento mínimo
    const montoMinimo = producto.precioActual + producto.incrementoMinimo;
    if (monto < montoMinimo) {
      return res.status(400).json({
        success: false,
        message: `El monto mínimo es $${montoMinimo.toLocaleString()}`
      });
    }

    // Verificar que el usuario no tenga una oferta activa mayor
    const ofertaActual = await Bid.findOne({
      producto: productoId,
      postor: req.user._id,
      estado: 'activa'
    }).sort({ monto: -1 });

    if (ofertaActual && ofertaActual.monto >= monto) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una oferta igual o mayor'
      });
    }

    // Marcar ofertas anteriores como superadas
    await Bid.marcarOfertasComoSuperadas(productoId, monto);

    // Mensaje por defecto si no viene en la petición
    const nombre = (req.user?.nombre || '').trim();
    const apellido = (req.user?.apellido || '').trim();
    const usuarioTexto = `${nombre} ${apellido}`.trim() || 'Usuario';
    const montoTexto = `$${Number(monto).toLocaleString('es-CO')}`;
    const mensajeFinal = mensaje && String(mensaje).trim().length > 0
      ? mensaje
      : `${usuarioTexto} acaba de ofertar ${montoTexto}, ¡va ganando!!!`;

    // Crear la nueva oferta
    const oferta = await Bid.create({
      producto: productoId,
      postor: req.user._id,
      monto,
      montoAnterior: producto.precioActual,
      mensaje: mensajeFinal,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Actualizar el producto
    await Product.findByIdAndUpdate(productoId, {
      precioActual: monto,
      $inc: { numeroOfertas: 1 }
    });

    // Poblar la oferta para respuesta
    const ofertaCompleta = await Bid.findById(oferta._id)
      .populate('postor', 'nombre apellido')
      .populate('producto', 'titulo precioActual');

    res.status(201).json({
      success: true,
      message: 'Oferta realizada exitosamente',
      data: ofertaCompleta
    });

  } catch (error) {
    console.error('Error creando oferta:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Obtener ofertas de una subasta
// @route   GET /api/products/:productId/ofertas
// @access  Public
const obtenerOfertasProducto = async (req, res) => {
  try {
    const {
      pagina = 1,
      limite = 20,
      estado = 'activa'
    } = req.query;

    const productoId = req.params.productId;

    // Verificar que el producto existe
    const producto = await Product.findById(productoId);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Subasta no encontrada'
      });
    }

    // Verificar permisos para subastas privadas
    if (req.user && !producto.puedeVerSubasta(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las ofertas de esta subasta'
      });
    }

    let query = { producto: productoId };
    if (estado && estado !== 'todas') {
      query.estado = estado;
    }

    const skip = (pagina - 1) * limite;

    const ofertas = await Bid.find(query)
      .populate('postor', 'nombre apellido')
      .sort({ monto: -1, createdAt: -1 })
      .limit(Number(limite))
      .skip(skip);

    const total = await Bid.countDocuments(query);
    const totalPaginas = Math.ceil(total / limite);

    // Obtener estadísticas de ofertas
    const estadisticas = await Bid.aggregate([
      { $match: { producto: producto._id } },
      {
        $group: {
          _id: null,
          totalOfertas: { $sum: 1 },
          ofertaMaxima: { $max: '$monto' },
          ofertaMinima: { $min: '$monto' },
          ofertaPromedio: { $avg: '$monto' },
          postoresUnicos: { $addToSet: '$postor' }
        }
      },
      {
        $project: {
          totalOfertas: 1,
          ofertaMaxima: 1,
          ofertaMinima: 1,
          ofertaPromedio: { $round: ['$ofertaPromedio', 2] },
          totalPostores: { $size: '$postoresUnicos' }
        }
      }
    ]);

    res.json({
      success: true,
      data: ofertas,
      estadisticas: estadisticas[0] || null,
      pagination: {
        paginaActual: Number(pagina),
        totalPaginas,
        total,
        limite: Number(limite)
      }
    });

  } catch (error) {
    console.error('Error obteniendo ofertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Obtener ofertas del usuario
// @route   GET /api/ofertas/mis-ofertas
// @access  Private
const obtenerMisOfertas = async (req, res) => {
  try {
    const {
      estado,
      pagina = 1,
      limite = 20,
      ordenar = '-createdAt'
    } = req.query;

    let query = { postor: req.user._id };
    if (estado && estado !== 'todas') {
      query.estado = estado;
    }

    const skip = (pagina - 1) * limite;

    const ofertas = await Bid.find(query)
      .populate('producto', 'titulo imagenes estado fechaFin precioActual')
      .sort(ordenar)
      .limit(Number(limite))
      .skip(skip);

    const total = await Bid.countDocuments(query);
    const totalPaginas = Math.ceil(total / limite);

    // Estadísticas del usuario
    const estadisticas = await Bid.aggregate([
      { $match: { postor: req.user._id } },
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
          montoTotal: { $sum: '$monto' }
        }
      }
    ]);

    res.json({
      success: true,
      data: ofertas,
      estadisticas,
      pagination: {
        paginaActual: Number(pagina),
        totalPaginas,
        total,
        limite: Number(limite)
      }
    });

  } catch (error) {
    console.error('Error obteniendo mis ofertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Retirar oferta
// @route   DELETE /api/ofertas/:id
// @access  Private
const retirarOferta = async (req, res) => {
  try {
    const oferta = await Bid.findById(req.params.id);

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    // Verificar que sea el postor
    if (oferta.postor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para retirar esta oferta'
      });
    }

    // Verificar que la oferta esté activa
    if (oferta.estado !== 'activa') {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes retirar ofertas activas'
      });
    }

    // Verificar el producto
    const producto = await Product.findById(oferta.producto);
    
    // No permitir retirar si es la oferta ganadora actual
    if (producto.precioActual === oferta.monto) {
      return res.status(400).json({
        success: false,
        message: 'No puedes retirar la oferta más alta'
      });
    }

    // Verificar tiempo límite para retirar (ej: 30 minutos)
    const tiempoLimite = 30 * 60 * 1000; // 30 minutos en millisegundos
    if (new Date() - oferta.createdAt > tiempoLimite) {
      return res.status(400).json({
        success: false,
        message: 'Ya no puedes retirar esta oferta (tiempo límite excedido)'
      });
    }

    oferta.estado = 'retirada';
    await oferta.save();

    res.json({
      success: true,
      message: 'Oferta retirada exitosamente'
    });

  } catch (error) {
    console.error('Error retirando oferta:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Obtener historial de ofertas de un producto
// @route   GET /api/products/:productId/historial-ofertas
// @access  Private (Solo vendedor del producto)
const obtenerHistorialOfertas = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.productId);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Subasta no encontrada'
      });
    }

    // Solo el vendedor puede ver el historial completo
    {
      const vendedorId = producto.vendedor && producto.vendedor._id ? producto.vendedor._id : producto.vendedor;
      if (String(vendedorId) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver este historial'
        });
      }
    }

    const historial = await Bid.find({ producto: req.params.productId })
      .populate('postor', 'nombre apellido email')
      .sort({ createdAt: -1 });

    // Agregar análisis del historial
    const analisis = await Bid.aggregate([
      { $match: { producto: producto._id } },
      {
        $group: {
          _id: '$postor',
          totalOfertas: { $sum: 1 },
          ofertaMaxima: { $max: '$monto' },
          ultimaOferta: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario'
        }
      },
      {
        $project: {
          usuario: { $arrayElemAt: ['$usuario', 0] },
          totalOfertas: 1,
          ofertaMaxima: 1,
          ultimaOferta: 1
        }
      },
      { $sort: { ofertaMaxima: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        historial,
        analisis
      }
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

module.exports = {
  crearOferta,
  obtenerOfertasProducto,
  obtenerMisOfertas,
  retirarOferta,
  obtenerHistorialOfertas
};

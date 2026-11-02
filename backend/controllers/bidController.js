// ============================================================================
// PUNTO 1: TRAZABILIDAD - PROCESO DE OFERTAS (PUJAS)
// ============================================================================
// Este archivo maneja el proceso de ofertas/pujas:
// - COMPRADOR: Realizar ofertas, ver historial, actualizar ofertas
// - VENDEDOR: Ver ofertas recibidas en sus subastas
// - SISTEMA: Validar ofertas, actualizar ganador, notificaciones
// ============================================================================

const { validationResult } = require('express-validator');
const Bid = require('../models/Bid');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { idDe, mismoId } = require('../utils/ids');
const { paginacion, respuestaPaginacion, texto } = require('../utils/query');

// ============================================================================
// COMPRADOR - PASO 2: Realizar oferta en una subasta
// ============================================================================
// Esta función permite al comprador:
// - Realizar una oferta en una subasta activa
// - El sistema valida que la oferta sea mayor al precio actual + incremento mínimo
// - Se actualiza el precio actual y el ganador temporal
// - Se notifica al vendedor y otros participantes
// ============================================================================
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

    const { mensaje } = req.body;
    const monto = Number(req.body.monto);
    const productoId = req.params.productId;

    const producto = await Product.findById(productoId);

    if (!producto) {
      return res.status(404).json({ success: false, message: 'Subasta no encontrada' });
    }

    const ahora = new Date();
    if (producto.estado !== 'activo') {
      return res.status(400).json({ success: false, message: 'La subasta no está activa' });
    }
    if (ahora > producto.fechaFin) {
      return res.status(400).json({ success: false, message: 'La subasta ya ha terminado' });
    }
    if (ahora < producto.fechaInicio) {
      return res.status(400).json({ success: false, message: 'La subasta aún no ha comenzado' });
    }
    if (mismoId(producto.vendedor, req.user._id)) {
      return res.status(400).json({ success: false, message: 'No puedes ofertar en tu propia subasta' });
    }
    if (!producto.puedeVerSubasta(req.user._id)) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para ofertar en esta subasta' });
    }

    const precioVisto = producto.precioActual;
    const montoMinimo = precioVisto + producto.incrementoMinimo;
    if (monto < montoMinimo) {
      return res.status(400).json({
        success: false,
        message: `El monto mínimo es $${montoMinimo.toLocaleString('es-CO')}`
      });
    }

    // Reserva atómica del precio: si otra oferta entró mientras tanto, el filtro
    // por precioActual no coincide y esta se rechaza en vez de pisarla.
    const reservado = await Product.findOneAndUpdate(
      { _id: productoId, estado: 'activo', precioActual: precioVisto },
      { $set: { precioActual: monto }, $inc: { numeroOfertas: 1 } },
      { new: true }
    );
    if (!reservado) {
      return res.status(409).json({
        success: false,
        message: 'Alguien ofertó antes que tú. Revisa el precio y vuelve a intentarlo.'
      });
    }

    const lider = await Bid.findOne({ producto: productoId, estado: 'activa' }).sort({ monto: -1 });
    await Bid.marcarOfertasComoSuperadas(productoId, monto);

    const usuarioTexto = `${req.user.nombre || ''} ${req.user.apellido || ''}`.trim() || 'Usuario';
    const mensajeFinal = mensaje && String(mensaje).trim().length > 0
      ? mensaje
      : `${usuarioTexto} ofertó $${monto.toLocaleString('es-CO')}`;

    const oferta = await Bid.create({
      producto: productoId,
      postor: req.user._id,
      monto,
      montoAnterior: precioVisto,
      mensaje: mensajeFinal,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Los avisos no deben tumbar una oferta que ya quedó registrada.
    const avisos = [Notification.notificarNuevaPuja(idDe(producto.vendedor), producto, monto, usuarioTexto)];
    if (lider && !mismoId(lider.postor, req.user._id)) {
      avisos.push(Notification.notificarPujaSuperada(idDe(lider.postor), producto, lider.monto, monto));
    }
    await Promise.all(avisos).catch((e) => console.error('No se pudo notificar:', e.message));

    const ofertaCompleta = await Bid.findById(oferta._id);

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

// Obtener ofertas de una subasta

const obtenerOfertasProducto = async (req, res) => {
  try {
    const estado = texto(req.query.estado) || 'activa';
    const pag = paginacion(req.query, 20);

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
    if (!producto.puedeVerSubasta(req.user?._id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las ofertas de esta subasta'
      });
    }

    let query = { producto: productoId };
    if (estado && estado !== 'todas') {
      query.estado = estado;
    }

    const ofertas = await Bid.find(query)
      .sort({ monto: -1, createdAt: -1 })
      .limit(pag.limite)
      .skip(pag.skip);

    const total = await Bid.countDocuments(query);

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
      pagination: respuestaPaginacion(pag, total)
    });

  } catch (error) {
    console.error('Error obteniendo ofertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// Obtener ofertas del usuario

const obtenerMisOfertas = async (req, res) => {
  try {
    const estado = texto(req.query.estado);
    const ordenar = texto(req.query.ordenar) || '-createdAt';
    const pag = paginacion(req.query, 20);

    let query = { postor: req.user._id };
    if (estado && estado !== 'todas') {
      query.estado = estado;
    }

    const ofertas = await Bid.find(query)
      .sort(ordenar)
      .limit(pag.limite)
      .skip(pag.skip);

    const total = await Bid.countDocuments(query);

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
      pagination: respuestaPaginacion(pag, total)
    });

  } catch (error) {
    console.error('Error obteniendo mis ofertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// Retirar oferta

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
    if (!mismoId(oferta.postor, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para retirar esta oferta'
      });
    }

    // La oferta activa es siempre la más alta y esa no se retira: lo retirable son
    // las superadas, que además no mueven el precio.
    if (!['activa', 'superada'].includes(oferta.estado)) {
      return res.status(400).json({
        success: false,
        message: 'Esta oferta ya no se puede retirar'
      });
    }

    // Verificar el producto
    const producto = await Product.findById(idDe(oferta.producto));

    // No permitir retirar si es la oferta ganadora actual
    if (oferta.estado === 'activa' || producto.precioActual === oferta.monto) {
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
    await Product.findByIdAndUpdate(producto._id, { $inc: { numeroOfertas: -1 } });

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

// Obtener historial de ofertas de un producto

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

// Pagar oferta ganadora
const pagarOfertaGanadora = async (req, res) => {
  try {
    const { metodoPago, transaccionId } = req.body;
    const oferta = await Bid.findById(req.params.id);

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    // Verificar que sea el postor
    if (!mismoId(oferta.postor, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para pagar esta oferta'
      });
    }

    // Verificar que sea una oferta ganadora
    if (oferta.estado !== 'ganadora') {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes pagar ofertas ganadoras'
      });
    }

    // Verificar que no esté ya pagada
    if (oferta.pagado) {
      return res.status(400).json({
        success: false,
        message: 'Esta oferta ya ha sido pagada'
      });
    }

    // Actualizar la oferta con la información del pago
    oferta.pagado = true;
    oferta.metodoPago = metodoPago;
    oferta.transaccionId = transaccionId;
    oferta.fechaPago = new Date();
    await oferta.save();

    const producto = await Product.findById(idDe(oferta.producto));
    if (producto) {
      await Notification.notificarPagoRecibido(idDe(producto.vendedor), producto, oferta.monto)
        .catch((e) => console.error('No se pudo notificar:', e.message));
    }

    const ofertaCompleta = await Bid.findById(oferta._id);

    res.json({
      success: true,
      message: 'Pago procesado exitosamente',
      data: ofertaCompleta
    });

  } catch (error) {
    console.error('Error procesando pago:', error);
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
  obtenerHistorialOfertas,
  pagarOfertaGanadora
};

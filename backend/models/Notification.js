const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tipo: {
    type: String,
    enum: [
      'puja_superada',
      'puja_ganadora',
      'subasta_finalizada',
      'nueva_puja',
      'subasta_cancelada',
      'recordatorio_pago',
      'pago_recibido',
      'mensaje_vendedor',
      'favorito_pronto',
      'favorito_activo'
    ],
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  leida: {
    type: Boolean,
    default: false,
    index: true
  },
  // Datos adicionales para acciones
  accion: {
    tipo: {
      type: String,
      enum: ['ver_subasta', 'ver_puja', 'pagar', 'mensaje', null],
      default: null
    },
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    ofertaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid'
    }
  },
  // Metadata
  metadata: {
    monto: Number,
    nombreSubasta: String,
    imagenSubasta: String
  }
}, {
  timestamps: true
});

// Índices compuestos
notificationSchema.index({ usuario: 1, leida: 1 });
notificationSchema.index({ usuario: 1, createdAt: -1 });

// Método estático para crear notificación
notificationSchema.statics.crearNotificacion = async function(data) {
  try {
    const notificacion = await this.create(data);
    return notificacion;
  } catch (error) {
    console.error('Error creando notificación:', error);
    throw error;
  }
};

// Método estático para notificar puja superada
notificationSchema.statics.notificarPujaSuperada = async function(usuarioId, subasta, montoAnterior, montoNuevo) {
  return this.crearNotificacion({
    usuario: usuarioId,
    tipo: 'puja_superada',
    titulo: '¡Alguien superó tu puja!',
    mensaje: `Tu oferta de ${montoAnterior.toLocaleString()} COP fue superada en "${subasta.titulo}". La nueva oferta es de ${montoNuevo.toLocaleString()} COP.`,
    accion: {
      tipo: 'ver_subasta',
      productoId: subasta._id
    },
    metadata: {
      monto: montoNuevo,
      nombreSubasta: subasta.titulo,
      imagenSubasta: subasta.imagenes?.[0]?.url
    }
  });
};

// Método estático para notificar puja ganadora
notificationSchema.statics.notificarPujaGanadora = async function(usuarioId, subasta, monto) {
  return this.crearNotificacion({
    usuario: usuarioId,
    tipo: 'puja_ganadora',
    titulo: '🏆 ¡Felicidades! Ganaste la subasta',
    mensaje: `Has ganado la subasta "${subasta.titulo}" con una oferta de ${monto.toLocaleString()} COP. Por favor realiza el pago para completar la compra.`,
    accion: {
      tipo: 'pagar',
      productoId: subasta._id
    },
    metadata: {
      monto: monto,
      nombreSubasta: subasta.titulo,
      imagenSubasta: subasta.imagenes?.[0]?.url
    }
  });
};

// Método estático para notificar nueva puja al vendedor
notificationSchema.statics.notificarNuevaPuja = async function(vendedorId, subasta, monto, nombrePostor) {
  return this.crearNotificacion({
    usuario: vendedorId,
    tipo: 'nueva_puja',
    titulo: '💰 Nueva oferta en tu subasta',
    mensaje: `${nombrePostor || 'Alguien'} ha ofertado ${monto.toLocaleString()} COP en "${subasta.titulo}".`,
    accion: {
      tipo: 'ver_subasta',
      productoId: subasta._id
    },
    metadata: {
      monto: monto,
      nombreSubasta: subasta.titulo,
      imagenSubasta: subasta.imagenes?.[0]?.url
    }
  });
};

// Método estático para recordatorio de pago
notificationSchema.statics.recordatorioPago = async function(usuarioId, subasta, ofertaId, monto) {
  return this.crearNotificacion({
    usuario: usuarioId,
    tipo: 'recordatorio_pago',
    titulo: '💳 Recordatorio de pago pendiente',
    mensaje: `Tienes un pago pendiente de ${monto.toLocaleString()} COP por la subasta "${subasta.titulo}". Por favor completa el pago pronto.`,
    accion: {
      tipo: 'pagar',
      productoId: subasta._id,
      ofertaId: ofertaId
    },
    metadata: {
      monto: monto,
      nombreSubasta: subasta.titulo,
      imagenSubasta: subasta.imagenes?.[0]?.url
    }
  });
};

// Método estático para pago recibido
notificationSchema.statics.notificarPagoRecibido = async function(vendedorId, subasta, monto) {
  return this.crearNotificacion({
    usuario: vendedorId,
    tipo: 'pago_recibido',
    titulo: '✅ Pago recibido',
    mensaje: `Has recibido un pago de ${monto.toLocaleString()} COP por la subasta "${subasta.titulo}".`,
    accion: {
      tipo: 'ver_subasta',
      productoId: subasta._id
    },
    metadata: {
      monto: monto,
      nombreSubasta: subasta.titulo,
      imagenSubasta: subasta.imagenes?.[0]?.url
    }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);

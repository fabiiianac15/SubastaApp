const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'El producto es requerido']
  },
  postor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El postor es requerido']
  },
  monto: {
    type: Number,
    required: [true, 'El monto de la oferta es requerido'],
    min: [1, 'El monto debe ser mayor a 0']
  },
  montoAnterior: {
    type: Number,
    default: 0
  },
  tipo: {
    type: String,
    enum: ['manual', 'automatica'],
    default: 'manual'
  },
  estado: {
    type: String,
    enum: ['activa', 'superada', 'retirada', 'ganadora'],
    default: 'activa'
  },
  mensaje: {
    type: String,
    maxlength: [200, 'El mensaje no puede tener más de 200 caracteres']
  },
  ip: String,
  userAgent: String,
  esGanadora: {
    type: Boolean,
    default: false
  },
  fechaExpiracion: Date,
  notificacionEnviada: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Populate automático
bidSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'postor',
    select: 'nombre apellido email tipoUsuario'
  }).populate({
    path: 'producto',
    select: 'titulo precioActual estado fechaFin'
  });
  next();
});

// Índices para mejorar consultas
bidSchema.index({ producto: 1, monto: -1 });
bidSchema.index({ postor: 1, createdAt: -1 });
bidSchema.index({ estado: 1 });
bidSchema.index({ createdAt: -1 });

// Método estático para obtener la oferta más alta de un producto
bidSchema.statics.obtenerOfertaMasAlta = function(productoId) {
  return this.findOne({
    producto: productoId,
    estado: 'activa'
  }).sort({ monto: -1 });
};

// Método estático para obtener ofertas de un usuario
bidSchema.statics.obtenerOfertasUsuario = function(userId, estado = null) {
  const query = { postor: userId };
  if (estado) query.estado = estado;
  
  return this.find(query).sort({ createdAt: -1 });
};

// Método para marcar ofertas anteriores como superadas
bidSchema.statics.marcarOfertasComoSuperadas = function(productoId, montoNuevo) {
  return this.updateMany(
    {
      producto: productoId,
      monto: { $lt: montoNuevo },
      estado: 'activa'
    },
    {
      $set: { estado: 'superada' }
    }
  );
};

module.exports = mongoose.model('Bid', bidSchema);
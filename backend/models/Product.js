const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [100, 'El título no puede tener más de 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es requerida'],
    maxlength: [2000, 'La descripción no puede tener más de 2000 caracteres']
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: ['tecnologia', 'moda', 'hogar', 'deportes', 'arte', 'vehiculos', 'otros']
  },
  precioInicial: {
    type: Number,
    required: [true, 'El precio inicial es requerido'],
    min: [1, 'El precio inicial debe ser mayor a 0']
  },
  precioActual: {
    type: Number,
    default: function() {
      return this.precioInicial;
    }
  },
  porcentajeMinimo: {
    type: Number,
    required: [true, 'El porcentaje mínimo de oferta es requerido'],
    min: [1, 'El porcentaje mínimo debe ser al menos 1%'],
    max: [50, 'El porcentaje mínimo no puede ser mayor al 50%'],
    default: 5
  },
  incrementoMinimo: {
    type: Number,
    default: function() {
      return Math.ceil(this.precioInicial * (this.porcentajeMinimo / 100));
    }
  },
  fechaInicio: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida']
  },
  fechaFin: {
    type: Date,
    required: [true, 'La fecha de fin es requerida'],
    validate: {
      validator: function(fechaFin) {
        return fechaFin > this.fechaInicio;
      },
      message: 'La fecha de fin debe ser posterior a la fecha de inicio'
    }
  },
  imagenes: [{
    url: {
      type: String,
      required: true
    },
    publicId: String, // Para Cloudinary
    alt: String,
    esPortada: {
      type: Boolean,
      default: false
    }
  }],
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El vendedor es requerido']
  },
  estado: {
    type: String,
    enum: ['borrador', 'activo', 'finalizado', 'cancelado', 'pausado'],
    default: 'borrador'
  },
  tipoSubasta: {
    type: String,
    enum: ['publica', 'privada'],
    default: 'publica',
    required: true
  },
  usuariosInvitados: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  numeroOfertas: {
    type: Number,
    default: 0
  },
  ofertaGanadora: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  },
  ganador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  condiciones: {
    type: String,
    maxlength: [500, 'Las condiciones no pueden tener más de 500 caracteres']
  },
  tags: [String],
  vistas: {
    type: Number,
    default: 0
  },
  favoritosDe: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  permitirOfertasAutomaticas: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para calcular tiempo restante
productSchema.virtual('tiempoRestante').get(function() {
  if (this.estado !== 'activo') return null;
  
  const ahora = new Date();
  const fin = new Date(this.fechaFin);
  const diferencia = fin - ahora;
  
  if (diferencia <= 0) return null;
  
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
  
  return { dias, horas, minutos, total: diferencia };
});

// Virtual para verificar si la subasta ha terminado
productSchema.virtual('haTerminado').get(function() {
  return new Date() > this.fechaFin;
});

// Middleware para actualizar estado automáticamente
productSchema.pre('find', function() {
  this.populate({
    path: 'vendedor',
    select: 'nombre apellido email tipoUsuario'
  });
});

productSchema.pre('findOne', function() {
  this.populate({
    path: 'vendedor',
    select: 'nombre apellido email tipoUsuario'
  });
});

// Índices para mejorar consultas
productSchema.index({ categoria: 1, estado: 1 });
productSchema.index({ fechaFin: 1 });
productSchema.index({ vendedor: 1 });
productSchema.index({ tipoSubasta: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ precioActual: -1 });
productSchema.index({ vistas: -1 });
productSchema.index({ createdAt: -1 });

// Método estático para buscar subastas activas
productSchema.statics.findActive = function() {
  return this.find({
    estado: 'activo',
    fechaInicio: { $lte: new Date() },
    fechaFin: { $gt: new Date() }
  });
};

// Método para verificar si un usuario puede ver la subasta
productSchema.methods.puedeVerSubasta = function(userId) {
  if (this.tipoSubasta === 'publica') return true;
  if (this.vendedor._id.toString() === userId) return true;
  return this.usuariosInvitados.includes(userId);
};

// Método para calcular el próximo incremento mínimo
productSchema.methods.calcularProximaOferta = function() {
  return this.precioActual + this.incrementoMinimo;
};

module.exports = mongoose.model('Product', productSchema);
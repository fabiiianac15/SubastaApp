const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Información de sesión
  sesion: {
    horaInicio: {
      type: Date,
      default: Date.now
    },
    horaFin: Date,
    duracionSegundos: {
      type: Number,
      default: 0
    },
    ip: String,
    userAgent: String,
    dispositivo: String // mobile, tablet, desktop
  },
  // Ubicación geográfica
  ubicacion: {
    pais: String,
    ciudad: String,
    region: String,
    latitud: Number,
    longitud: Number,
    zona_horaria: String,
    proveedor: String // IP geolocation provider
  },
  // Interacciones con categorías
  categoriasVistas: [{
    categoria: {
      type: String,
      enum: ['tecnologia', 'moda', 'hogar', 'deportes', 'arte', 'vehiculos', 'otros']
    },
    veces: {
      type: Number,
      default: 1
    },
    ultimaVista: {
      type: Date,
      default: Date.now
    }
  }],
  // Clicks y navegación
  clicks: [{
    tipo: String, // 'categoria', 'producto', 'boton', 'link'
    elemento: String,
    elementoId: String,
    tiempoEnPagina: Number, // segundos desde inicio de sesión
    timestamp: {
      type: Date,
      default: Date.now
    },
    horaCompleta: {
      segundo: Number,
      minuto: Number,
      hora: Number,
      dia: Number,
      mes: Number,
      ano: Number
    }
  }],
  // Productos vistos
  productosVistos: [{
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    categoria: String,
    veces: {
      type: Number,
      default: 1
    },
    tiempoViendo: Number, // segundos
    ultimaVista: {
      type: Date,
      default: Date.now
    }
  }],
  // Intentos de subasta
  intentosSubasta: [{
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    categoria: String,
    monto: Number,
    exitoso: {
      type: Boolean,
      default: false
    },
    razonFallo: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    horaCompleta: {
      segundo: Number,
      minuto: Number,
      hora: Number,
      dia: Number,
      mes: Number,
      ano: Number
    }
  }],
  // Búsquedas realizadas
  busquedas: [{
    termino: String,
    categoria: String,
    resultados: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Tiempo en diferentes secciones
  tiempoPorSeccion: [{
    seccion: String, // 'home', 'subastas', 'mis-ofertas', 'perfil', etc.
    tiempoSegundos: {
      type: Number,
      default: 0
    },
    ultimaVisita: {
      type: Date,
      default: Date.now
    }
  }],
  // Preferencias inferidas
  preferencias: {
    categoriasPreferidas: [String],
    rangoPrecios: {
      min: Number,
      max: Number
    },
    horariosActivo: [{
      dia: String, // 'lunes', 'martes', etc.
      horaInicio: Number,
      horaFin: Number
    }],
    dispositivoPreferido: String
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
userActivitySchema.index({ 'sesion.horaInicio': -1 });
userActivitySchema.index({ 'categoriasVistas.categoria': 1 });
userActivitySchema.index({ 'productosVistos.producto': 1 });
userActivitySchema.index({ usuario: 1, createdAt: -1 });

// Método para actualizar tiempo de sesión
userActivitySchema.methods.actualizarTiempoSesion = function() {
  if (this.sesion.horaInicio) {
    const ahora = new Date();
    this.sesion.horaFin = ahora;
    this.sesion.duracionSegundos = Math.floor((ahora - this.sesion.horaInicio) / 1000);
  }
};

// Método para agregar click
userActivitySchema.methods.agregarClick = function(tipo, elemento, elementoId, tiempoEnPagina) {
  const ahora = new Date();
  
  this.clicks.push({
    tipo,
    elemento,
    elementoId,
    tiempoEnPagina: tiempoEnPagina || 0,
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
};

// Método para agregar vista de categoría
userActivitySchema.methods.agregarVistaCategoria = function(categoria) {
  const categoriaExistente = this.categoriasVistas.find(c => c.categoria === categoria);
  
  if (categoriaExistente) {
    categoriaExistente.veces++;
    categoriaExistente.ultimaVista = new Date();
  } else {
    this.categoriasVistas.push({
      categoria,
      veces: 1,
      ultimaVista: new Date()
    });
  }
};

// Método para calcular preferencias
userActivitySchema.methods.calcularPreferencias = function() {
  // Categorías más vistas
  const categoriasOrdenadas = [...this.categoriasVistas]
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 3)
    .map(c => c.categoria);
  
  this.preferencias.categoriasPreferidas = categoriasOrdenadas;
  
  // Calcular rango de precios basado en productos vistos e intentos de subasta
  const precios = [
    ...this.productosVistos.map(p => p.producto?.precioInicial || 0),
    ...this.intentosSubasta.map(i => i.monto || 0)
  ].filter(p => p > 0);
  
  if (precios.length > 0) {
    this.preferencias.rangoPrecios = {
      min: Math.min(...precios),
      max: Math.max(...precios)
    };
  }
  
  return this.preferencias;
};

module.exports = mongoose.model('UserActivity', userActivitySchema);

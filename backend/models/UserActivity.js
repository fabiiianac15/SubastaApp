// ============================================================================
// 📸 PUNTO 2: BASE DE DATOS MONGODB - MODELO DE ANALYTICS
// ============================================================================
// Este modelo almacena exactamente los 5 requisitos del proyecto de aula:
// 1. ✅ Ubicación (país, ciudad, latitud, longitud)
// 2. ✅ Tiempo dentro de la página (inicio, fin, duración en segundos)
// 3. ✅ Categorías donde dio clic el usuario
// 4. ✅ Hora de ingreso (día, mes, año, hora, minuto, segundo)
// 5. ✅ Intentos de subastar un producto (exitoso o fallido)
// ============================================================================

const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ REQUISITO 1: UBICACIÓN GEOGRÁFICA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Captura la ubicación del usuario mediante:
  // - IP (geoip-lite) como fallback
  // - HTML5 Geolocation API del navegador para mayor precisión
  // Almacena: país, ciudad, latitud, longitud, zona horaria
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ubicacion: {
    // Sin permiso de ubicación y con una IP local no hay coordenadas: la sesión
    // se registra igual, con la ubicación como desconocida.
    pais: {
      type: String,
      default: 'Desconocido'
    },
    ciudad: {
      type: String,
      default: 'Desconocida'
    },
    region: String,
    latitud: Number,
    longitud: Number,
    zona_horaria: String,
    proveedor: {
      type: String,
      enum: ['navegador', 'geoip-lite', 'desconocido'],
      default: 'desconocido'
    }
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ REQUISITO 2: TIEMPO DENTRO DE LA PÁGINA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Mide el tiempo de permanencia del usuario:
  // - horaInicio: Cuando el usuario hace login
  // - horaFin: Cuando el usuario cierra sesión o se va
  // - duracionSegundos: Calculado mediante heartbeat cada 30 segundos
  // El sistema usa Visibility API para pausar cuando cambia de pestaña
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  tiempoEnPagina: {
    horaInicio: {
      type: Date,
      required: true,
      default: Date.now
    },
    horaFin: Date,
    duracionSegundos: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ REQUISITO 3: CATEGORÍAS EN LAS QUE DIO CLIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Registra cada vez que el usuario hace clic en una categoría:
  // - tecnología, moda, hogar, deportes, arte, vehículos, otros
  // - Se almacena la fecha/hora exacta del click
  // - Permite analizar intereses del usuario
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  categoriasClicks: [{
    categoria: {
      type: String,
      required: true,
      enum: ['tecnologia', 'moda', 'hogar', 'deportes', 'arte', 'vehiculos', 'otros']
    },
    fechaClick: {
      type: Date,
      required: true,
      default: Date.now
    },
    // Información detallada del momento del click
    horaCompleta: {
      segundo: { type: Number, min: 0, max: 59 },
      minuto: { type: Number, min: 0, max: 59 },
      hora: { type: Number, min: 0, max: 23 },
      dia: { type: Number, min: 1, max: 31 },
      mes: { type: Number, min: 1, max: 12 },
      ano: { type: Number, min: 2020 },
      diaSemana: {
        type: String,
        enum: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
      }
    }
  }],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ REQUISITO 4: HORA DE INGRESO (DÍA, MES, AÑO)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Captura la fecha y hora exacta cuando el usuario inicia sesión:
  // - Fecha completa (timestamp)
  // - Desglosado: segundo, minuto, hora, día, mes, año
  // - Día de la semana (lunes, martes, etc.)
  // Útil para análisis de patrones de uso por horarios y días
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  horaIngreso: {
    fechaCompleta: {
      type: Date,
      required: true,
      default: Date.now
    },
    segundo: { type: Number, min: 0, max: 59 },
    minuto: { type: Number, min: 0, max: 59 },
    hora: { type: Number, min: 0, max: 23 },
    dia: { type: Number, min: 1, max: 31 },
    mes: { type: Number, min: 1, max: 12 },
    ano: { type: Number, min: 2020 },
    diaSemana: {
      type: String,
      enum: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    }
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ REQUISITO 5: INTENTOS DE SUBASTAR PRODUCTO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Registra cada intento del usuario de crear una subasta:
  // - exitoso: true si la subasta se creó correctamente
  // - exitoso: false si hubo algún error (validación, imágenes, etc.)
  // - razonFallo: Mensaje de error específico si falló
  // - Se guarda: ID del producto, título, categoría, precio inicial
  // - Timestamp completo del intento
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  intentosSubasta: [{
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    tituloProducto: String,
    categoria: {
      type: String,
      enum: ['tecnologia', 'moda', 'hogar', 'deportes', 'arte', 'vehiculos', 'otros']
    },
    precioInicial: {
      type: Number,
      required: true,
      min: 0
    },
    exitoso: {
      type: Boolean,
      required: true,
      default: false
    },
    razonFallo: String,
    fechaIntento: {
      type: Date,
      required: true,
      default: Date.now
    },
    // Información detallada del momento del intento
    horaCompleta: {
      segundo: { type: Number, min: 0, max: 59 },
      minuto: { type: Number, min: 0, max: 59 },
      hora: { type: Number, min: 0, max: 23 },
      dia: { type: Number, min: 1, max: 31 },
      mes: { type: Number, min: 1, max: 12 },
      ano: { type: Number, min: 2020 },
      diaSemana: {
        type: String,
        enum: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
      }
    }
  }]
}, {
  timestamps: true
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ÍNDICES PARA BÚSQUEDAS RÁPIDAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
userActivitySchema.index({ usuario: 1, 'horaIngreso.fechaCompleta': -1 });
userActivitySchema.index({ 'ubicacion.pais': 1, 'ubicacion.ciudad': 1 });
userActivitySchema.index({ 'categoriasClicks.categoria': 1 });
userActivitySchema.index({ 'intentosSubasta.exitoso': 1 });
userActivitySchema.index({ 'horaIngreso.ano': 1, 'horaIngreso.mes': 1, 'horaIngreso.dia': 1 });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MÉTODOS DEL SCHEMA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Método para actualizar tiempo total en página
userActivitySchema.methods.actualizarTiempoEnPagina = function() {
  if (this.tiempoEnPagina.horaInicio) {
    const ahora = new Date();
    this.tiempoEnPagina.horaFin = ahora;
    this.tiempoEnPagina.duracionSegundos = Math.floor((ahora - this.tiempoEnPagina.horaInicio) / 1000);
  }
};

// Método para agregar click en categoría
userActivitySchema.methods.agregarClickCategoria = function(categoria) {
  const ahora = new Date();
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  
  this.categoriasClicks.push({
    categoria,
    fechaClick: ahora,
    horaCompleta: {
      segundo: ahora.getSeconds(),
      minuto: ahora.getMinutes(),
      hora: ahora.getHours(),
      dia: ahora.getDate(),
      mes: ahora.getMonth() + 1,
      ano: ahora.getFullYear(),
      diaSemana: diasSemana[ahora.getDay()]
    }
  });
};

// Método para agregar intento de subasta
userActivitySchema.methods.agregarIntentoSubasta = function(productoId, tituloProducto, categoria, precioInicial, exitoso, razonFallo = null) {
  const ahora = new Date();
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  
  this.intentosSubasta.push({
    productoId,
    tituloProducto,
    categoria,
    precioInicial,
    exitoso,
    razonFallo,
    fechaIntento: ahora,
    horaCompleta: {
      segundo: ahora.getSeconds(),
      minuto: ahora.getMinutes(),
      hora: ahora.getHours(),
      dia: ahora.getDate(),
      mes: ahora.getMonth() + 1,
      ano: ahora.getFullYear(),
      diaSemana: diasSemana[ahora.getDay()]
    }
  });
};

// Método estático para crear hora ingreso
userActivitySchema.statics.crearHoraIngreso = function() {
  const ahora = new Date();
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  
  return {
    fechaCompleta: ahora,
    segundo: ahora.getSeconds(),
    minuto: ahora.getMinutes(),
    hora: ahora.getHours(),
    dia: ahora.getDate(),
    mes: ahora.getMonth() + 1,
    ano: ahora.getFullYear(),
    diaSemana: diasSemana[ahora.getDay()]
  };
};

module.exports = mongoose.model('UserActivity', userActivitySchema);

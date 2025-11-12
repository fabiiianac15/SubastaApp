/**
 * CONSULTAS DE EJEMPLO PARA ANALYTICS EN MONGODB
 * 
 * Este archivo contiene queries de ejemplo que puedes ejecutar
 * en MongoDB Compass o en la consola de mongo para analizar los datos.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. VER TODAS LAS SESIONES DE TRACKING
// ═══════════════════════════════════════════════════════════════════════════
db.useractivities.find().pretty()

// ═══════════════════════════════════════════════════════════════════════════
// 2. UBICACIONES DE USUARIOS
// ═══════════════════════════════════════════════════════════════════════════

// Ver todas las ubicaciones únicas
db.useractivities.aggregate([
  {
    $group: {
      _id: {
        pais: "$ubicacion.pais",
        ciudad: "$ubicacion.ciudad"
      },
      total: { $sum: 1 },
      usuarios: { $addToSet: "$usuario" }
    }
  },
  {
    $project: {
      _id: 0,
      pais: "$_id.pais",
      ciudad: "$_id.ciudad",
      totalSesiones: "$total",
      usuariosUnicos: { $size: "$usuarios" }
    }
  },
  { $sort: { totalSesiones: -1 } }
])

// Obtener coordenadas para mapa de calor
db.useractivities.find(
  { 
    "ubicacion.latitud": { $exists: true },
    "ubicacion.longitud": { $exists: true }
  },
  {
    "ubicacion.latitud": 1,
    "ubicacion.longitud": 1,
    "ubicacion.ciudad": 1,
    "ubicacion.pais": 1,
    "sesion.horaInicio": 1
  }
)

// ═══════════════════════════════════════════════════════════════════════════
// 3. TIEMPO EN PÁGINA
// ═══════════════════════════════════════════════════════════════════════════

// Tiempo promedio de sesión
db.useractivities.aggregate([
  {
    $group: {
      _id: null,
      tiempoPromedioSegundos: { $avg: "$sesion.duracionSegundos" },
      tiempoTotalSegundos: { $sum: "$sesion.duracionSegundos" },
      totalSesiones: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      tiempoPromedioMinutos: { $divide: ["$tiempoPromedioSegundos", 60] },
      tiempoTotalHoras: { $divide: ["$tiempoTotalSegundos", 3600] },
      totalSesiones: 1
    }
  }
])

// Tiempo por sección
db.useractivities.aggregate([
  { $unwind: "$tiempoPorSeccion" },
  {
    $group: {
      _id: "$tiempoPorSeccion.seccion",
      tiempoPromedioSegundos: { $avg: "$tiempoPorSeccion.tiempoSegundos" },
      tiempoTotalSegundos: { $sum: "$tiempoPorSeccion.tiempoSegundos" },
      visitas: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      seccion: "$_id",
      tiempoPromedioMinutos: { $divide: ["$tiempoPromedioSegundos", 60] },
      tiempoTotalHoras: { $divide: ["$tiempoTotalSegundos", 3600] },
      visitas: 1
    }
  },
  { $sort: { tiempoTotalHoras: -1 } }
])

// ═══════════════════════════════════════════════════════════════════════════
// 4. CATEGORÍAS MÁS VISTAS
// ═══════════════════════════════════════════════════════════════════════════

db.useractivities.aggregate([
  { $unwind: "$categoriasVistas" },
  {
    $group: {
      _id: "$categoriasVistas.categoria",
      totalVistas: { $sum: "$categoriasVistas.veces" },
      usuariosUnicos: { $addToSet: "$usuario" },
      vistas: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      categoria: "$_id",
      totalVistas: 1,
      usuariosUnicos: { $size: "$usuariosUnicos" },
      sesionesQueVieron: "$vistas"
    }
  },
  { $sort: { totalVistas: -1 } }
])

// ═══════════════════════════════════════════════════════════════════════════
// 5. HORA DE INGRESO (DÍA, MES, AÑO)
// ═══════════════════════════════════════════════════════════════════════════

// Actividad por hora del día
db.useractivities.aggregate([
  { $unwind: "$clicks" },
  {
    $group: {
      _id: "$clicks.horaCompleta.hora",
      totalClicks: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      hora: "$_id",
      clicks: "$totalClicks"
    }
  },
  { $sort: { hora: 1 } }
])

// Actividad por día de la semana
db.useractivities.aggregate([
  { $unwind: "$clicks" },
  {
    $group: {
      _id: "$clicks.horaCompleta.diaSemana",
      totalClicks: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      diaSemana: "$_id",
      clicks: "$totalClicks"
    }
  },
  { $sort: { clicks: -1 } }
])

// Actividad por mes
db.useractivities.aggregate([
  { $unwind: "$clicks" },
  {
    $group: {
      _id: {
        mes: "$clicks.horaCompleta.mes",
        ano: "$clicks.horaCompleta.ano"
      },
      totalClicks: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      mes: "$_id.mes",
      ano: "$_id.ano",
      clicks: "$totalClicks"
    }
  },
  { $sort: { ano: -1, mes: -1 } }
])

// Actividad por día específico
db.useractivities.aggregate([
  { $unwind: "$clicks" },
  {
    $group: {
      _id: {
        dia: "$clicks.horaCompleta.dia",
        mes: "$clicks.horaCompleta.mes",
        ano: "$clicks.horaCompleta.ano"
      },
      totalClicks: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      fecha: {
        $concat: [
          { $toString: "$_id.dia" }, "/",
          { $toString: "$_id.mes" }, "/",
          { $toString: "$_id.ano" }
        ]
      },
      clicks: "$totalClicks"
    }
  },
  { $sort: { clicks: -1 } }
])

// ═══════════════════════════════════════════════════════════════════════════
// 6. INTENTOS DE SUBASTA
// ═══════════════════════════════════════════════════════════════════════════

// Todos los intentos de subasta
db.useractivities.aggregate([
  { $unwind: "$intentosSubasta" },
  {
    $group: {
      _id: null,
      totalIntentos: { $sum: 1 },
      exitosos: {
        $sum: { $cond: ["$intentosSubasta.exitoso", 1, 0] }
      },
      fallidos: {
        $sum: { $cond: ["$intentosSubasta.exitoso", 0, 1] }
      },
      montoPromedio: { $avg: "$intentosSubasta.monto" }
    }
  },
  {
    $project: {
      _id: 0,
      totalIntentos: 1,
      exitosos: 1,
      fallidos: 1,
      tasaExito: {
        $multiply: [
          { $divide: ["$exitosos", "$totalIntentos"] },
          100
        ]
      },
      montoPromedio: { $round: ["$montoPromedio", 2] }
    }
  }
])

// Intentos por categoría
db.useractivities.aggregate([
  { $unwind: "$intentosSubasta" },
  {
    $group: {
      _id: "$intentosSubasta.categoria",
      totalIntentos: { $sum: 1 },
      exitosos: {
        $sum: { $cond: ["$intentosSubasta.exitoso", 1, 0] }
      },
      montoPromedio: { $avg: "$intentosSubasta.monto" }
    }
  },
  {
    $project: {
      _id: 0,
      categoria: "$_id",
      totalIntentos: 1,
      exitosos: 1,
      tasaExito: {
        $multiply: [
          { $divide: ["$exitosos", "$totalIntentos"] },
          100
        ]
      },
      montoPromedio: { $round: ["$montoPromedio", 2] }
    }
  },
  { $sort: { totalIntentos: -1 } }
])

// Razones de fallo más comunes
db.useractivities.aggregate([
  { $unwind: "$intentosSubasta" },
  { $match: { "intentosSubasta.exitoso": false } },
  {
    $group: {
      _id: "$intentosSubasta.razonFallo",
      cantidad: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      razon: "$_id",
      cantidad: 1
    }
  },
  { $sort: { cantidad: -1 } }
])

// ═══════════════════════════════════════════════════════════════════════════
// 7. DISPOSITIVOS UTILIZADOS
// ═══════════════════════════════════════════════════════════════════════════

db.useractivities.aggregate([
  {
    $group: {
      _id: "$sesion.dispositivo",
      cantidad: { $sum: 1 },
      tiempoPromedio: { $avg: "$sesion.duracionSegundos" }
    }
  },
  {
    $project: {
      _id: 0,
      dispositivo: "$_id",
      sesiones: "$cantidad",
      tiempoPromedioMinutos: { 
        $round: [{ $divide: ["$tiempoPromedio", 60] }, 2] 
      }
    }
  },
  { $sort: { sesiones: -1 } }
])

// ═══════════════════════════════════════════════════════════════════════════
// 8. CLICKS POR TIPO
// ═══════════════════════════════════════════════════════════════════════════

db.useractivities.aggregate([
  { $unwind: "$clicks" },
  {
    $group: {
      _id: "$clicks.tipo",
      totalClicks: { $sum: 1 },
      elementos: { $addToSet: "$clicks.elemento" }
    }
  },
  {
    $project: {
      _id: 0,
      tipo: "$_id",
      totalClicks: 1,
      elementosUnicos: { $size: "$elementos" }
    }
  },
  { $sort: { totalClicks: -1 } }
])

// ═══════════════════════════════════════════════════════════════════════════
// 9. PRODUCTOS MÁS VISTOS
// ═══════════════════════════════════════════════════════════════════════════

db.useractivities.aggregate([
  { $unwind: "$productosVistos" },
  {
    $group: {
      _id: "$productosVistos.producto",
      totalVistas: { $sum: "$productosVistos.veces" },
      tiempoTotalViendo: { $sum: "$productosVistos.tiempoViendo" },
      usuariosUnicos: { $addToSet: "$usuario" }
    }
  },
  {
    $project: {
      _id: 0,
      productoId: "$_id",
      totalVistas: 1,
      tiempoPromedioSegundos: { 
        $round: [{ $divide: ["$tiempoTotalViendo", "$totalVistas"] }, 2]
      },
      usuariosUnicos: { $size: "$usuariosUnicos" }
    }
  },
  { $sort: { totalVistas: -1 } },
  { $limit: 10 }
])

// ═══════════════════════════════════════════════════════════════════════════
// 10. BÚSQUEDAS MÁS COMUNES
// ═══════════════════════════════════════════════════════════════════════════

db.useractivities.aggregate([
  { $unwind: "$busquedas" },
  {
    $group: {
      _id: "$busquedas.termino",
      cantidad: { $sum: 1 },
      resultadosPromedio: { $avg: "$busquedas.resultados" }
    }
  },
  {
    $project: {
      _id: 0,
      termino: "$_id",
      busquedas: "$cantidad",
      resultadosPromedio: { $round: ["$resultadosPromedio", 2] }
    }
  },
  { $sort: { busquedas: -1 } },
  { $limit: 20 }
])

// ═══════════════════════════════════════════════════════════════════════════
// 11. REPORTE COMPLETO DE UN USUARIO ESPECÍFICO
// ═══════════════════════════════════════════════════════════════════════════

// Reemplazar USER_ID con el ObjectId del usuario
db.useractivities.aggregate([
  { $match: { usuario: ObjectId("USER_ID") } },
  {
    $project: {
      totalSesiones: 1,
      tiempoTotal: "$sesion.duracionSegundos",
      ubicacion: {
        ciudad: "$ubicacion.ciudad",
        pais: "$ubicacion.pais"
      },
      categoriasPreferidas: {
        $slice: [
          {
            $sortArray: {
              input: "$categoriasVistas",
              sortBy: { veces: -1 }
            }
          },
          3
        ]
      },
      totalClicks: { $size: { $ifNull: ["$clicks", []] } },
      totalIntentos: { $size: { $ifNull: ["$intentosSubasta", []] } },
      intentosExitosos: {
        $size: {
          $filter: {
            input: { $ifNull: ["$intentosSubasta", []] },
            cond: { $eq: ["$$this.exitoso", true] }
          }
        }
      }
    }
  }
])

// ═══════════════════════════════════════════════════════════════════════════
// 12. ESTADÍSTICAS GENERALES DEL SISTEMA
// ═══════════════════════════════════════════════════════════════════════════

db.useractivities.aggregate([
  {
    $facet: {
      sesiones: [
        {
          $group: {
            _id: null,
            totalSesiones: { $sum: 1 },
            usuariosUnicos: { $addToSet: "$usuario" },
            tiempoPromedioSegundos: { $avg: "$sesion.duracionSegundos" }
          }
        }
      ],
      clicks: [
        {
          $project: {
            totalClicks: { $size: { $ifNull: ["$clicks", []] } }
          }
        },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: "$totalClicks" }
          }
        }
      ],
      intentos: [
        { $unwind: "$intentosSubasta" },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            exitosos: {
              $sum: { $cond: ["$intentosSubasta.exitoso", 1, 0] }
            }
          }
        }
      ]
    }
  }
])

// ═══════════════════════════════════════════════════════════════════════════
// NOTAS IMPORTANTES
// ═══════════════════════════════════════════════════════════════════════════
/*
1. Estas queries están optimizadas con los índices creados en UserActivity.js
2. Para queries por rango de fechas, agregar $match al inicio:
   { $match: { 
       "sesion.horaInicio": { 
         $gte: ISODate("2025-01-01"), 
         $lte: ISODate("2025-12-31") 
       } 
   }}
3. Para exportar resultados:
   mongoexport --db=subastas_db --collection=useractivities --out=analytics.json
4. Los resultados se pueden visualizar en herramientas como MongoDB Charts
*/

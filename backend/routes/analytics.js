const express = require('express');
const router = express.Router();
const {
  iniciarSesion,
  actualizarTiempo,
  registrarClickCategoria,
  registrarIntentoSubasta,
  obtenerResumen,
  obtenerReporteCompleto
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(protect);

// Iniciar sesión de tracking
router.post('/session/start', iniciarSesion);

// Actualizar tiempo en página
router.put('/session/:sessionId/tiempo', actualizarTiempo);

// Registrar click en categoría
router.post('/session/:sessionId/categoria', registrarClickCategoria);

// Registrar intento de subasta
router.post('/intento-subasta', registrarIntentoSubasta);

// Obtener resumen de actividad
router.get('/resumen', obtenerResumen);

// Obtener reporte completo (puede filtrar por usuario y fechas)
router.get('/reporte', obtenerReporteCompleto);

module.exports = router;

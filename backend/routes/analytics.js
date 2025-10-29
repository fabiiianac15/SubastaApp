const express = require('express');
const router = express.Router();
const {
  iniciarSesion,
  actualizarSesion,
  registrarIntentoSubasta,
  obtenerRecomendaciones,
  obtenerEstadisticas
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(protect);

// Sesión
router.post('/session/start', iniciarSesion);
router.put('/session/:sessionId', actualizarSesion);

// Intentos de subasta
router.post('/bid-attempt', registrarIntentoSubasta);

// Recomendaciones
router.get('/recommendations', obtenerRecomendaciones);

// Estadísticas
router.get('/stats', obtenerEstadisticas);

module.exports = router;

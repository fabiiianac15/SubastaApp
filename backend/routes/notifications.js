const express = require('express');
const router = express.Router();
const {
  obtenerNotificaciones,
  obtenerContadorNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(protect);

router.get('/', obtenerNotificaciones);
router.get('/contador', obtenerContadorNoLeidas);
router.patch('/:id/leer', marcarComoLeida);
router.patch('/leer-todas', marcarTodasComoLeidas);
router.delete('/:id', eliminarNotificacion);

module.exports = router;

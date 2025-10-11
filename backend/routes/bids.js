const express = require('express');
const router = express.Router();
const {
  crearOferta,
  obtenerOfertasProducto,
  obtenerMisOfertas,
  retirarOferta,
  obtenerHistorialOfertas
} = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/auth');
const { validateBid } = require('../middleware/validators');

// Rutas de ofertas por producto
router.post('/products/:productId/ofertas', protect, authorize('comprador'), validateBid, crearOferta);
router.get('/products/:productId/ofertas', obtenerOfertasProducto);
router.get('/products/:productId/historial-ofertas', protect, obtenerHistorialOfertas);

// Rutas de ofertas del usuario
router.get('/mis-ofertas', protect, authorize('comprador'), obtenerMisOfertas);
router.delete('/:id', protect, authorize('comprador'), retirarOferta);

module.exports = router;

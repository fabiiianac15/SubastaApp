const express = require('express');
const router = express.Router();
const {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
  obtenerMisSubastas,
  cambiarEstadoSubasta
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { 
  validateProductUpdate, 
  validateEstadoChange 
} = require('../middleware/validators');

// Rutas públicas
router.get('/', obtenerProductos);

// Definir rutas más específicas ANTES de las rutas con parámetros
router.get('/vendedor/mis-subastas', protect, authorize('vendedor'), obtenerMisSubastas);

// Rutas protegidas - Solo vendedores
// Se remueve validateProduct aquí, la validación se hace después de multer en el controlador
router.post('/', protect, authorize('vendedor'), crearProducto);

// Rutas públicas con parámetros
router.get('/:id', obtenerProductoPorId);
router.put('/:id', protect, authorize('vendedor'), validateProductUpdate, actualizarProducto);
router.delete('/:id', protect, authorize('vendedor'), eliminarProducto);
router.patch('/:id/estado', protect, authorize('vendedor'), validateEstadoChange, cambiarEstadoSubasta);

module.exports = router;

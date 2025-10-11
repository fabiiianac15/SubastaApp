const { body } = require('express-validator');

// Validaciones para registro de usuario
const validateUserRegistration = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .trim(),
    
  body('apellido')
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .trim(),
    
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
    
  body('telefono')
    .isMobilePhone()
    .withMessage('Debe ser un número de teléfono válido'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
    
  body('tipoUsuario')
    .isIn(['comprador', 'vendedor'])
    .withMessage('El tipo de usuario debe ser comprador o vendedor'),
    
  body('direccion.calle')
    .notEmpty()
    .withMessage('La calle es requerida')
    .trim(),
    
  body('direccion.ciudad')
    .notEmpty()
    .withMessage('La ciudad es requerida')
    .trim(),
    
  body('direccion.codigoPostal')
    .notEmpty()
    .withMessage('El código postal es requerido')
    .isPostalCode('any')
    .withMessage('Código postal inválido'),
    
  body('direccion.pais')
    .notEmpty()
    .withMessage('El país es requerido')
    .trim()
];

// Validaciones para login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Validaciones para producto/subasta
const validateProduct = [
  body('titulo')
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 5, max: 100 })
    .withMessage('El título debe tener entre 5 y 100 caracteres')
    .trim(),
    
  body('descripcion')
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ min: 10, max: 2000 })
    .withMessage('La descripción debe tener entre 10 y 2000 caracteres')
    .trim(),
    
  body('categoria')
    .isIn(['tecnologia', 'moda', 'hogar', 'deportes', 'arte', 'vehiculos', 'otros'])
    .withMessage('Categoría inválida'),
    
  body('precioInicial')
    .isFloat({ min: 1 })
    .withMessage('El precio inicial debe ser mayor a 0'),
    
  body('porcentajeMinimo')
    .isFloat({ min: 1, max: 50 })
    .withMessage('El porcentaje mínimo debe estar entre 1% y 50%'),
    
  body('fechaInicio')
    .isISO8601()
    .withMessage('Fecha de inicio inválida')
    .custom((value) => {
      const fechaInicio = new Date(value);
      const ahora = new Date();
      // Permitir fechas hasta 5 minutos en el pasado para compensar diferencias de tiempo
      const margenTiempo = 5 * 60 * 1000; // 5 minutos
      
      if (fechaInicio < new Date(ahora.getTime() - margenTiempo)) {
        throw new Error('La fecha de inicio no puede ser en el pasado');
      }
      return true;
    }),
    
  body('fechaFin')
    .isISO8601()
    .withMessage('Fecha de fin inválida')
    .custom((value, { req }) => {
      const fechaFin = new Date(value);
      const fechaInicio = new Date(req.body.fechaInicio);
      
      if (fechaFin <= fechaInicio) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      
      // Verificar que la duración mínima sea de 1 hora
      const duracionMinima = 60 * 60 * 1000; // 1 hora
      if (fechaFin - fechaInicio < duracionMinima) {
        throw new Error('La subasta debe durar al menos 1 hora');
      }
      
      return true;
    }),
    
  body('tipoSubasta')
    .isIn(['publica', 'privada'])
    .withMessage('El tipo de subasta debe ser pública o privada'),
    
  body('condiciones')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las condiciones no pueden tener más de 500 caracteres'),
    
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',').map(tag => tag.trim());
        if (tags.length > 10) {
          throw new Error('No puedes tener más de 10 etiquetas');
        }
        for (const tag of tags) {
          if (tag.length > 20) {
            throw new Error('Cada etiqueta no puede tener más de 20 caracteres');
          }
        }
      }
      return true;
    })
];

// Validaciones para ofertas
const validateBid = [
  body('monto')
    .isFloat({ min: 1 })
    .withMessage('El monto debe ser mayor a 0'),
    
  body('mensaje')
    .optional()
    .isLength({ max: 200 })
    .withMessage('El mensaje no puede tener más de 200 caracteres')
    .trim()
];

// Validaciones para actualizar producto
const validateProductUpdate = [
  body('titulo')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('El título debe tener entre 5 y 100 caracteres')
    .trim(),
    
  body('descripcion')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La descripción debe tener entre 10 y 2000 caracteres')
    .trim(),
    
  body('condiciones')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las condiciones no pueden tener más de 500 caracteres'),
    
  body('fechaFin')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida')
    .custom((value) => {
      const fechaFin = new Date(value);
      const ahora = new Date();
      
      if (fechaFin <= ahora) {
        throw new Error('La fecha de fin debe ser futura');
      }
      
      return true;
    })
];

// Validaciones para cambiar estado
const validateEstadoChange = [
  body('estado')
    .isIn(['borrador', 'activo', 'pausado', 'finalizado', 'cancelado'])
    .withMessage('Estado inválido')
];

module.exports = {
  validateUserRegistration,
  validateLogin,
  validateProduct,
  validateBid,
  validateProductUpdate,
  validateEstadoChange
};
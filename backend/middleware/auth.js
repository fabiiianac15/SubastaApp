const jwt = require('jsonwebtoken');
const User = require('../models/User');

const leerToken = (req) => {
  const header = req.headers.authorization;
  return header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;
};

const usuarioDelToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  return user && user.activo ? user : null;
};

const protect = async (req, res, next) => {
  const token = leerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado, no hay token'
    });
  }

  try {
    const user = await usuarioDelToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, la cuenta ya no existe'
      });
    }
    req.user = user;
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado, token inválido'
    });
  }

  return next();
};

// Para rutas públicas que muestran más cosas si hay sesión. Un token vencido no
// bloquea: la persona sigue viendo lo público.
const optionalAuth = async (req, res, next) => {
  const token = leerToken(req);
  if (token) {
    try {
      req.user = await usuarioDelToken(token);
    } catch (error) {
      req.user = null;
    }
  }
  next();
};

// Middleware para verificar si es vendedor
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.tipoUsuario)) {
      return res.status(403).json({
        success: false,
        message: `El tipo de usuario ${req.user.tipoUsuario} no está autorizado para acceder a esta ruta`
      });
    }
    next();
  };
};

module.exports = { protect, optionalAuth, authorize };

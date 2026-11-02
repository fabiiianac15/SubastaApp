const mongoose = require('mongoose');

// Para router.param: un id mal formado es "no encontrado", no un error del servidor.
const validarId = (req, res, next, valor) => {
  if (!mongoose.isValidObjectId(valor)) {
    return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
  }
  return next();
};

module.exports = validarId;

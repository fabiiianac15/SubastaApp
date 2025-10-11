const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateUserRegistration, validateLogin } = require('../middleware/validators');

// Rutas públicas
router.post('/register', validateUserRegistration, register);
router.post('/login', validateLogin, login);

// Rutas protegidas
router.get('/profile', protect, getProfile);

module.exports = router;

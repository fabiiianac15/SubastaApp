const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateUserRegistration, validateLogin } = require('../middleware/validators');

// Rutas públicas
router.post('/register', validateUserRegistration, register);
router.post('/login', validateLogin, login);

// Rutas protegidas
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/profile', protect, deleteAccount);

module.exports = router;

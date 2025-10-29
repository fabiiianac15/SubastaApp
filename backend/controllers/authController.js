const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Generar JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// REGISTRO: Crea una nueva cuenta validando que el email no exista

const register = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const {
      nombre,
      apellido,
      email,
      telefono,
      password,
      tipoUsuario,
      direccion
    } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe con ese email'
      });
    }

    // Crear usuario
    const user = await User.create({
      nombre,
      apellido,
      email,
      telefono,
      password,
      tipoUsuario,
      direccion
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          _id: user._id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          tipoUsuario: user.tipoUsuario,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Datos de usuario inválidos'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// LOGIN: Valida email y contraseña, devuelve token JWT

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione email y contraseña'
      });
    }

    // Verificar usuario
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        _id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        tipoUsuario: user.tipoUsuario,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

//    Obtener perfil de usuario

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// edita el perfil, actualiza datos del usuario (nombre, email, teléfono, dirección)

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Campos que se pueden actualizar
    const { nombre, apellido, telefono, direccion, email } = req.body;

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
      user.email = email;
    }

    // Actualizar campos
    if (nombre) user.nombre = nombre;
    if (apellido) user.apellido = apellido;
    if (telefono) user.telefono = telefono;
    if (direccion) {
      user.direccion = {
        calle: direccion.calle || user.direccion.calle,
        ciudad: direccion.ciudad || user.direccion.ciudad,
        codigoPostal: direccion.codigoPostal || user.direccion.codigoPostal,
        pais: direccion.pais || user.direccion.pais
      };
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        _id: updatedUser._id,
        nombre: updatedUser.nombre,
        apellido: updatedUser.apellido,
        email: updatedUser.email,
        telefono: updatedUser.telefono,
        tipoUsuario: updatedUser.tipoUsuario,
        direccion: updatedUser.direccion
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// Cambiar contraseña

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione la contraseña actual y la nueva contraseña'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// borra el perfil y elimina la cuenta del usuario y todos sus datos asociados (subastas y pujas)

const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione su contraseña para confirmar'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    // Importar modelos relacionados
    const Product = require('../models/Product');
    const Bid = require('../models/Bid');

    // Eliminar productos del usuario (si es vendedor)
    await Product.deleteMany({ vendedor: req.user._id });

    // Eliminar pujas del usuario (si es comprador)
    await Bid.deleteMany({ comprador: req.user._id });

    // Eliminar usuario completamente de la base de datos
    await User.findByIdAndDelete(req.user._id);

    res.json({
      success: true,
      message: 'Cuenta y todos los datos asociados eliminados exitosamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
};

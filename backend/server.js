const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');

// Conectar a la base de datos
connectDB();

const app = express();
// Habilitar trust proxy para que express-rate-limit maneje correctamente X-Forwarded-For
app.set('trust proxy', 1);

// Middleware de seguridad (permitir recursos cross-origin como imágenes)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - configuración más permisiva para desarrollo
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // límite de 1000 requests por windowMs (aumentado de 100)
  message: 'Demasiadas solicitudes desde esta IP, intente más tarde.'
});

app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// CORS - incluir puerto 3001 para desarrollo
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'], // Agregado puerto 3001
  credentials: true
}));

// Servir archivos estáticos (imágenes) con header CORP adecuado
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Crear directorio de uploads si no existe
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads/products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));

// Middleware para manejar rutas no encontradas
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`
  });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.log(err);

  // Error de Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = { message, statusCode: 404 };
  }

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  // Error de duplicado de Mongoose
  if (err.code === 11000) {
    const message = 'Recurso duplicado';
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error del servidor'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT} en modo ${process.env.NODE_ENV}`);
});

// Manejo de promesas no capturadas
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Cerrar servidor y salir del proceso
  server.close(() => {
    process.exit(1);
  });
});
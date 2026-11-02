const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
// Habilitar trust proxy para que express-rate-limit maneje correctamente X-Forwarded-For
app.set('trust proxy', 1);

// Permitir que el frontend, en otro origen, muestre las imágenes
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginEmbedderPolicy: false
}));

const testing = process.env.NODE_ENV === 'test';

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: () => testing,
  message: { success: false, message: 'Demasiadas solicitudes desde esta IP, intenta más tarde.' }
}));

// Más estricto donde se prueban contraseñas: frena los ataques de fuerza bruta.
const limiteAcceso = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skip: () => testing,
  message: { success: false, message: 'Demasiados intentos de acceso. Espera unos minutos.' }
});
app.use('/api/auth/login', limiteAcceso);
app.use('/api/auth/register', limiteAcceso);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(',').map((o) => o.trim()),
  credentials: true
}));

// Crear el directorio de subidas antes de servirlo
fs.mkdirSync(path.join(__dirname, 'uploads/products'), { recursive: true });

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // Las imágenes de demostración son SVG: nunca deben poder ejecutar scripts.
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ok' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));

app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`
  });
});

// Middleware global de errores
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = statusCode < 500 ? err.message : 'Error del servidor';

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Recurso no encontrado';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join('. ');
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Recurso duplicado';
  } else if (err.type === 'entity.too.large' || err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'El cuerpo de la petición no es válido';
  }

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({ success: false, message });
});

module.exports = app;

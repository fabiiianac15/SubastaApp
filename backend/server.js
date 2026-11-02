require('dotenv').config();

const connectDB = require('./config/database');
const app = require('./app');
const { iniciarRevisionPeriodica } = require('./services/auctionLifecycle');

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  console.error('Faltan JWT_SECRET o MONGODB_URI. Ejecuta "npm run setup" en la raíz del proyecto.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT} en modo ${process.env.NODE_ENV}`);
  });

  iniciarRevisionPeriodica();

  process.on('unhandledRejection', (err) => {
    console.error('Promesa rechazada sin manejar:', err);
    server.close(() => process.exit(1));
  });
});

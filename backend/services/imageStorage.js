const fs = require('fs/promises');
const path = require('path');

const CARPETA = path.join(__dirname, '../uploads/products');

// Solo borra archivos propios de uploads/products. basename evita que una ruta
// guardada en la base de datos apunte fuera de esa carpeta.
const borrarArchivo = async (url) => {
  if (typeof url !== 'string' || !url.startsWith('/uploads/products/')) return;
  try {
    await fs.unlink(path.join(CARPETA, path.basename(url)));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('No se pudo borrar la imagen:', error.message);
  }
};

const eliminarImagenes = (imagenes = []) => Promise.all(imagenes.map((i) => borrarArchivo(i.url)));

const eliminarSubidas = (files = []) =>
  Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));

module.exports = { eliminarImagenes, eliminarSubidas };

#!/usr/bin/env node
// Carga datos de demostración. Solo toca las cuentas @demo.subastapp.co y lo que
// les pertenece: nunca vacía la base de datos. Se puede ejecutar varias veces.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');
const UserActivity = require('../models/UserActivity');

if (process.env.NODE_ENV === 'production') {
  console.error('El seed no se ejecuta en producción.');
  process.exit(1);
}

const PASSWORD = 'Demo1234';
const HORA = 3600000;
const DIRECCION = { calle: 'Calle 10 # 5-20', ciudad: 'Ocaña', codigoPostal: '546551', pais: 'Colombia' };

const LOTES = [
  ['Cámara Leica M6 de 1984', 'arte', 4200000, 3, 18, 0.6, '#3b2a20', '#e8c9a0'],
  ['Bicicleta de ruta Specialized Tarmac', 'deportes', 6800000, 6, 9, 0.9, '#123a44', '#9ad7e0'],
  ['MacBook Pro 14 M3, 512 GB', 'tecnologia', 7500000, 5, 14, 5, '#26282c', '#d9dbe0'],
  ['Sillón Eames en cuero negro', 'hogar', 9800000, 5, 6, 30, '#3a1d12', '#f0b48a'],
  ['Reloj Omega Seamaster 1968', 'moda', 12500000, 3, 22, 50, '#3f3210', '#efd27a'],
  ['Moto Royal Enfield Classic 350', 'vehiculos', 14900000, 5, 4, 75, '#4a1712', '#ff9f85'],
  ['Óleo sobre lienzo, Bogotá 1972', 'arte', 3100000, 10, 2, 96, '#23301f', '#bcd6a8'],
  ['Tocadiscos Technics SL-1200', 'tecnologia', 2900000, 5, 11, 120, '#2a2140', '#c6b5f0'],
  ['Chaqueta de cuero vintage', 'moda', 480000, 10, 0, 20, '#401c1c', '#f0a6a6'],
  ['Lote de vinilos de salsa (40)', 'otros', 650000, 5, 7, 10, '#14284a', '#9dbcf0'],
];

// Lámina simple con el nombre del lote. Evita depender de fotos con derechos.
const lamina = (titulo, fondo, tinta, variante) => {
  const palabras = titulo.toUpperCase().split(' ');
  const lineas = [];
  palabras.forEach((p) => {
    const ultima = lineas[lineas.length - 1];
    if (ultima !== undefined && (ultima + ' ' + p).length <= 13) lineas[lineas.length - 1] = `${ultima} ${p}`;
    else lineas.push(p);
  });
  const texto = lineas
    .slice(0, 4)
    .map((l, i) => `<text x="64" y="${840 - (Math.min(lineas.length, 4) - 1 - i) * 128}" font-family="Impact, 'Arial Narrow', 'Liberation Sans Narrow', sans-serif" font-weight="800" font-size="116" fill="${tinta}">${l.replace(/&/g, '&amp;')}</text>`)
    .join('');
  const forma = [
    `<circle cx="840" cy="210" r="${140 + variante * 20}" fill="${tinta}" opacity=".9"/>`,
    `<rect x="${660 - variante * 40}" y="60" width="300" height="300" rx="26" fill="${tinta}" opacity=".9"/>`,
    `<path d="M1000 60 L1000 400 L660 60 Z" fill="${tinta}" opacity=".9"/>`,
  ][variante % 3];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="${fondo}"/>${forma}${texto}</svg>`;
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const carpeta = path.join(__dirname, '../uploads/demo');
  fs.mkdirSync(carpeta, { recursive: true });

  // Limpia solo lo de demostración de una ejecución anterior.
  const previos = await User.find({ email: /@demo\.subastapp\.co$/ }).select('_id');
  const ids = previos.map((u) => u._id);
  const lotesPrevios = await Product.find({ vendedor: { $in: ids } }).select('_id');
  await Bid.deleteMany({ $or: [{ postor: { $in: ids } }, { producto: { $in: lotesPrevios.map((p) => p._id) } }] });
  await Product.deleteMany({ vendedor: { $in: ids } });
  await Notification.deleteMany({ usuario: { $in: ids } });
  await UserActivity.deleteMany({ usuario: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });

  const vendedor = await User.create({ nombre: 'Valeria', apellido: 'Rincón', email: 'vendedor@demo.subastapp.co', telefono: '+573001112233', password: PASSWORD, tipoUsuario: 'vendedor', direccion: DIRECCION });
  const comprador = await User.create({ nombre: 'Camilo', apellido: 'Duarte', email: 'comprador@demo.subastapp.co', telefono: '+573004445566', password: PASSWORD, tipoUsuario: 'comprador', direccion: DIRECCION });

  const imagenes = (slug, titulo, fondo, tinta) => [0, 1, 2].map((v) => {
    const archivo = `${slug}-${v}.svg`;
    fs.writeFileSync(path.join(carpeta, archivo), lamina(titulo, fondo, tinta, v));
    return { url: `/uploads/demo/${archivo}`, alt: `${titulo}, vista ${v + 1}`, esPortada: v === 0 };
  });

  const ahora = Date.now();
  const lotes = [];
  for (const [i, [titulo, categoria, precio, pct, ofertas, horas, fondo, tinta]] of LOTES.entries()) {
    const incremento = Math.ceil((precio * pct) / 100);
    lotes.push(await Product.create({
      titulo,
      descripcion: `${titulo}. Pieza revisada, en buen estado general, con los detalles propios del uso. Se entrega en Ocaña o por envío asegurado a cargo de quien gane.`,
      categoria,
      precioInicial: precio,
      precioActual: precio + incremento * ofertas,
      porcentajeMinimo: pct,
      incrementoMinimo: incremento,
      fechaInicio: new Date(ahora - 24 * HORA),
      fechaFin: new Date(ahora + horas * HORA),
      imagenes: imagenes(`lote-${i + 1}`, titulo, fondo, tinta),
      vendedor: vendedor._id,
      estado: 'activo',
      numeroOfertas: ofertas,
      vistas: ofertas * 9 + 12,
      tags: [categoria],
    }));
  }

  const cerrada = await Product.create({
    titulo: 'Lámpara Arco de Castiglioni',
    descripcion: 'Lámpara de piso en mármol y acero. Subasta cerrada, pendiente de pago.',
    categoria: 'hogar',
    precioInicial: 2100000,
    precioActual: 3400000,
    porcentajeMinimo: 5,
    incrementoMinimo: 105000,
    fechaInicio: new Date(ahora - 96 * HORA),
    fechaFin: new Date(ahora - 5 * HORA),
    imagenes: imagenes('lote-11', 'Lámpara Arco', '#2b2b26', '#e8e6d0'),
    vendedor: vendedor._id,
    estado: 'finalizado',
    numeroOfertas: 8,
    vistas: 90,
  });

  const oferta = (producto, monto, estado) => Bid.create({ producto: producto._id, postor: comprador._id, monto, estado, esGanadora: estado === 'ganadora' });
  await oferta(lotes[0], lotes[0].precioActual, 'activa');
  await oferta(lotes[1], lotes[1].precioActual - lotes[1].incrementoMinimo, 'superada');
  await oferta(lotes[2], lotes[2].precioActual, 'activa');
  const ganada = await oferta(cerrada, 3400000, 'ganadora');
  await Product.findByIdAndUpdate(cerrada._id, { ofertaGanadora: ganada._id, ganador: comprador._id });

  await Notification.notificarPujaSuperada(comprador._id, lotes[1], lotes[1].precioActual - lotes[1].incrementoMinimo, lotes[1].precioActual);
  await Notification.notificarPujaGanadora(comprador._id, cerrada, 3400000, ganada._id);
  await Notification.notificarNuevaPuja(vendedor._id, lotes[0], lotes[0].precioActual, 'Camilo Duarte');

  console.log(`Listo: ${lotes.length + 1} lotes y 2 cuentas de demostración.`);
  console.log(`  Comprador: comprador@demo.subastapp.co / ${PASSWORD}`);
  console.log(`  Vendedor:  vendedor@demo.subastapp.co / ${PASSWORD}`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('No se pudo cargar el seed:', error.message);
  process.exit(1);
});

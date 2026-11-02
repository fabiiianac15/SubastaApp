// Pruebas de integración contra una base MongoDB real.
// Base por defecto: mongodb://127.0.0.1:27017/subastapp_test (se borra al empezar).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-de-pruebas';
process.env.JWT_EXPIRE = '1h';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const uri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/subastapp_test';
if (!/test/.test(new URL(uri).pathname)) throw new Error('La base de pruebas debe llevar "test" en el nombre');

const app = require('../app');
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const User = require('../models/User');
const Notification = require('../models/Notification');
const UserActivity = require('../models/UserActivity');
const { revisarSubastas } = require('../services/auctionLifecycle');

let server;
let base;
const H = 3600000;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const api = async (method, ruta, { token, body, form } = {}) => {
  const res = await fetch(base + ruta, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};

const registrar = async (email, tipoUsuario) => {
  const { status, json } = await api('POST', '/api/auth/register', {
    body: {
      nombre: 'Prueba', apellido: tipoUsuario, email, telefono: '+573001234567', password: 'Clave123', tipoUsuario,
      direccion: { calle: 'Calle 1', ciudad: 'Ocaña', codigoPostal: '546551', pais: 'Colombia' },
    },
  });
  assert.equal(status, 201, JSON.stringify(json));
  return json.data;
};

const lote = (vendedor, extra = {}) => Product.create({
  titulo: 'Lote de prueba',
  descripcion: 'Descripción de prueba suficientemente larga.',
  categoria: 'arte',
  precioInicial: 1000,
  precioActual: 1000,
  porcentajeMinimo: 10,
  incrementoMinimo: 100,
  fechaInicio: new Date(Date.now() - H),
  fechaFin: new Date(Date.now() + H),
  imagenes: [{ url: '/uploads/demo/x.svg', esPortada: true }],
  vendedor: vendedor._id,
  estado: 'activo',
  ...extra,
});

let V, C, C2;

before(async () => {
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
  V = await registrar('vendedor@test.co', 'vendedor');
  C = await registrar('comprador@test.co', 'comprador');
  C2 = await registrar('comprador2@test.co', 'comprador');
});

after(async () => {
  await new Promise((r) => server.close(r));
  await mongoose.disconnect();
});

test('login devuelve los datos del perfil y no distingue correo de contraseña', async () => {
  const ok = await api('POST', '/api/auth/login', { body: { email: 'comprador@test.co', password: 'Clave123' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.data.direccion.ciudad, 'Ocaña');
  assert.equal(ok.json.data.telefono, '+573001234567');

  const mala = await api('POST', '/api/auth/login', { body: { email: 'comprador@test.co', password: 'Nope1234' } });
  const nadie = await api('POST', '/api/auth/login', { body: { email: 'nadie@test.co', password: 'Nope1234' } });
  assert.equal(mala.status, 401);
  assert.deepEqual(mala.json.errors, nadie.json.errors);
});

test('editar el perfil funciona y no altera la contraseña', async () => {
  const r = await api('PUT', '/api/auth/profile', { token: C2.token, body: { nombre: 'Editado' } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.data.nombre, 'Editado');
  const login = await api('POST', '/api/auth/login', { body: { email: 'comprador2@test.co', password: 'Clave123' } });
  assert.equal(login.status, 200);
});

test('cambiar la contraseña exige la misma regla que el registro', async () => {
  const debil = await api('PUT', '/api/auth/change-password', { token: C2.token, body: { currentPassword: 'Clave123', newPassword: 'abcdef' } });
  assert.equal(debil.status, 400);
  const ok = await api('PUT', '/api/auth/change-password', { token: C2.token, body: { currentPassword: 'Clave123', newPassword: 'Nueva456' } });
  assert.equal(ok.status, 200);
  await api('PUT', '/api/auth/change-password', { token: C2.token, body: { currentPassword: 'Nueva456', newPassword: 'Clave123' } });
});

test('oferta: mínimo, dueño, notificaciones y sin datos privados', async () => {
  const p = await lote(V);
  const baja = await api('POST', `/api/bids/products/${p._id}/ofertas`, { token: C.token, body: { monto: 1050 } });
  assert.equal(baja.status, 400);

  const ok1 = await api('POST', `/api/bids/products/${p._id}/ofertas`, { token: C.token, body: { monto: 1100 } });
  assert.equal(ok1.status, 201);
  assert.equal(ok1.json.data.ip, undefined);

  const ok2 = await api('POST', `/api/bids/products/${p._id}/ofertas`, { token: C2.token, body: { monto: 1200 } });
  assert.equal(ok2.status, 201);

  assert.equal(await Notification.countDocuments({ usuario: C._id, tipo: 'puja_superada' }), 1);
  assert.equal(await Notification.countDocuments({ usuario: V._id, tipo: 'nueva_puja' }), 2);

  const publico = await api('GET', `/api/bids/products/${p._id}/ofertas?estado=todas`);
  const oferta = publico.json.data[0];
  assert.equal(oferta.postor.email, undefined);
  assert.equal(oferta.ip, undefined);
  assert.equal(oferta.userAgent, undefined);

  const detalle = await api('GET', `/api/products/${p._id}`);
  assert.equal(detalle.json.data.vendedor.email, undefined);
  assert.equal(detalle.json.data.ultimasOfertas[0].postor.email, undefined);
});

test('dos ofertas simultáneas al mismo precio: solo una gana', async () => {
  const p = await lote(V);
  const [a, b] = await Promise.all([
    api('POST', `/api/bids/products/${p._id}/ofertas`, { token: C.token, body: { monto: 1100 } }),
    api('POST', `/api/bids/products/${p._id}/ofertas`, { token: C2.token, body: { monto: 1100 } }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [201, 409]);
  assert.equal(await Bid.countDocuments({ producto: p._id }), 1);
});

test('retirar una oferta superada funciona y no se puede retirar la más alta', async () => {
  const p = await lote(V);
  const a = await api('POST', `/api/bids/products/${p._id}/ofertas`, { token: C.token, body: { monto: 1100 } });
  const b = await api('POST', `/api/bids/products/${p._id}/ofertas`, { token: C2.token, body: { monto: 1200 } });

  const ajena = await api('DELETE', `/api/bids/${b.json.data._id}`, { token: C.token });
  assert.equal(ajena.status, 403);

  const superada = await api('DELETE', `/api/bids/${a.json.data._id}`, { token: C.token });
  assert.equal(superada.status, 200, JSON.stringify(superada.json));
  assert.equal((await Product.findById(p._id)).numeroOfertas, 1);
  assert.equal((await Product.findById(p._id)).precioActual, 1200);

  const otraVez = await api('DELETE', `/api/bids/${a.json.data._id}`, { token: C.token });
  assert.equal(otraVez.status, 400);

  const alta = await api('DELETE', `/api/bids/${b.json.data._id}`, { token: C2.token });
  assert.equal(alta.status, 400);
  assert.match(alta.json.message, /más alta/);
});

test('el cierre automático adjudica, avisa y permite pagar', async () => {
  const p = await lote(V, { fechaFin: new Date(Date.now() + H) });
  const o = await api('POST', `/api/bids/products/${p._id}/ofertas`, { token: C.token, body: { monto: 1100 } });
  await Product.updateOne({ _id: p._id }, { fechaFin: new Date(Date.now() - 1000) });

  const sinOfertas = await lote(V, { fechaFin: new Date(Date.now() - 1000) });
  const programada = await lote(V, { estado: 'borrador', fechaInicio: new Date(Date.now() - 1000) });

  await revisarSubastas();

  const cerrada = await Product.findById(p._id);
  assert.equal(cerrada.estado, 'finalizado');
  assert.equal(String(cerrada.ganador), String(C._id));
  assert.equal((await Product.findById(sinOfertas._id)).estado, 'finalizado');
  assert.equal((await Product.findById(programada._id)).estado, 'activo');
  assert.ok(await Notification.findOne({ usuario: C._id, tipo: 'puja_ganadora', 'metadata.nombreSubasta': 'Lote de prueba' }));

  const ajena = await api('PATCH', `/api/bids/${o.json.data._id}/pagar`, { token: C2.token, body: { metodoPago: 'transferencia', transaccionId: 'T1' } });
  assert.equal(ajena.status, 403);

  const pago = await api('PATCH', `/api/bids/${o.json.data._id}/pagar`, { token: C.token, body: { metodoPago: 'transferencia', transaccionId: 'T1' } });
  assert.equal(pago.status, 200, JSON.stringify(pago.json));
  assert.equal(pago.json.data.pagado, true);
  assert.ok(await Notification.findOne({ usuario: V._id, tipo: 'pago_recibido' }));

  const doble = await api('PATCH', `/api/bids/${o.json.data._id}/pagar`, { token: C.token, body: { metodoPago: 'transferencia', transaccionId: 'T2' } });
  assert.equal(doble.status, 400);
});

test('finalizar a mano adjudica; cancelar avisa a los postores', async () => {
  const p = await lote(V);
  await api('POST', `/api/bids/products/${p._id}/ofertas`, { token: C.token, body: { monto: 1100 } });
  const fin = await api('PATCH', `/api/products/${p._id}/estado`, { token: V.token, body: { estado: 'finalizado' } });
  assert.equal(fin.status, 200, JSON.stringify(fin.json));
  assert.equal(fin.json.data.estado, 'finalizado');

  const q = await lote(V);
  await api('POST', `/api/bids/products/${q._id}/ofertas`, { token: C2.token, body: { monto: 1100 } });
  await api('PATCH', `/api/products/${q._id}/estado`, { token: V.token, body: { estado: 'cancelado' } });
  assert.ok(await Notification.findOne({ usuario: C2._id, tipo: 'subasta_cancelada' }));
});

test('búsqueda: los caracteres especiales son literales y las privadas no se filtran', async () => {
  await lote(V, { titulo: 'Cámara (rara) única' });
  const privada = await lote(V, { titulo: 'Secreto privado', tipoSubasta: 'privada', usuariosInvitados: [C._id] });

  const parentesis = await api('GET', `/api/products?busqueda=${encodeURIComponent('(rara')}`);
  assert.equal(parentesis.status, 200);
  assert.equal(parentesis.json.data.length, 1);

  const inyeccion = await api('GET', '/api/products?categoria[$ne]=arte');
  assert.equal(inyeccion.status, 200);

  const anonimo = await api('GET', '/api/products?busqueda=Secreto');
  assert.equal(anonimo.json.data.length, 0);
  const ajeno = await api('GET', '/api/products?busqueda=Secreto', { token: C2.token });
  assert.equal(ajeno.json.data.length, 0);
  const invitado = await api('GET', '/api/products?busqueda=Secreto', { token: C.token });
  assert.equal(invitado.json.data.length, 1);

  assert.equal((await api('GET', `/api/products/${privada._id}`)).status, 403);
  assert.equal((await api('GET', `/api/products/${privada._id}`, { token: C.token })).status, 200);
  assert.equal((await api('GET', `/api/bids/products/${privada._id}/ofertas`)).status, 403);
});

test('los borradores de otros no aparecen en el listado', async () => {
  await lote(V, { titulo: 'Borrador oculto', estado: 'borrador', fechaInicio: new Date(Date.now() + H), fechaFin: new Date(Date.now() + 2 * H) });
  for (const estado of ['todas', 'borrador']) {
    const r = await api('GET', `/api/products?estado=${estado}&busqueda=Borrador`, { token: C.token });
    assert.equal(r.json.data.length, 0, estado);
  }
  const propio = await api('GET', '/api/products?estado=borrador&busqueda=Borrador', { token: V.token });
  assert.equal(propio.json.data.length, 1);
});

test('crear subasta valida en el servidor y un id inválido da 404', async () => {
  const sinFoto = new FormData();
  Object.entries({ titulo: 'Título válido', descripcion: 'Descripción bastante larga', categoria: 'arte', precioInicial: '100', porcentajeMinimo: '5', tipoSubasta: 'publica', fechaInicio: new Date().toISOString(), fechaFin: new Date(Date.now() + 2 * H).toISOString() }).forEach(([k, v]) => sinFoto.append(k, v));
  assert.equal((await api('POST', '/api/products', { token: V.token, form: sinFoto })).status, 400);

  const conFoto = new FormData();
  Object.entries({ titulo: 'Título válido', descripcion: 'Descripción bastante larga', categoria: 'arte', precioInicial: '100', porcentajeMinimo: '5', tipoSubasta: 'publica', fechaInicio: new Date().toISOString(), fechaFin: new Date(Date.now() + 2 * H).toISOString() }).forEach(([k, v]) => conFoto.append(k, v));
  conFoto.append('imagenes', new Blob([PNG], { type: 'image/png' }), 'a.png');
  const creada = await api('POST', '/api/products', { token: V.token, form: conFoto });
  assert.equal(creada.status, 201, JSON.stringify(creada.json));
  assert.equal(creada.json.data.estado, 'activo');

  const editar = new FormData();
  editar.append('precioInicial', '500');
  const editada = await api('PUT', `/api/products/${creada.json.data._id}`, { token: V.token, form: editar });
  assert.equal(editada.json.data.precioActual, 500);
  assert.equal(editada.json.data.incrementoMinimo, 25);

  const borrada = await api('DELETE', `/api/products/${creada.json.data._id}`, { token: V.token });
  assert.equal(borrada.status, 200);

  const mala = new FormData();
  mala.append('titulo', 'x');
  assert.equal((await api('POST', '/api/products', { token: C.token, form: mala })).status, 403);

  assert.equal((await api('GET', '/api/products/no-es-un-id')).status, 404);
});

test('analítica: sesión sin ubicación, y solo el dueño toca su sesión', async () => {
  const s = await api('POST', '/api/analytics/session/start', { token: C.token, body: {} });
  assert.equal(s.status, 201, JSON.stringify(s.json));
  const id = s.json.data.sessionId;

  assert.equal((await api('PUT', `/api/analytics/session/${id}/tiempo`, { token: C2.token })).status, 404);
  assert.equal((await api('PUT', `/api/analytics/session/${id}/tiempo`, { token: C.token })).status, 200);
  assert.equal((await api('POST', `/api/analytics/session/${id}/categoria`, { token: C.token, body: { categoria: 'arte' } })).status, 200);

  const intento = await api('POST', '/api/analytics/intento-subasta', { token: C.token, body: { sessionId: id, productoId: 'nuevo', tituloProducto: 'x', categoria: 'arte', precioInicial: 10, exitoso: false, razonFallo: 'prueba' } });
  assert.equal(intento.status, 200, JSON.stringify(intento.json));

  const resumen = await api('GET', '/api/analytics/resumen', { token: C.token });
  assert.equal(resumen.json.data.categoriasClickeadas.arte, 1);

  const reporte = await api('GET', `/api/analytics/reporte?userId=${C2._id}`, { token: C.token });
  assert.equal(reporte.json.data?.usuariosUnicos, 1);
});

test('eliminar la cuenta limpia sus datos y repone el precio de otras subastas', async () => {
  const quien = await registrar('adios@test.co', 'comprador');
  const p = await lote(V);
  await api('POST', `/api/bids/products/${p._id}/ofertas`, { token: C.token, body: { monto: 1100 } });
  await api('POST', `/api/bids/products/${p._id}/ofertas`, { token: quien.token, body: { monto: 1200 } });

  const r = await api('DELETE', '/api/auth/profile', { token: quien.token, body: { password: 'Clave123' } });
  assert.equal(r.status, 200, JSON.stringify(r.json));

  const queda = await Product.findById(p._id);
  assert.equal(queda.precioActual, 1100);
  assert.equal(queda.numeroOfertas, 1);
  assert.equal((await Bid.findOne({ producto: p._id })).estado, 'activa');
  assert.equal(await User.countDocuments({ email: 'adios@test.co' }), 0);
  assert.equal(await UserActivity.countDocuments({ usuario: quien._id }), 0);

  const tokenViejo = await api('GET', '/api/auth/profile', { token: quien.token });
  assert.equal(tokenViejo.status, 401);
});

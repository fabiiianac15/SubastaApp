// Ciclo de vida de una subasta: abrir, adjudicar y cancelar.
// El cambio de estado es atómico (findOneAndUpdate filtrando por el estado
// anterior) para que dos procesos no adjudiquen la misma subasta dos veces.
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');
const { idDe } = require('../utils/ids');

// Un aviso fallido no debe deshacer una adjudicación ya hecha.
const avisar = (promesa) => promesa.catch((e) => console.error('No se pudo notificar:', e.message));

const adjudicar = async (productoId, estadoAnterior = 'activo') => {
  const producto = await Product.findOneAndUpdate(
    { _id: productoId, estado: estadoAnterior },
    { estado: 'finalizado' },
    { new: true }
  );
  if (!producto) return null;

  const ganadora = await Bid.findOne({ producto: producto._id, estado: 'activa' }).sort({ monto: -1 });

  if (ganadora) {
    ganadora.estado = 'ganadora';
    ganadora.esGanadora = true;
    await ganadora.save();

    producto.ofertaGanadora = ganadora._id;
    producto.ganador = idDe(ganadora.postor);
    await producto.save();

    await avisar(Notification.notificarPujaGanadora(idDe(ganadora.postor), producto, ganadora.monto, ganadora._id));
  }

  await avisar(Notification.notificarSubastaFinalizada(idDe(producto.vendedor), producto, ganadora ? ganadora.monto : null));
  return producto;
};

const cancelar = async (productoId, estadoAnterior) => {
  const producto = await Product.findOneAndUpdate(
    { _id: productoId, estado: estadoAnterior },
    { estado: 'cancelado' },
    { new: true }
  );
  if (!producto) return null;

  const postores = await Bid.distinct('postor', { producto: producto._id, estado: { $in: ['activa', 'superada'] } });
  await Promise.all(postores.map((id) => avisar(Notification.notificarSubastaCancelada(id, producto))));
  return producto;
};

// Una pasada: abre los borradores cuya hora llegó y adjudica las vencidas.
const revisarSubastas = async (ahora = new Date()) => {
  const abiertas = await Product.updateMany(
    { estado: 'borrador', fechaInicio: { $lte: ahora }, fechaFin: { $gt: ahora } },
    { estado: 'activo' }
  );

  const vencidas = await Product.find({ estado: 'activo', fechaFin: { $lte: ahora } }).select('_id');
  await Promise.all(vencidas.map((p) => adjudicar(p._id)));

  return { abiertas: abiertas.modifiedCount, adjudicadas: vencidas.length };
};

const iniciarRevisionPeriodica = () => {
  const cada = Number(process.env.AUCTION_SWEEP_MS) || 30000;
  const pasada = () => revisarSubastas().catch((e) => console.error('Error revisando subastas:', e.message));
  pasada();
  const timer = setInterval(pasada, cada);
  timer.unref();
  return timer;
};

module.exports = { adjudicar, cancelar, revisarSubastas, iniciarRevisionPeriodica };

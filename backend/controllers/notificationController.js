const Notification = require('../models/Notification');

// Obtener notificaciones del usuario (paginadas)
const obtenerNotificaciones = async (req, res) => {
  try {
    const { pagina = 1, limite = 20 } = req.query;
    const skip = (pagina - 1) * limite;

    const query = { usuario: req.user._id };

    const [notificaciones, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limite)),
      Notification.countDocuments(query)
    ]);

    const totalPaginas = Math.ceil(total / limite);

    res.json({
      success: true,
      data: notificaciones,
      pagination: {
        paginaActual: Number(pagina),
        totalPaginas,
        total,
        limite: Number(limite)
      }
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

// Obtener contador de no leídas
const obtenerContadorNoLeidas = async (req, res) => {
  try {
    const contador = await Notification.countDocuments({ usuario: req.user._id, leida: false });
    res.json({ success: true, data: { contador } });
  } catch (error) {
    console.error('Error contando notificaciones:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

// Marcar una notificación como leída
const marcarComoLeida = async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, usuario: req.user._id });
    if (!notif) return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    notif.leida = true;
    await notif.save();
    res.json({ success: true, data: notif });
  } catch (error) {
    console.error('Error marcando notificación:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

// Marcar todas como leídas
const marcarTodasComoLeidas = async (req, res) => {
  try {
    await Notification.updateMany({ usuario: req.user._id, leida: false }, { $set: { leida: true } });
    res.json({ success: true, message: 'Notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error marcando todas las notificaciones:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

// Eliminar notificación
const eliminarNotificacion = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, usuario: req.user._id });
    if (!notif) return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    res.json({ success: true, message: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

module.exports = {
  obtenerNotificaciones,
  obtenerContadorNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaBell, FaCreditCard, FaFire, FaGavel, FaHourglassEnd, FaRegComment, FaStar, FaTimes, FaTimesCircle, FaTrash, FaTrophy, FaCheck, FaMoneyBillWave } from 'react-icons/fa';
import notificationService from '../../services/notificationService';
import { dur, ease } from '../../lib/motion';

const ICONS = {
  puja_superada: [FaBell, 'warn'],
  puja_ganadora: [FaTrophy, 'accent'],
  subasta_finalizada: [FaHourglassEnd, 'info'],
  nueva_puja: [FaMoneyBillWave, 'win'],
  subasta_cancelada: [FaTimesCircle, 'danger'],
  recordatorio_pago: [FaCreditCard, 'warn'],
  pago_recibido: [FaCheck, 'win'],
  mensaje_vendedor: [FaRegComment, 'info'],
  favorito_pronto: [FaStar, 'warn'],
  favorito_activo: [FaFire, 'accent'],
};

// Fila deslizable: al soltar más allá del umbral (o con impulso) se elimina.
const Item = ({ n, index, onOpen, onDelete }) => {
  const [Icon, tone] = ICONS[n.tipo] || [FaGavel, ''];
  // Soltar tras arrastrar también genera un clic: no debe abrir la notificación.
  const dragged = useRef(false);
  return (
    <motion.li
      layout="position"
      className="notif__row"
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80, transition: { duration: dur.exit } }}
      transition={{ duration: dur.ui, ease: ease.out, delay: Math.min(index, 6) * 0.04 }}
    >
      <span className="notif__under" aria-hidden="true"><FaTrash size={14} /></span>
      <motion.div
        className={`notif__item ${n.leida ? '' : 'is-unread'}`}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.8 }}
        dragSnapToOrigin
        onDragStart={() => { dragged.current = true; }}
        onDragEnd={(_, info) => {
          setTimeout(() => { dragged.current = false; }, 0);
          if (info.offset.x > 110 || info.velocity.x > 600) onDelete(n._id);
        }}
      >
        <button type="button" className="notif__main" onClick={() => { if (!dragged.current) onOpen(n); }}>
          <span className={`notif__icon pill ${tone ? `pill--${tone}` : ''}`}><Icon size={14} /></span>
          <span className="notif__text">
            <span className="notif__title"><strong>{n.titulo}</strong><small className="tnum">{notificationService.formatearTiempoRelativo(n.createdAt)}</small></span>
            <span className="notif__msg">{n.mensaje}</span>
            {n.metadata?.nombreSubasta && <span className="notif__lot">{n.metadata.nombreSubasta}</span>}
          </span>
        </button>
        <button type="button" className="icon-btn notif__del" aria-label={`Eliminar: ${n.titulo}`} onClick={() => onDelete(n._id)}><FaTrash size={13} /></button>
      </motion.div>
    </motion.li>
  );
};

const NotificationPanel = ({ open, onClose, onNotificationClick, onCountChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const refreshCount = useCallback(async () => {
    const res = await notificationService.obtenerContadorNoLeidas();
    onCountChange?.(res.data?.contador || 0);
  }, [onCountChange]);

  const load = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      setError(false);
      const res = await notificationService.obtenerNotificaciones({ pagina: p, limite: 20 });
      setNotifications((prev) => (p === 1 ? res.data || [] : [...prev, ...(res.data || [])]));
      setHasMore(res.pagination ? res.pagination.paginaActual < res.pagination.totalPaginas : false);
      await refreshCount();
    } catch (err) {
      console.error('Error cargando notificaciones', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    if (open) {
      setPage(1);
      load(1);
    }
  }, [open, load]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleOpen = async (n) => {
    try {
      if (!n.leida) await notificationService.marcarComoLeida(n._id);
      onNotificationClick?.(n);
      await refreshCount();
    } catch (err) {
      console.error('Error marcando notificación', err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.marcarTodasComoLeidas();
      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
      onCountChange?.(0);
    } catch (err) {
      console.error('Error marcando todas como leídas', err);
    }
  };

  const handleDelete = async (id) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((x) => x._id !== id));
    try {
      await notificationService.eliminarNotificacion(id);
      await refreshCount();
    } catch (err) {
      console.error('Error eliminando notificación', err);
      setNotifications(previous);
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="notif-root" key="notif">
          <motion.div className="dialog-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: dur.exit } }} />
          <motion.aside
            className="notif"
            role="dialog"
            aria-label="Notificaciones"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%', transition: { duration: 0.2, ease: ease.out } }}
            transition={{ duration: 0.38, ease: ease.drawer }}
          >
            <div className="notif__head">
              <h2 className="display">Notificaciones</h2>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar notificaciones"><FaTimes size={16} /></button>
            </div>
            {notifications.some((n) => !n.leida) && (
              <button type="button" className="btn btn--ghost btn--sm notif__all" onClick={handleMarkAll}><FaCheck size={12} /> Marcar todas como leídas</button>
            )}
            <div className="notif__body">
              {loading && notifications.length === 0 ? (
                <div className="notif__loading" aria-hidden="true">
                  {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 76 }} />)}
                </div>
              ) : error ? (
                <div className="notif__empty">
                  <p>No pudimos cargar las notificaciones.</p>
                  <button type="button" className="btn btn--sm" onClick={() => load(1)}>Reintentar</button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notif__empty"><FaBell size={28} /><p>Nada por ahora. Aquí verás cuando te superen o ganes.</p></div>
              ) : (
                <ul>
                  <AnimatePresence initial={true} mode="popLayout">
                    {notifications.map((n, i) => <Item key={n._id} n={n} index={i} onOpen={handleOpen} onDelete={handleDelete} />)}
                  </AnimatePresence>
                </ul>
              )}
              {hasMore && (
                <button type="button" className="btn btn--block" disabled={loading} onClick={() => { const next = page + 1; setPage(next); load(next); }}>Cargar más</button>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default NotificationPanel;

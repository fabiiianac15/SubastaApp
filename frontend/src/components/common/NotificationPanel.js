import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTrash, FaBell } from 'react-icons/fa';
import notificationService from '../../services/notificationService';
import './NotificationPanel.css';

const NotificationPanel = ({ open, onClose, onNotificationClick, onCountChange }) => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = await notificationService.obtenerNotificaciones({ pagina: p, limite: 20 });
      if (p === 1) setNotifications(res.data || []);
      else setNotifications(prev => [...prev, ...(res.data || [])]);
      setHasMore(res.pagination ? res.pagination.paginaActual < res.pagination.totalPaginas : false);
      if (onCountChange) {
        const contadorRes = await notificationService.obtenerContadorNoLeidas();
        onCountChange(contadorRes.data?.contador || 0);
      }
    } catch (err) {
      console.error('Error cargando notificaciones', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      load(1);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClickNotification = async (n) => {
    try {
      if (!n.leida) await notificationService.marcarComoLeida(n._id);
      if (onNotificationClick) onNotificationClick(n);
      load(1);
      if (onCountChange) {
        const contadorRes = await notificationService.obtenerContadorNoLeidas();
        onCountChange(contadorRes.data?.contador || 0);
      }
    } catch (err) {
      console.error('Error marcando notificación', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.marcarTodasComoLeidas();
      load(1);
      if (onCountChange) onCountChange(0);
    } catch (err) {
      console.error('Error marcando todas como leídas', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.eliminarNotificacion(id);
      setNotifications(prev => prev.filter(x => x._id !== id));
      if (onCountChange) {
        const contadorRes = await notificationService.obtenerContadorNoLeidas();
        onCountChange(contadorRes.data?.contador || 0);
      }
    } catch (err) {
      console.error('Error eliminando notificación', err);
    }
  };

  const loadMore = () => {
    if (!hasMore) return;
    const next = page + 1;
    load(next);
    setPage(next);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="notif-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="notif-panel" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>
            <div className="notif-header">
              <div className="notif-title"><FaBell/> Notificaciones</div>
              <div className="notif-actions">
                <button className="mark-all" onClick={handleMarkAllRead}>Marcar todas leídas</button>
                <button className="close-btn" onClick={onClose}><FaTimes/></button>
              </div>
            </div>

            <div className="notif-body">
              {loading && notifications.length === 0 ? (
                <div className="notif-empty">Cargando...</div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty">No hay notificaciones</div>
              ) : (
                <ul className="notif-list">
                  {notifications.map(n => (
                    <li key={n._id} className={`notif-item ${n.leida ? 'read' : 'unread'}`} onClick={()=> handleClickNotification(n)}>
                      <div className="notif-left">
                        <div className="notif-icon" style={{ background: notificationService.obtenerColorNotificacion(n.tipo) }}>{notificationService.obtenerIconoNotificacion(n.tipo)}</div>
                      </div>
                      <div className="notif-content">
                        <div className="notif-title-row">
                          <strong>{n.titulo}</strong>
                          <small className="notif-time">{notificationService.formatearTiempoRelativo(n.createdAt)}</small>
                        </div>
                        <div className="notif-message">{n.mensaje}</div>
                        {n.metadata?.nombreSubasta && (
                          <div className="notif-meta">{n.metadata.nombreSubasta}</div>
                        )}
                      </div>
                      <div className="notif-right">
                        <button className="trash" onClick={(e)=>{ e.stopPropagation(); handleDelete(n._id); }}><FaTrash/></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="notif-footer">
              {hasMore && <button className="load-more" onClick={loadMore}>Cargar más</button>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;

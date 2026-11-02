import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaEdit, FaEye, FaGavel, FaPause, FaPlay, FaPlus, FaStop, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import productService from '../../services/productService';
import CreateAuctionModal from '../../components/auctions/CreateAuctionModal';
import AuctionDetailModal from '../../components/auctions/AuctionDetailModal';
import { Chips, StatusPill, estadoSubasta } from '../../components/ui/Controls';
import CountUp from '../../components/ui/CountUp';
import { Countdown } from '../../components/ui/Countdown';
import { coverOf } from '../../lib/media';
import { dur, ease } from '../../lib/motion';

const money = (n) => productService.formatearMoneda(n || 0);
const ESTADOS = [
  { value: 'todas', label: 'Todas' },
  { value: 'activo', label: 'Activas' },
  { value: 'borrador', label: 'Borradores' },
  { value: 'pausado', label: 'Pausadas' },
  { value: 'finalizado', label: 'Finalizadas' },
  { value: 'cancelado', label: 'Canceladas' },
];
const ACCIONES = {
  borrador: [{ icon: FaPlay, label: 'Activar', to: 'activo' }],
  activo: [{ icon: FaPause, label: 'Pausar', to: 'pausado' }, { icon: FaStop, label: 'Finalizar', to: 'finalizado' }],
  pausado: [{ icon: FaPlay, label: 'Reanudar', to: 'activo' }],
};

const MyAuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ estado: 'todas', ordenar: '-createdAt' });
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await productService.obtenerMisSubastas({ ...filters, limite: 100 });
      setAuctions(res.data || []);
      setEstadisticas(res.estadisticas || []);
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar tus subastas.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // Las estadísticas vienen del servidor: no cambian al filtrar la lista.
  const stats = useMemo(() => {
    const by = Object.fromEntries((estadisticas || []).map((s) => [s._id, s]));
    return {
      total: (estadisticas || []).reduce((n, s) => n + s.count, 0),
      activas: by.activo?.count || 0,
      vendido: by.finalizado?.totalVentas || 0,
    };
  }, [estadisticas]);

  const changeStatus = async (a, estado) => {
    if (estado === 'finalizado') {
      const c = await Swal.fire({ title: '¿Finalizar ahora?', text: 'La oferta más alta quedará como ganadora.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Finalizar', cancelButtonText: 'Seguir abierta', focusCancel: true });
      if (!c.isConfirmed) return;
    }
    try {
      setBusy(a._id);
      await productService.cambiarEstadoSubasta(a._id, estado);
      await load();
    } catch (e) {
      Swal.fire('No se pudo cambiar el estado', e.message || 'Inténtalo de nuevo.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (a) => {
    const conOfertas = a.numeroOfertas > 0;
    const c = await Swal.fire({
      title: conOfertas ? 'Esta subasta tiene ofertas' : '¿Eliminar subasta?',
      text: conOfertas ? `Se borrarán también sus ${a.numeroOfertas} ofertas. No se puede deshacer.` : 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: conOfertas ? 'Sí, eliminar todo' : 'Eliminar',
      cancelButtonText: 'Conservar',
      focusCancel: true,
    });
    if (!c.isConfirmed) return;
    if (conOfertas) {
      const again = await Swal.fire({ title: '¿Seguro?', text: 'Última confirmación: los postores perderán sus ofertas.', icon: 'error', showCancelButton: true, confirmButtonText: 'Eliminar definitivamente', cancelButtonText: 'No, conservar', focusCancel: true });
      if (!again.isConfirmed) return;
    }
    try {
      await productService.eliminarSubasta(a._id, conOfertas);
      setAuctions((p) => p.filter((x) => x._id !== a._id));
      await load();
    } catch (e) {
      Swal.fire('No se pudo eliminar', e.message || 'Inténtalo de nuevo.', 'error');
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="display">Mis subastas</h1>
        <Link className="btn btn--primary btn--lg" to="/dashboard/create"><FaPlus size={14} /> Nueva subasta</Link>
      </header>

      <div className="metrics">
        <div className="metric metric--accent"><CountUp value={stats.activas} className="metric__value" /><span className="metric__label">Activas</span></div>
        <div className="metric"><CountUp value={stats.total} className="metric__value" /><span className="metric__label">Publicadas en total</span></div>
        <div className="metric"><CountUp value={stats.vendido} format={money} className="metric__value" /><span className="metric__label">Valor de las finalizadas</span></div>
      </div>

      <div className="explore__filters">
        <Chips id="my-state" label="Estado" value={filters.estado} onChange={(v) => setFilters((f) => ({ ...f, estado: v }))} options={ESTADOS} />
        <div className="toolbar">
          <div className="toolbar__spacer" />
          <select className="select" aria-label="Ordenar" value={filters.ordenar} onChange={(e) => setFilters((f) => ({ ...f, ordenar: e.target.value }))}>
            <option value="-createdAt">Más recientes</option>
            <option value="createdAt">Más antiguas</option>
            <option value="-numeroOfertas">Más ofertas</option>
            <option value="-precioActual">Mayor precio</option>
            <option value="fechaFin">Cierran antes</option>
          </select>
        </div>
      </div>

      {error && <p className="alert alert--error" role="alert">{error}</p>}

      {loading && auctions.length === 0 ? (
        <div className="rows" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 112 }} />)}</div>
      ) : auctions.length === 0 ? (
        <div className="empty">
          <FaGavel size={36} className="empty__art" />
          <h2 className="display">{filters.estado === 'todas' ? 'Aún no has publicado' : 'Nada en este estado'}</h2>
          {filters.estado === 'todas' && (<><p>Sube fotos, define el precio de salida y abre tu primera subasta.</p><Link className="btn btn--primary" to="/dashboard/create"><FaPlus size={13} /> Crear subasta</Link></>)}
        </div>
      ) : (
        <ul className={`rows ${loading ? 'is-stale' : ''}`}>
          <AnimatePresence mode="popLayout" initial={true}>
            {auctions.map((a, i) => (
              <motion.li
                key={a._id}
                layout="position"
                className="row"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: dur.exit } }}
                transition={{ duration: 0.36, ease: ease.out, delay: Math.min(i, 8) * 0.04 }}
              >
                <button type="button" className="row__media" onClick={() => setSelected(a)} aria-label={`Abrir ${a.titulo}`}>
                  {coverOf(a) ? <img src={coverOf(a)} alt="" /> : <FaGavel size={22} />}
                </button>
                <div className="row__main">
                  <h2 className="row__title">{a.titulo}</h2>
                  <p className="row__sub muted tnum">
                    {a.numeroOfertas || 0} {a.numeroOfertas === 1 ? 'oferta' : 'ofertas'} · {a.vistas || 0} vistas
                    {a.estado === 'activo' && <> · Cierra en <Countdown end={a.fechaFin} /></>}
                  </p>
                  <StatusPill map={estadoSubasta} value={a.estado} />
                </div>
                <dl className="row__nums tnum">
                  <div><dt>Precio actual</dt><dd className="display">{money(a.precioActual ?? a.precioInicial)}</dd></div>
                </dl>
                <div className="row__icons">
                  <button type="button" className="icon-btn" onClick={() => setSelected(a)} aria-label={`Ver ${a.titulo}`} title="Ver ficha"><FaEye size={15} /></button>
                  <button type="button" className="icon-btn" onClick={() => setEditing(a)} aria-label={`Editar ${a.titulo}`} title="Editar"><FaEdit size={15} /></button>
                  {(ACCIONES[a.estado] || []).map((act) => (
                    <button key={act.to} type="button" className="icon-btn" disabled={busy === a._id} onClick={() => changeStatus(a, act.to)} aria-label={`${act.label} ${a.titulo}`} title={act.label}><act.icon size={14} /></button>
                  ))}
                  <button type="button" className="icon-btn icon-btn--danger" onClick={() => handleDelete(a)} aria-label={`Eliminar ${a.titulo}`} title="Eliminar"><FaTrash size={14} /></button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <CreateAuctionModal isOpen={!!editing} onClose={() => setEditing(null)} auction={editing} onSuccess={load} />
      <AuctionDetailModal open={!!selected} auction={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default MyAuctionsPage;

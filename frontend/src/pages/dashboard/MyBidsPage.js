import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaCreditCard, FaGavel, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import productService from '../../services/productService';
import AuctionDetailModal from '../../components/auctions/AuctionDetailModal';
import PaymentModal from '../../components/payment/PaymentModal';
import { Chips, StatusPill, estadoOferta } from '../../components/ui/Controls';
import CountUp from '../../components/ui/CountUp';
import { Countdown } from '../../components/ui/Countdown';
import { coverOf } from '../../lib/media';
import { dur, ease } from '../../lib/motion';

const money = (n) => productService.formatearMoneda(n || 0);
const ESTADOS = [
  { value: 'todas', label: 'Todas' },
  { value: 'activa', label: 'Ganando' },
  { value: 'superada', label: 'Superadas' },
  { value: 'ganadora', label: 'Ganadas' },
  { value: 'retirada', label: 'Retiradas' },
];
// El modelo de ofertas solo acepta estos métodos de pago.
const METODO = { tarjeta: 'tarjeta_credito', pse: 'transferencia' };

const MyBidsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bids, setBids] = useState([]);
  const [estado, setEstado] = useState('todas');
  const [ordenar, setOrdenar] = useState('-createdAt');
  const [pagina, setPagina] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [estadisticas, setEstadisticas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [wonBid, setWonBid] = useState(null);
  const [query, setQuery] = useState('');
  const esComprador = user?.tipoUsuario === 'comprador';

  const stats = useMemo(() => {
    const m = { activa: 0, superada: 0, ganadora: 0 };
    (estadisticas || []).forEach((s) => { m[s._id] = s.count; });
    return m;
  }, [estadisticas]);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await productService.obtenerMisOfertas({ estado, pagina, limite: 10, ordenar });
      setBids(res.data || []);
      setPagination(res.pagination || null);
      setEstadisticas(res.estadisticas || []);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar tus pujas.');
    } finally {
      setLoading(false);
    }
  }, [estado, pagina, ordenar]);

  useEffect(() => { if (esComprador) cargar(); }, [esComprador, cargar]);

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? bids.filter((b) => (b.producto?.titulo || '').toLowerCase().includes(q)) : bids;
  }, [bids, query]);

  const openProduct = async (id) => {
    try {
      const res = await productService.obtenerSubastaPorId(id);
      setSelected(res.data);
    } catch (err) {
      setError(err?.message || 'No se pudo abrir la subasta.');
    }
  };

  const retirar = async (bid) => {
    const c = await Swal.fire({ title: '¿Retirar oferta?', text: `Retirarás tu oferta de ${money(bid.monto)}.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Retirar', cancelButtonText: 'Conservar', focusCancel: true });
    if (!c.isConfirmed) return;
    try {
      await productService.retirarOferta(bid._id);
      await cargar();
    } catch (err) {
      Swal.fire('No se pudo retirar', err?.message || 'Inténtalo de nuevo.', 'error');
    }
  };

  const onPaid = async (payment) => {
    try {
      await productService.pagarOfertaGanadora(wonBid._id, { metodoPago: METODO[payment.metodo], transaccionId: payment.transaccionId });
      setWonBid(null);
      await cargar();
    } catch (err) {
      setWonBid(null);
      Swal.fire('No se pudo registrar el pago', err?.message || 'Inténtalo de nuevo.', 'error');
    }
  };

  if (!esComprador) {
    return (
      <div className="page">
        <header className="page-head"><h1 className="display">Mis pujas</h1></header>
        <div className="empty"><FaGavel size={36} className="empty__art" /><h2 className="display">Solo para compradores</h2><p>Con una cuenta de comprador verás aquí tus ofertas.</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head"><h1 className="display">Mis pujas</h1></header>

      <div className="metrics">
        <div className="metric metric--accent"><CountUp value={stats.ganadora} className="metric__value" /><span className="metric__label">Ganadas</span></div>
        <div className="metric"><CountUp value={stats.activa} className="metric__value" /><span className="metric__label">Vas ganando</span></div>
        <div className="metric"><CountUp value={stats.superada} className="metric__value" /><span className="metric__label">Te superaron</span></div>
      </div>

      <div className="explore__filters">
        <Chips id="bid-state" label="Estado" value={estado} onChange={(v) => { setPagina(1); setEstado(v); }} options={ESTADOS} />
        <div className="toolbar">
          <div className="input-wrap explore__search">
            <FaSearch size={14} />
            <input className="input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en esta página" aria-label="Buscar por título" />
          </div>
          <select className="select" aria-label="Ordenar" value={ordenar} onChange={(e) => { setPagina(1); setOrdenar(e.target.value); }}>
            <option value="-createdAt">Más recientes</option>
            <option value="createdAt">Más antiguas</option>
            <option value="-monto">Monto mayor</option>
            <option value="monto">Monto menor</option>
          </select>
        </div>
      </div>

      {error && <p className="alert alert--error" role="alert">{error}</p>}

      {loading && bids.length === 0 ? (
        <div className="rows" aria-hidden="true">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 112 }} />)}</div>
      ) : visibles.length === 0 ? (
        <div className="empty">
          <FaGavel size={36} className="empty__art" />
          <h2 className="display">Sin pujas aquí</h2>
          <p>{estado === 'todas' && !query ? 'Tu primera oferta aparecerá en esta lista.' : 'Prueba con otro filtro.'}</p>
          {estado === 'todas' && !query && <Link to="/dashboard/auctions" className="btn btn--primary">Explorar subastas</Link>}
        </div>
      ) : (
        <ul className={`rows ${loading ? 'is-stale' : ''}`}>
          <AnimatePresence mode="popLayout" initial={true}>
            {visibles.map((of, i) => {
              const p = of.producto || {};
              const cover = coverOf(p);
              const lidera = of.estado === 'activa' && (p.precioActual || 0) === (of.monto || 0);
              const ganada = of.estado === 'ganadora';
              return (
                <motion.li
                  key={of._id}
                  layout="position"
                  className={`row ${ganada && !of.pagado ? 'row--won' : ''}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: dur.exit } }}
                  transition={{ duration: 0.36, ease: ease.out, delay: Math.min(i, 8) * 0.04 }}
                >
                  <button type="button" className="row__media" onClick={() => openProduct(p._id)} aria-label={`Abrir ${p.titulo || 'subasta'}`}>
                    {cover ? <img src={cover} alt="" /> : <FaGavel size={22} />}
                  </button>
                  <div className="row__main">
                    <h2 className="row__title">{p.titulo || 'Subasta'}</h2>
                    <p className="row__sub muted tnum">
                      {p.estado === 'activo' && p.fechaFin ? <>Cierra en <Countdown end={p.fechaFin} /></> : new Date(of.createdAt).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                    </p>
                    <StatusPill map={estadoOferta} value={of.pagado ? 'pagada' : of.estado === 'activa' && !lidera ? 'superada' : of.estado} />
                  </div>
                  <dl className="row__nums tnum">
                    <div><dt>Tu oferta</dt><dd className="display">{money(of.monto)}</dd></div>
                    <div><dt>Precio actual</dt><dd>{money(p.precioActual)}</dd></div>
                  </dl>
                  <div className="row__actions">
                    {ganada && !of.pagado && <button type="button" className="btn btn--primary" onClick={() => setWonBid(of)}><FaCreditCard size={14} /> Pagar</button>}
                    {of.estado === 'activa' && !lidera && <button type="button" className="btn btn--sm" onClick={() => retirar(of)}>Retirar</button>}
                    <button type="button" className="btn btn--sm btn--ghost" onClick={() => openProduct(p._id)}>Ver ficha</button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {pagination?.totalPaginas > 1 && (
        <nav className="pager" aria-label="Paginación">
          <button type="button" className="icon-btn" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} aria-label="Página anterior"><FaChevronLeft size={14} /></button>
          <span className="tnum">Página {pagination.paginaActual} de {pagination.totalPaginas}</span>
          <button type="button" className="icon-btn" disabled={pagina >= pagination.totalPaginas} onClick={() => setPagina((p) => p + 1)} aria-label="Página siguiente"><FaChevronRight size={14} /></button>
        </nav>
      )}

      <AuctionDetailModal open={!!selected} auction={selected} onClose={() => setSelected(null)} onBidSuccess={cargar} />
      <PaymentModal open={!!wonBid} onClose={() => setWonBid(null)} monto={wonBid?.monto || 0} auction={wonBid?.producto} onPaymentComplete={onPaid} onPaymentCancel={() => setWonBid(null)} />
    </div>
  );
};

export default MyBidsPage;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaChevronDown, FaEdit, FaGavel, FaPlus, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import AuctionDetailModal from '../../components/auctions/AuctionDetailModal';
import CreateAuctionModal from '../../components/auctions/CreateAuctionModal';
import LotCard from '../../components/ui/LotCard';
import { LotSkeletons } from '../../components/ui/Controls';
import CountUp from '../../components/ui/CountUp';
import { CountdownBig } from '../../components/ui/Countdown';
import Odometer from '../../components/ui/Odometer';
import productService from '../../services/productService';
import { useFavorites } from '../../hooks/useFavorites';
import { coverOf, idOf } from '../../lib/media';
import { dur, ease, fadeUp } from '../../lib/motion';
import './WelcomePage.css';

const money = (n) => productService.formatearMoneda(n);

const FAQ = [
  ['¿Cómo se gana una subasta?', 'Cada oferta debe superar el precio actual por lo menos en el incremento mínimo del lote. Al cierre, la oferta más alta queda como ganadora.'],
  ['¿Puedo retirar una oferta?', 'Sí, durante los primeros 30 minutos y solo si ya no es la oferta más alta. Después queda en firme.'],
  ['¿Cuándo pago?', 'Únicamente si ganas. La subasta aparecerá en Mis pujas con el botón para pagar.'],
  ['¿Cómo publico un lote?', 'Con una cuenta de vendedor, entra a Crear subasta, sube hasta cinco fotos y define el precio de salida, el incremento y las fechas.'],
];

const Faq = () => {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq">
      {FAQ.map(([q, a], i) => {
        const on = open === i;
        return (
          <div key={q} className={`faq__item ${on ? 'is-open' : ''}`}>
            <h3>
              <button type="button" aria-expanded={on} onClick={() => setOpen(on ? -1 : i)}>
                <span>{q}</span>
                <FaChevronDown size={13} className="faq__chev" />
              </button>
            </h3>
            <div className="faq__panel"><div><p>{a}</p></div></div>
          </div>
        );
      })}
    </div>
  );
};

const WelcomePage = () => {
  const { user } = useAuth();
  const { favorites, toggle } = useFavorites();
  const esVendedor = user?.tipoUsuario === 'vendedor';
  const [subastas, setSubastas] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mine, setMine] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setError(false);
      const res = await productService.obtenerSubastas({ limite: 60, estado: 'activo', ordenar: 'fechaFin' });
      setSubastas(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e) {
      console.error('Error cargando subastas:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    let alive = true;
    const req = esVendedor ? productService.obtenerMisSubastas({ estado: 'activo', limite: 1 }) : productService.obtenerMisOfertas({ estado: 'activa', limite: 1 });
    req.then((r) => alive && setMine(r.pagination?.total ?? 0)).catch(() => alive && setMine(null));
    return () => { alive = false; };
  }, [esVendedor]);

  const featured = subastas[0];
  const closing = useMemo(() => subastas.slice(1, 9), [subastas]);
  const popular = useMemo(() => [...subastas].sort((a, b) => (b.numeroOfertas || 0) - (a.numeroOfertas || 0)).slice(0, 8), [subastas]);
  const counts = useMemo(() => {
    const m = {};
    subastas.forEach((s) => { m[s.categoria] = (m[s.categoria] || 0) + 1; });
    return productService.categorias.map((c) => ({ ...c, n: m[c.value] || 0 })).filter((c) => c.n > 0).sort((a, b) => b.n - a.n);
  }, [subastas]);

  const isOwner = (a) => esVendedor && String(idOf(a.vendedor) || a.vendedor) === String(user?._id || user?.id);

  const onDelete = async (a) => {
    const c = await Swal.fire({ title: '¿Eliminar subasta?', text: 'Esta acción no se puede deshacer.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Conservar', focusCancel: true });
    if (!c.isConfirmed) return;
    try {
      await productService.eliminarSubasta(a._id);
      setSubastas((p) => p.filter((s) => s._id !== a._id));
    } catch (err) {
      Swal.fire('No se pudo eliminar', err?.message || 'Inténtalo de nuevo.', 'error');
    }
  };

  const ownerFooter = (a) => isOwner(a) ? (
    <>
      <button type="button" className="btn btn--sm" onClick={() => setEditing(a)}><FaEdit size={12} /> Editar</button>
      <button type="button" className="btn btn--sm btn--danger" onClick={() => onDelete(a)}><FaTrash size={12} /> Eliminar</button>
    </>
  ) : null;

  const card = (a, i) => (
    <LotCard key={a._id} auction={a} index={i} isFavorite={favorites.has(a._id)} onToggleFavorite={toggle} onOpen={setSelected} footer={ownerFooter(a)} />
  );

  return (
    <div className="page home">
      <header className="home__hello">
        <motion.h1 className="display" {...fadeUp(0)}>Hola, {user?.nombre}</motion.h1>
        <motion.div className="home__stats" {...fadeUp(1)}>
          <Link to="/dashboard/auctions" className="home__stat">
            <CountUp value={total} className="home__statn display" />
            <span>{total === 1 ? 'subasta activa' : 'subastas activas'}</span>
          </Link>
          {mine !== null && (
            <Link to={esVendedor ? '/dashboard/my-auctions' : '/dashboard/my-bids'} className="home__stat">
              <CountUp value={mine} className="home__statn display" />
              <span>{esVendedor ? (mine === 1 ? 'publicada por ti' : 'publicadas por ti') : (mine === 1 ? 'puja tuya va ganando' : 'pujas tuyas van ganando')}</span>
            </Link>
          )}
          {esVendedor && (
            <Link to="/dashboard/create" className="btn btn--primary btn--lg home__cta"><FaPlus size={14} /> Crear subasta</Link>
          )}
        </motion.div>
      </header>

      {error && (
        <div className="alert alert--error" role="alert">
          No pudimos cargar las subastas.
          <button type="button" className="link" style={{ marginLeft: 'auto' }} onClick={() => { setLoading(true); cargar(); }}>Reintentar</button>
        </div>
      )}

      {loading ? (
        <>
          <div className="skeleton home__featskel" />
          <LotSkeletons count={4} />
        </>
      ) : subastas.length === 0 && !error ? (
        <div className="empty">
          <FaGavel size={40} className="empty__art" />
          <h2 className="display">Sala vacía</h2>
          <p>No hay subastas activas en este momento.</p>
          {esVendedor && <Link to="/dashboard/create" className="btn btn--primary">Publicar la primera</Link>}
        </div>
      ) : (
        <>
          {featured && (
            <motion.section className="feat" aria-labelledby="feat-title" {...fadeUp(2)}>
              <button type="button" className="feat__media" onClick={() => setSelected(featured)} aria-label={`Abrir ${featured.titulo}`}>
                <motion.span layoutId={`lot-media-${featured._id}`} className="feat__frame" style={{ borderRadius: 18 }}>
                  {coverOf(featured) ? <img src={coverOf(featured)} alt="" /> : <span className="lot__noimg"><FaGavel size={48} /></span>}
                </motion.span>
              </button>
              <div className="feat__body">
                <h2 id="feat-title" className="feat__label display">Es la siguiente en cerrar</h2>
                <p className="feat__title">{featured.titulo}</p>
                <div className="feat__clock"><CountdownBig end={featured.fechaFin} /></div>
                <div className="feat__row">
                  <div>
                    <span className="muted">{featured.numeroOfertas || 0} {featured.numeroOfertas === 1 ? 'oferta' : 'ofertas'}</span>
                    <div className="feat__price display"><Odometer value={money(featured.precioActual ?? featured.precioInicial)} /></div>
                  </div>
                  <button type="button" className="btn btn--primary btn--lg" onClick={() => setSelected(featured)}>{esVendedor ? 'Ver ficha' : 'Ofertar'} <FaArrowRight size={13} /></button>
                </div>
              </div>
            </motion.section>
          )}

          {closing.length > 0 && (
            <section aria-labelledby="closing">
              <div className="section-head">
                <h2 id="closing" className="display">Cierran pronto</h2>
                <Link to="/dashboard/auctions?ordenar=fechaFin" className="link">Ver todas <FaArrowRight size={11} /></Link>
              </div>
              <div className="rail-scroll">{closing.map(card)}</div>
            </section>
          )}

          {popular.length > 0 && (
            <section aria-labelledby="popular">
              <div className="section-head"><h2 id="popular" className="display">Las más disputadas</h2></div>
              <div className="lot-grid">{popular.slice(0, 4).map(card)}</div>
            </section>
          )}

          {counts.length > 0 && (
            <section aria-labelledby="cats" className="home__cats">
              <h2 id="cats" className="display">Por categoría</h2>
              <ul>
                {counts.map((c, i) => (
                  <motion.li key={c.value} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: dur.slow, ease: ease.out, delay: i * 0.05 }}>
                    <Link to={`/dashboard/auctions?categoria=${c.value}`} className="cat-row">
                      <span className="display">{c.label}</span>
                      <span className="tnum muted">{c.n}</span>
                      <FaArrowRight size={14} />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <section aria-labelledby="faq" className="home__faq">
        <h2 id="faq" className="display">Cómo funciona</h2>
        <Faq />
      </section>

      <CreateAuctionModal
        isOpen={showCreate || !!editing}
        onClose={() => { setShowCreate(false); setEditing(null); }}
        auction={editing}
        onSuccess={cargar}
      />
      <AuctionDetailModal
        open={!!selected}
        auction={selected}
        onClose={() => setSelected(null)}
        onBidSuccess={(nueva) => {
          const pid = selected?._id;
          setSubastas((p) => p.map((s) => (s._id === pid ? { ...s, precioActual: nueva?.monto, numeroOfertas: (s.numeroOfertas || 0) + 1 } : s)));
        }}
      />
    </div>
  );
};

export default WelcomePage;

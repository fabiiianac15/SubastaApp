import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaGavel, FaTimes } from 'react-icons/fa';
import productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { registrarIntentoSubasta } from '../../services/analyticsService';
import { categoryLabel, coverOf, idOf, mediaUrl } from '../../lib/media';
import { dur, ease, spring } from '../../lib/motion';
import Dialog from '../ui/Dialog';
import Gavel from '../ui/Gavel';
import HoldButton from '../ui/HoldButton';
import Odometer from '../ui/Odometer';
import { CountdownBig, timeParts } from '../ui/Countdown';
import { useNow } from '../../hooks/useNow';
import '../../styles/modals.css';

const money = (n) => productService.formatearMoneda(n);

const Gallery = ({ auction }) => {
  const [[active, dir], setActive] = useState([0, 0]);
  const images = auction.imagenes?.length ? auction.imagenes : [];
  const go = (next) => {
    const n = (next + images.length) % images.length;
    setActive([n, next > active ? 1 : -1]);
  };
  const url = images[active] ? mediaUrl(images[active].url) : coverOf(auction);

  return (
    <div className="ficha__gallery">
      <motion.div layoutId={`lot-media-${idOf(auction)}`} className="ficha__stage" style={{ borderRadius: 18 }} transition={spring.soft}>
        {url ? (
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.img
              key={active}
              src={url}
              alt={images[active]?.alt || auction.titulo}
              custom={dir}
              variants={{
                from: (d) => ({ opacity: 0, x: d * 48 }),
                at: { opacity: 1, x: 0 },
                to: (d) => ({ opacity: 0, x: d * -48, transition: { duration: dur.exit } }),
              }}
              initial="from"
              animate="at"
              exit="to"
              transition={{ duration: dur.ui, ease: ease.out }}
              drag={images.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, i) => {
                if (i.offset.x < -60 || i.velocity.x < -500) go(active + 1);
                else if (i.offset.x > 60 || i.velocity.x > 500) go(active - 1);
              }}
              draggable={false}
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
          </AnimatePresence>
        ) : (
          <span className="lot__noimg"><FaGavel size={48} /></span>
        )}
      </motion.div>
      {images.length > 1 && (
        <>
          <button type="button" className="ficha__nav ficha__nav--l" onClick={() => go(active - 1)} aria-label="Imagen anterior"><FaChevronLeft size={14} /></button>
          <button type="button" className="ficha__nav ficha__nav--r" onClick={() => go(active + 1)} aria-label="Imagen siguiente"><FaChevronRight size={14} /></button>
          <div className="ficha__thumbs">
            {images.map((img, i) => (
              <button key={img._id || i} type="button" className="ficha__thumb" aria-label={`Ver imagen ${i + 1}`} aria-current={i === active} onClick={() => go(i)}>
                <img src={mediaUrl(img.url)} alt="" />
                {i === active && <motion.span layoutId="ficha-thumb" className="ficha__thumb-ring" transition={spring.ui} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Panel = ({ auction, onClose, onBidSuccess }) => {
  const { user } = useAuth();
  const now = useNow();
  const id = idOf(auction);
  const [precio, setPrecio] = useState(auction.precioActual ?? auction.precioInicial ?? 0);
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ofertas, setOfertas] = useState([]);
  const [leading, setLeading] = useState(false);
  const [scope, animate] = useAnimate();
  const reduce = useReducedMotion();

  const incremento = auction.incrementoMinimo ?? 1000;
  const minimo = precio + incremento;
  const cerrada = auction.estado !== 'activo' || timeParts(auction.fechaFin, now).ended;
  const esComprador = user?.tipoUsuario === 'comprador';

  useEffect(() => {
    let alive = true;
    productService
      .obtenerOfertasProducto(id, { estado: 'todas', limite: 10 })
      .then((res) => alive && setOfertas(res.data || []))
      .catch(() => alive && setOfertas([]));
    return () => {
      alive = false;
    };
  }, [id]);

  // El golpe: el mazo baja, el aro se expande y el precio acusa el impacto.
  const strike = async () => {
    if (reduce) return;
    const hit = animate('.strike__gavel', { rotate: [-46, 10, 0], opacity: [1, 1, 0] }, { duration: 0.62, times: [0, 0.42, 1], ease: ['easeIn', 'easeOut'] });
    animate('.strike__ring', { scale: [0.3, 1.9], opacity: [0, 0.9, 0] }, { duration: 0.56, delay: 0.24, ease: ease.out });
    animate('.ficha__price', { y: [0, 5, -2, 0] }, { duration: 0.34, delay: 0.25, ease: ease.out });
    await hit;
  };

  const placeBid = async () => {
    setError('');
    const valor = Number(monto) || minimo;
    if (valor < minimo) {
      setError(`La oferta mínima es ${money(minimo)}`);
      return;
    }
    try {
      setLoading(true);
      const res = await productService.crearOferta(id, { monto: valor });
      const nueva = res.data;
      setPrecio(valor);
      setLeading(true);
      setOfertas((prev) => [nueva, ...prev].slice(0, 10));
      setMonto('');
      strike();
      onBidSuccess?.(nueva);
      registrarIntentoSubasta(id, auction.titulo, auction.categoria, valor, true, null);
    } catch (err) {
      setError(err?.message || 'No se pudo realizar la oferta');
      setLeading(false);
      animate('.ficha__form', { x: [0, -6, 6, -3, 0] }, { duration: 0.3 });
      registrarIntentoSubasta(id, auction.titulo, auction.categoria, valor, false, err?.message || 'Error al crear oferta');
    } finally {
      setLoading(false);
    }
  };

  const vendedor = auction.vendedor?.nombre ? `${auction.vendedor.nombre} ${auction.vendedor.apellido || ''}`.trim() : null;

  return (
    <div className="ficha__panel" ref={scope}>
      <div className="ficha__top">
        <p className="ficha__crumb muted">
          {categoryLabel(auction.categoria, productService.categorias)}{vendedor ? ` · Vende ${vendedor}` : ''}
        </p>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar ficha"><FaTimes size={16} /></button>
      </div>
      <h2 id="ficha-title" className="ficha__title">{auction.titulo}</h2>

      <div className="ficha__board">
        <div className="ficha__pricebox">
          <span className="ficha__caption">{leading ? 'Vas ganando con' : auction.numeroOfertas ? 'Oferta actual' : 'Precio de salida'}</span>
          <span className="strike" aria-hidden="true">
            <span className="strike__ring" />
            <Gavel size={52} className="strike__gavel" />
          </span>
          <div className={`ficha__price display ${leading ? 'is-leading' : ''}`}>
            <Odometer value={money(precio)} label={money(precio)} />
          </div>
        </div>
        <div>
          <span className="ficha__caption">Cierra en</span>
          <CountdownBig end={auction.fechaFin} />
        </div>
      </div>

      {cerrada ? (
        <p className="alert alert--note">Esta subasta no está recibiendo ofertas.</p>
      ) : esComprador ? (
        <form className="ficha__form" noValidate onSubmit={(e) => { e.preventDefault(); placeBid(); }}>
          <div className="ficha__quick" role="group" aria-label="Montos rápidos">
            {[1, 2, 5].map((x) => {
              const v = precio + incremento * x;
              const on = (Number(monto) || minimo) === v;
              return (
                <button key={x} type="button" className="ficha__quickbtn tnum" aria-pressed={on} onClick={() => { setMonto(String(v)); setError(''); }}>
                  {on && <motion.span layoutId="ficha-quick" className="ficha__quickpill" transition={spring.ui} />}
                  <span>{money(v)}</span>
                </button>
              );
            })}
          </div>
          <div className="field">
            <label htmlFor="bid-amount">Otro monto</label>
            <input
              id="bid-amount"
              className={`input tnum ${error ? 'input--error' : ''}`}
              type="number"
              inputMode="numeric"
              min={minimo}
              step={incremento}
              value={monto}
              onChange={(e) => { setMonto(e.target.value); setError(''); }}
              placeholder={`Mínimo ${money(minimo)}`}
              aria-describedby="bid-note"
            />
            <AnimatePresence initial={false}>
              {error && (
                <motion.p key="err" role="alert" className="field__error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p>
              )}
            </AnimatePresence>
            <p id="bid-note" className="field__hint">Sube de {money(incremento)} en {money(incremento)}. Solo pagas si ganas al cierre.</p>
          </div>
          <HoldButton onComplete={placeBid} busy={loading} holdLabel="Sigue pulsando…">
            {loading ? 'Ofertando…' : `Ofertar ${money(Number(monto) || minimo)}`}
          </HoldButton>
        </form>
      ) : (
        <p className="alert alert--note">Las ofertas se hacen con una cuenta de comprador.</p>
      )}

      {auction.descripcion && <p className="ficha__desc">{auction.descripcion}</p>}
      {auction.condiciones && <p className="ficha__desc muted">{auction.condiciones}</p>}

      <section className="ficha__feed">
        <h3 className="display">Últimas ofertas</h3>
        {ofertas.length === 0 ? (
          <p className="muted">Aún no hay ofertas. La primera marca el ritmo.</p>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {ofertas.map((o) => (
                <motion.li key={o._id} layout="position" initial={{ opacity: 0, y: -12, backgroundColor: 'var(--accent-soft)' }} animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(0,0,0,0)' }} transition={{ duration: 0.5, ease: ease.out }}>
                  <span className="ficha__who">{o.postor?.nombre || 'Postor'} {o.postor?.apellido?.charAt(0) || ''}.</span>
                  <span className="muted ficha__when tnum">{new Date(o.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <strong className="tnum">{money(o.monto)}</strong>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
};

const AuctionDetailModal = ({ open, onClose, auction, onBidSuccess }) => {
  // Conserva el lote mientras dura la animación de salida.
  const last = useRef(auction);
  if (auction) last.current = auction;
  const a = last.current;

  return (
    <Dialog open={open && !!auction} onClose={onClose} labelledBy="ficha-title" width={1080} className="ficha">
      {a && (
        <div className="ficha__grid dialog__scroll">
          <Gallery key={`g-${idOf(a)}`} auction={a} />
          <Panel key={`p-${idOf(a)}`} auction={a} onClose={onClose} onBidSuccess={onBidSuccess} />
        </div>
      )}
    </Dialog>
  );
};

export default AuctionDetailModal;

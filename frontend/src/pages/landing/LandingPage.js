import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { FaArrowRight, FaGavel } from 'react-icons/fa';
import productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import Gavel, { Logo } from '../../components/ui/Gavel';
import Odometer from '../../components/ui/Odometer';
import CountUp from '../../components/ui/CountUp';
import LotCard from '../../components/ui/LotCard';
import { Countdown } from '../../components/ui/Countdown';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { coverOf } from '../../lib/media';
import { dur, ease, spring } from '../../lib/motion';
import '../../components/ui/ui.css';
import './LandingPage.css';

const money = (n) => productService.formatearMoneda(n);

/* Baraja de lotes reales: se inclina con el puntero y se arrastra para pasar. */
const Deck = ({ lots, onOpen }) => {
  const [order, setOrder] = useState(() => lots.map((_, i) => i));
  useEffect(() => setOrder(lots.map((_, i) => i)), [lots]);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, spring.pointer);
  const sry = useSpring(ry, spring.pointer);
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reduce = useReducedMotion();

  const onMove = (e) => {
    if (!fine || reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 12);
    rx.set(((e.clientY - r.top) / r.height - 0.5) * -10);
  };
  const reset = () => { rx.set(0); ry.set(0); };
  const next = () => setOrder((o) => [...o.slice(1), o[0]]);

  return (
    <div className="deck" onPointerMove={onMove} onPointerLeave={reset}>
      <motion.div className="deck__tilt" style={{ rotateX: srx, rotateY: sry }}>
        {order.slice(0, 3).reverse().map((lotIndex) => {
          const depth = order.indexOf(lotIndex);
          const lot = lots[lotIndex];
          const top = depth === 0;
          return (
            <motion.article
              key={lot._id}
              className="deck__card"
              style={{ zIndex: 3 - depth }}
              initial={false}
              animate={{ y: depth * -20, x: depth * 14, scale: 1 - depth * 0.05, rotate: depth * 2.4, opacity: 1 }}
              transition={spring.soft}
              drag={top ? 'x' : false}
              dragSnapToOrigin
              dragElastic={0.7}
              dragConstraints={{ left: 0, right: 0 }}
              whileDrag={{ scale: 1.02, rotate: -2, cursor: 'grabbing' }}
              onDragEnd={(_, i) => {
                if (Math.abs(i.offset.x) > 90 || Math.abs(i.velocity.x) > 550) next();
              }}
            >
              <div className="deck__media">
                {coverOf(lot) ? <img src={coverOf(lot)} alt="" draggable={false} /> : <span className="lot__noimg"><FaGavel size={44} /></span>}
              </div>
              <div className="deck__info">
                <h2 className="deck__title">
                  {top ? <button type="button" onClick={() => onOpen(lot)}>{lot.titulo}</button> : lot.titulo}
                </h2>
                <div className="deck__row">
                  <span className="deck__price display"><Odometer value={money(lot.precioActual ?? lot.precioInicial)} /></span>
                  <Countdown end={lot.fechaFin} />
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
      {lots.length > 1 && (
        <button type="button" className="deck__next" onClick={next}>Siguiente lote <FaArrowRight size={11} /></button>
      )}
    </div>
  );
};

const Line = ({ children, delay }) => (
  <span className="mask">
    <motion.span className="mask__in" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: ease.out, delay }}>{children}</motion.span>
  </span>
);

const Ticker = ({ lots }) => {
  const items = lots.map((l) => (
    <span key={l._id} className="ticker__item">
      <span>{l.titulo}</span><strong className="tnum">{money(l.precioActual ?? l.precioInicial)}</strong><Gavel size={18} />
    </span>
  ));
  return (
    <div className="ticker" aria-label="Lotes abiertos">
      <div className="ticker__track">
        <div className="ticker__group">{items}</div>
        <div className="ticker__group" aria-hidden="true">{items}</div>
      </div>
    </div>
  );
};

/* La escena del mazo: el scroll sube el precio y baja el mazo. */
const STEPS = [
  { title: 'Abre el lote', text: 'El vendedor sube fotos, fija un precio de salida y el incremento mínimo.' },
  { title: 'Sube la puja', text: 'Cada oferta debe superar la anterior. Tú ves el precio y el tiempo moverse.' },
  { title: 'Cae el mazo', text: 'Al cierre, la oferta más alta gana. Solo paga quien se lleva el lote.' },
];
const SCENE_START = 1200000;
const SCENE_END = 3450000;

const Scene = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const rotate = useTransform(smooth, [0, 0.76, 0.84, 0.88, 1], [-24, -30, -84, -78, -78]);
  const ringScale = useTransform(smooth, [0.83, 0.97], [0.3, 2]);
  const ringOpacity = useTransform(smooth, [0.82, 0.85, 0.97], [0, 1, 0]);
  const [step, setStep] = useState(0);
  const [price, setPrice] = useState(SCENE_START);

  useEffect(() => smooth.on('change', (v) => {
    setStep(v < 0.33 ? 0 : v < 0.8 ? 1 : 2);
    const t = Math.min(1, v / 0.8);
    const raw = SCENE_START + (SCENE_END - SCENE_START) * t;
    setPrice(Math.round(raw / 50000) * 50000);
  }), [smooth]);

  return (
    <section id="como" className="scene" ref={ref} aria-labelledby="como-title">
      <div className="scene__sticky">
        <div className="scene__grid">
          <div className="scene__stage" aria-hidden="true">
            <motion.span className="scene__ring" style={{ scale: ringScale, opacity: ringOpacity }} />
            <motion.span className="scene__gavel" style={{ rotate }}><GavelHead /></motion.span>
            <span className="scene__block" />
            <div className="scene__price display"><Odometer value={money(price)} label="Precio de ejemplo" /></div>
          </div>
          <div className="scene__copy">
            <h2 id="como-title" className="display">Tres golpes y es tuyo</h2>
            <ol>
              {STEPS.map((s, i) => (
                <li key={s.title} className={i === step ? 'is-on' : ''}>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};

const GavelHead = () => (
  <svg viewBox="0 0 200 260" width="100%" height="100%" fill="currentColor" aria-hidden="true">
    <rect x="30" y="20" width="140" height="82" rx="10" />
    <rect x="10" y="4" width="30" height="114" rx="10" />
    <rect x="160" y="4" width="30" height="114" rx="10" />
    <rect x="86" y="100" width="28" height="160" rx="12" />
  </svg>
);

/* Lista tipográfica: la foto del lote sigue al puntero. */
const Categories = ({ lots, onPick }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, spring.pointer);
  const sy = useSpring(y, spring.pointer);
  const [hover, setHover] = useState(null);
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const byCat = useMemo(() => {
    const m = {};
    lots.forEach((l) => { if (!m[l.categoria] && coverOf(l)) m[l.categoria] = coverOf(l); });
    return m;
  }, [lots]);
  const cats = productService.categorias;

  return (
    <section id="categorias" className="cats" aria-labelledby="cats-title" onPointerMove={(e) => { x.set(e.clientX); y.set(e.clientY); }}>
      <h2 id="cats-title" className="display">Qué se está rematando</h2>
      <ul onPointerLeave={() => setHover(null)}>
        {cats.map((c, i) => (
          <motion.li key={c.value} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: dur.slow, ease: ease.out, delay: i * 0.04 }}>
            <button type="button" className="cats__row display" onClick={onPick} onPointerEnter={() => setHover(c.value)}>
              <span>{c.label}</span><FaArrowRight size={26} />
            </button>
          </motion.li>
        ))}
      </ul>
      {fine && (
        <motion.div className="cats__float" style={{ x: sx, y: sy }} aria-hidden="true">
          <AnimatePresence>
            {hover && byCat[hover] && (
              <motion.img key={hover} src={byCat[hover]} alt="" initial={{ opacity: 0, scale: 0.9, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }} transition={{ duration: dur.fast, ease: ease.out }} />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [lots, setLots] = useState([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [cookies, setCookies] = useState(() => {
    try {
      return localStorage.getItem('cookiesAccepted') !== 'true';
    } catch {
      return false;
    }
  });
  const destino = isAuthenticated ? '/dashboard' : '/auth';
  const goAuth = () => navigate(destino);

  useEffect(() => {
    let alive = true;
    productService
      .obtenerSubastas({ limite: 16, estado: 'activo', ordenar: '-numeroOfertas' })
      .then((r) => {
        if (!alive) return;
        setLots(r.data || []);
        setTotal(r.pagination?.total || 0);
      })
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => { alive = false; };
  }, []);

  const deck = useMemo(() => lots.slice(0, 6), [lots]);
  const closing = useMemo(() => [...lots].sort((a, b) => new Date(a.fechaFin) - new Date(b.fechaFin)).slice(0, 6), [lots]);

  const accept = () => {
    setCookies(false);
    try {
      localStorage.setItem('cookiesAccepted', 'true');
    } catch {
      /* el aviso volverá en la próxima visita */
    }
  };

  return (
    <div className="lp">
      <header className="lp-nav">
        <Link to="/" className="lp-nav__logo" aria-label="SubastApp, inicio"><Logo /></Link>
        <nav aria-label="Secciones">
          <a href="#como">Cómo funciona</a>
          <a href="#lotes">Lotes</a>
          <a href="#categorias">Categorías</a>
        </nav>
        <Link to={destino} className="btn btn--primary">{isAuthenticated ? 'Ir al panel' : 'Entrar'}</Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <h1 className="display">
              <Line delay={0.05}>Cada segundo</Line>
              <Line delay={0.15}>sube el precio</Line>
            </h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.slow, ease: ease.out, delay: 0.35 }}>
              Publica lo que quieras rematar o puja hasta el último segundo. Tú decides hasta dónde llegar.
            </motion.p>
            <motion.div className="hero__cta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.slow, ease: ease.out, delay: 0.43 }}>
              <button type="button" className="btn btn--primary btn--lg" onClick={goAuth}>Empezar a pujar <FaArrowRight size={13} /></button>
              {total > 0 && (
                <a className="hero__count" href="#lotes">
                  <CountUp value={total} className="display" />
                  <span>{total === 1 ? 'subasta abierta' : 'subastas abiertas'}</span>
                </a>
              )}
            </motion.div>
          </div>
          <motion.div className="hero__deck" initial={{ opacity: 0, y: 40, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ ...spring.soft, delay: 0.2 }}>
            {deck.length > 0 ? (
              <Deck lots={deck} onOpen={goAuth} />
            ) : (
              <div className="deck__empty">
                <Gavel size={140} />
                {loaded && <p className="muted">El próximo lote puede ser el tuyo.</p>}
              </div>
            )}
          </motion.div>
        </section>

        {lots.length > 2 && <Ticker lots={lots} />}

        <Scene />

        {closing.length > 0 && (
          <section id="lotes" className="lp-lots" aria-labelledby="lots-title">
            <h2 id="lots-title" className="display">Cierran pronto</h2>
            <div className="lot-grid">
              {closing.map((a, i) => <LotCard key={a._id} auction={a} index={i} onOpen={goAuth} sharedLayout={false} />)}
            </div>
          </section>
        )}

        <Categories lots={lots} onPick={goAuth} />

        <section className="closer">
          <motion.h2 className="display" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: ease.out }}>
            A la una,<br />a las dos…
          </motion.h2>
          <Link to={destino} className="btn btn--lg closer__btn">Crear mi cuenta <FaArrowRight size={13} /></Link>
        </section>
      </main>

      <footer className="lp-foot">
        <span className="lp-foot__mark display" aria-hidden="true">Subastapp</span>
        <p className="muted">Proyecto de subastas en línea · Ocaña, Colombia</p>
      </footer>

      <AnimatePresence>
        {cookies && (
          <motion.aside className="cookie" role="region" aria-label="Aviso de almacenamiento" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12, transition: { duration: dur.exit } }} transition={{ duration: dur.slow, ease: ease.out, delay: 1.2 }}>
            <p>Guardamos tu sesión y tus preferencias en este navegador.</p>
            <button type="button" className="btn btn--sm" onClick={accept}>Entendido</button>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;

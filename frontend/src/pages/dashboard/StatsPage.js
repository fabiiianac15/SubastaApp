import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import productService from '../../services/productService';
import CountUp from '../../components/ui/CountUp';
import { estadoOferta, estadoSubasta, StatusPill } from '../../components/ui/Controls';
import { ease } from '../../lib/motion';

const money = (n) => productService.formatearMoneda(n || 0);

export const Meter = ({ label, value, max, display, index = 0 }) => (
  <div className="meter">
    <div className="meter__row"><span>{label}</span><strong className="tnum">{display ?? value}</strong></div>
    <div className="meter__track">
      <motion.span className="meter__fill" initial={{ scaleX: 0 }} whileInView={{ scaleX: max ? value / max : 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: ease.out, delay: index * 0.06 }} />
    </div>
  </div>
);

const StatsPage = () => {
  const { user } = useAuth();
  const esVendedor = user?.tipoUsuario === 'vendedor';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    const req = esVendedor
      ? productService.obtenerMisSubastas({ estado: 'todas', limite: 100, ordenar: '-createdAt' })
      : productService.obtenerMisOfertas({ estado: 'todas', limite: 100, ordenar: '-createdAt' });
    req
      .then((r) => alive && setItems(r.data || []))
      .catch((e) => {
        console.error('Error loading stats', e);
        if (alive) setError(true);
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [esVendedor]);

  const m = useMemo(() => {
    const by = (k) => items.reduce((acc, x) => { acc[x[k]] = (acc[x[k]] || 0) + 1; return acc; }, {});
    if (esVendedor) {
      return {
        cards: [
          { label: 'Valor de lo finalizado', value: items.filter((s) => s.estado === 'finalizado').reduce((n, s) => n + (s.precioActual || 0), 0), money: true, accent: true },
          { label: 'Subastas', value: items.length },
          { label: 'Ofertas recibidas', value: items.reduce((n, s) => n + (s.numeroOfertas || 0), 0) },
          { label: 'Vistas', value: items.reduce((n, s) => n + (s.vistas || 0), 0) },
        ],
        dist: by('estado'),
        map: estadoSubasta,
      };
    }
    return {
      cards: [
        { label: 'Comprometido en pujas activas', value: items.filter((o) => o.estado === 'activa').reduce((n, o) => n + (o.monto || 0), 0), money: true, accent: true },
        { label: 'Pujas', value: items.length },
        { label: 'Ganadas', value: items.filter((o) => o.estado === 'ganadora').length },
        { label: 'Subastas en curso', value: new Set(items.filter((o) => o.producto?.estado === 'activo').map((o) => o.producto?._id)).size },
      ],
      dist: by('estado'),
      map: estadoOferta,
    };
  }, [items, esVendedor]);

  const dist = Object.entries(m.dist).sort((a, b) => b[1] - a[1]);
  const max = dist[0]?.[1] || 0;
  const recent = items.slice(0, 7);

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="display">Estadísticas</h1>
        <Link to="/dashboard/analytics-stats" className="link">Mi actividad en la app <FaArrowRight size={11} /></Link>
      </header>
      {error ? (
        <p className="alert alert--error" role="alert">No pudimos cargar tus estadísticas.</p>
      ) : loading ? (
        <div className="metrics" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 112 }} />)}</div>
      ) : items.length === 0 ? (
        <div className="empty">
          <FaChartBar size={36} className="empty__art" />
          <h2 className="display">Aún sin datos</h2>
          <p>{esVendedor ? 'Publica una subasta para ver sus cifras aquí.' : 'Haz tu primera oferta para ver tus cifras aquí.'}</p>
          <Link className="btn btn--primary" to={esVendedor ? '/dashboard/create' : '/dashboard/auctions'}>{esVendedor ? 'Crear subasta' : 'Explorar subastas'}</Link>
        </div>
      ) : (
        <>
          <div className="metrics">
            {m.cards.map((c) => (
              <div key={c.label} className={`metric ${c.accent ? 'metric--accent' : ''}`}>
                <CountUp value={c.value} format={c.money ? money : undefined} className="metric__value" />
                <span className="metric__label">{c.label}</span>
              </div>
            ))}
          </div>
          <div className="two-col">
            <section className="panel" aria-labelledby="st-dist">
              <h2 id="st-dist" className="display">Por estado</h2>
              {dist.map(([k, v], i) => <Meter key={k} index={i} label={m.map[k]?.label || k} value={v} max={max} />)}
            </section>
            <section className="panel" aria-labelledby="st-rec">
              <h2 id="st-rec" className="display">Lo último</h2>
              <ul className="feed">
                {recent.map((it) => (
                  <li key={it._id}>
                    <strong>{esVendedor ? it.titulo : it.producto?.titulo}</strong>
                    <span className="feed__amount tnum">{money(esVendedor ? it.precioActual ?? it.precioInicial : it.monto)}</span>
                    <small className="tnum">{new Date(it.updatedAt || it.createdAt).toLocaleDateString('es-CO', { dateStyle: 'medium' })}</small>
                    <span><StatusPill map={m.map} value={it.estado} /></span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsPage;

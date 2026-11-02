import React, { useEffect, useState } from 'react';
import { FaWaveSquare } from 'react-icons/fa';
import { obtenerResumen } from '../../services/analyticsService';
import productService from '../../services/productService';
import { categoryLabel } from '../../lib/media';
import CountUp from '../../components/ui/CountUp';
import { Meter } from './StatsPage';

const formatTime = (seconds) => {
  const s = Math.round(seconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min ${s % 60} s`;
  return `${s} s`;
};

const AnalyticsStatsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    obtenerResumen()
      .then((r) => alive && r?.success && setStats(r.data))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const head = (
    <header className="page-head">
      <div>
        <h1 className="display">Mi actividad</h1>
        <p>Lo que registramos de tu uso de la plataforma.</p>
      </div>
    </header>
  );

  if (loading) {
    return <div className="page">{head}<div className="metrics" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 112 }} />)}</div></div>;
  }

  if (!stats) {
    return (
      <div className="page">{head}
        <div className="empty"><FaWaveSquare size={36} className="empty__art" /><h2 className="display">Sin datos por ahora</h2><p>No pudimos cargar tu actividad. Vuelve a intentarlo más tarde.</p></div>
      </div>
    );
  }

  const intentos = stats.intentosSubasta || { total: 0, exitosos: 0, fallidos: 0 };
  const categorias = Object.entries(stats.categoriasClickeadas || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const tasa = intentos.total ? Math.round((intentos.exitosos / intentos.total) * 100) : 0;

  return (
    <div className="page">
      {head}
      <div className="metrics">
        <div className="metric metric--accent"><span className="metric__value tnum">{formatTime(stats.tiempoTotalSegundos)}</span><span className="metric__label">Tiempo en la plataforma</span></div>
        <div className="metric"><CountUp value={stats.totalSesiones || 0} className="metric__value" /><span className="metric__label">Sesiones</span></div>
        <div className="metric"><span className="metric__value tnum">{formatTime(stats.tiempoPromedioSegundos)}</span><span className="metric__label">Promedio por sesión</span></div>
        <div className="metric"><CountUp value={tasa} format={(n) => `${Math.round(n)} %`} className="metric__value" /><span className="metric__label">Intentos exitosos</span></div>
      </div>
      <div className="two-col">
        <section className="panel" aria-labelledby="an-int">
          <h2 id="an-int" className="display">Intentos</h2>
          <Meter label="Exitosos" value={intentos.exitosos || 0} max={intentos.total} index={0} />
          <Meter label="Fallidos" value={intentos.fallidos || 0} max={intentos.total} index={1} />
          {!intentos.total && <p className="muted">Todavía no hay intentos registrados.</p>}
        </section>
        <section className="panel" aria-labelledby="an-cat">
          <h2 id="an-cat" className="display">Categorías consultadas</h2>
          {categorias.length ? categorias.map(([c, n], i) => (
            <Meter key={c} index={i} label={categoryLabel(c, productService.categorias)} value={n} max={categorias[0][1]} />
          )) : <p className="muted">Filtra por categoría en Explorar para empezar a ver esto.</p>}
        </section>
      </div>
    </div>
  );
};

export default AnalyticsStatsPage;

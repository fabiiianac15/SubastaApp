import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaGavel, FaList, FaSearch, FaTh } from 'react-icons/fa';
import productService from '../../services/productService';
import { registrarClickCategoria } from '../../services/analyticsService';
import AuctionDetailModal from '../../components/auctions/AuctionDetailModal';
import LotCard from '../../components/ui/LotCard';
import { Chips, LotSkeletons, Segmented } from '../../components/ui/Controls';
import { useFavorites } from '../../hooks/useFavorites';

const CATS = [{ value: 'todas', label: 'Todas' }, ...productService.categorias.map(({ value, label }) => ({ value, label }))];

const AuctionsPage = () => {
  const [params] = useSearchParams();
  const { favorites, toggle } = useFavorites();
  const [auctions, setAuctions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(params.get('q') || '');
  const [filters, setFilters] = useState({
    categoria: params.get('categoria') || 'todas',
    estado: 'activo',
    busqueda: params.get('q') || '',
    ordenar: params.get('ordenar') || '-numeroOfertas',
  });
  const firstLoad = useRef(true);

  // La búsqueda del encabezado llega por la URL.
  useEffect(() => {
    const q = params.get('q') || '';
    setSearch(q);
    setFilters((f) => (f.busqueda === q ? f : { ...f, busqueda: q }));
    setPage(1);
  }, [params]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => {
        if (f.busqueda === search) return f;
        setPage(1);
        return { ...f, busqueda: search };
      });
    }, 280);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    productService
      .obtenerSubastas({ ...filters, pagina: page, limite: 12 })
      .then((res) => {
        if (!alive) return;
        setAuctions(res.data || []);
        setTotal(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPaginas || 1);
      })
      .catch((e) => {
        console.error('Error loading auctions:', e);
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
          firstLoad.current = false;
        }
      });
    return () => {
      alive = false;
    };
  }, [filters, page, retry]);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    if (key === 'categoria' && value !== 'todas') registrarClickCategoria(value);
  };

  const clear = () => {
    setSearch('');
    setFilters((f) => ({ ...f, categoria: 'todas', estado: 'activo', busqueda: '' }));
    setPage(1);
  };

  const count = loading && firstLoad.current ? ' ' : `${total} ${total === 1 ? 'subasta' : 'subastas'}`;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="display">Explorar</h1>
          <p className="tnum" aria-live="polite">{count}</p>
        </div>
        <Segmented
          id="view"
          label="Vista"
          value={view}
          onChange={setView}
          options={[
            { value: 'grid', icon: <FaTh size={14} />, ariaLabel: 'Cuadrícula' },
            { value: 'list', icon: <FaList size={14} />, ariaLabel: 'Lista' },
          ]}
        />
      </header>

      <div className="explore__filters">
        <Chips id="cat" label="Categoría" value={filters.categoria} onChange={(v) => setFilter('categoria', v)} options={CATS} />
        <div className="toolbar">
          <div className="input-wrap explore__search">
            <FaSearch size={14} />
            <input className="input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Título, descripción o etiqueta" aria-label="Buscar en subastas" />
          </div>
          <select className="select" aria-label="Estado" value={filters.estado} onChange={(e) => setFilter('estado', e.target.value)}>
            <option value="activo">Activas</option>
            <option value="finalizado">Finalizadas</option>
            <option value="todas">Todos los estados</option>
          </select>
          <select className="select" aria-label="Ordenar" value={filters.ordenar} onChange={(e) => setFilter('ordenar', e.target.value)}>
            <option value="-numeroOfertas">Más disputadas</option>
            <option value="fechaFin">Cierran antes</option>
            <option value="-createdAt">Más recientes</option>
            <option value="precioActual">Menor precio</option>
            <option value="-precioActual">Mayor precio</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="empty" role="alert">
          <FaGavel size={36} className="empty__art" />
          <h2 className="display">Sin conexión con la sala</h2>
          <p>No pudimos cargar las subastas.</p>
          <button type="button" className="btn btn--primary" onClick={() => setRetry((r) => r + 1)}>Reintentar</button>
        </div>
      ) : loading && firstLoad.current ? (
        <LotSkeletons count={8} />
      ) : auctions.length === 0 ? (
        <div className="empty">
          <FaSearch size={32} className="empty__art" />
          <h2 className="display">Nada con esos filtros</h2>
          <p>Prueba otra categoría o una búsqueda más amplia.</p>
          <button type="button" className="btn" onClick={clear}>Limpiar filtros</button>
        </div>
      ) : (
        // Al refiltrar se atenúa la lista actual en vez de vaciarla: nada salta.
        <div className={`lot-grid ${view === 'list' ? 'lot-grid--list' : ''} ${loading ? 'is-stale' : ''}`}>
          <AnimatePresence mode="popLayout" initial={true}>
            {auctions.map((a, i) => (
              <LotCard key={a._id} auction={a} index={i} view={view} isFavorite={favorites.has(a._id)} onToggleFavorite={toggle} onOpen={setSelected} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {totalPages > 1 && !error && (
        <nav className="pager" aria-label="Paginación">
          <button type="button" className="icon-btn" disabled={page === 1} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0 }); }} aria-label="Página anterior"><FaChevronLeft size={14} /></button>
          <span className="tnum">Página {page} de {totalPages}</span>
          <button type="button" className="icon-btn" disabled={page === totalPages} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0 }); }} aria-label="Página siguiente"><FaChevronRight size={14} /></button>
        </nav>
      )}

      <AuctionDetailModal
        open={!!selected}
        auction={selected}
        onClose={() => setSelected(null)}
        onBidSuccess={(n) => setAuctions((p) => p.map((s) => (s._id === selected?._id ? { ...s, precioActual: n?.monto, numeroOfertas: (s.numeroOfertas || 0) + 1 } : s)))}
      />
    </div>
  );
};

export default AuctionsPage;

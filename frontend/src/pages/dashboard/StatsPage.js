import React, { useEffect, useMemo, useState } from 'react';
import { FaArrowDown, FaArrowUp, FaClock, FaGavel, FaMoneyBill, FaTrophy, FaUsers } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import productService from '../../services/productService';
import './Dashboard.css';

const currency = (n) => productService.formatearMoneda(n || 0);

const StatsPage = () => {
  const { user } = useAuth();
  const esVendedor = user?.tipoUsuario === 'vendedor';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [items, setItems] = useState([]); // subastas u ofertas dependiendo del rol
  const [recent, setRecent] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      if (esVendedor) {
        // Cargar mis subastas para métricas
        const res = await productService.obtenerMisSubastas({ estado: 'todas', limite: 100, ordenar: '-createdAt' });
        const subastas = res.data || [];
        setItems(subastas);
        // Cálculos
        const total = subastas.length;
        const activas = subastas.filter(s => s.estado === 'activo').length;
        const finalizadas = subastas.filter(s => s.estado === 'finalizado').length;
        const ingresos = subastas.reduce((sum, s) => sum + (s.estado === 'finalizado' ? (s.precioActual || 0) : 0), 0);
        const postores = subastas.reduce((acc, s) => acc + (s.numeroOfertas ? 1 : 0), 0); // aproximación
        setStats({ total, activas, finalizadas, ingresos, postores });
        // Actividad reciente (ordenar por fecha de creación aproximada a partir del ID o fechaFin)
        const recientes = [...subastas]
          .sort((a, b) => new Date(b.updatedAt || b.createdAt || b.fechaFin) - new Date(a.updatedAt || a.createdAt || a.fechaFin))
          .slice(0, 6);
        setRecent(recientes);
      } else {
        // Comprador: usar mis ofertas para métricas
        const res = await productService.obtenerMisOfertas({ estado: 'todas', limite: 100, ordenar: '-createdAt' });
        const ofertas = res.data || [];
        setItems(ofertas);
        const total = ofertas.length;
        const activas = ofertas.filter(o => o.estado === 'activa').length;
        const ganadas = ofertas.filter(o => o.estado === 'ganada').length;
        const comprometido = ofertas.filter(o => o.estado === 'activa').reduce((sum, o) => sum + (o.monto || 0), 0);
        setStats({ total, activas, ganadas, comprometido });
        const recientes = [...ofertas]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 8);
        setRecent(recientes);
      }
    } catch (e) {
      console.error('Error loading stats', e);
      setStats({});
      setItems([]);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); // eslint-disable-next-line
  }, [esVendedor]);

  return (
    <Layout currentPage="stats">
      <div className="modern-dashboard">
        <div className="stats-overview">
          <div className="stats-header">
            <h2>{esVendedor ? 'Estadísticas de mis subastas' : 'Estadísticas de mis pujas'}</h2>
          </div>
          <div className="stats-grid">
            {esVendedor ? (
              <>
                <div className="stat-card total-auctions">
                  <div className="stat-icon"><FaGavel/></div>
                  <div className="stat-content">
                    <h3>{stats.total || 0}</h3>
                    <p>Total de Subastas</p>
                    <div className={`stat-change ${stats.activas >= (stats.finalizadas||0) ? 'positive':'negative'}`}>
                      {stats.activas >= (stats.finalizadas||0) ? <FaArrowUp/> : <FaArrowDown/>}
                      <span>{stats.activas || 0} activas</span>
                    </div>
                  </div>
                </div>
                <div className="stat-card active-bids">
                  <div className="stat-icon"><FaUsers/></div>
                  <div className="stat-content">
                    <h3>{stats.postores || 0}</h3>
                    <p>Subastas con Ofertas</p>
                    <div className="stat-change positive">
                      <FaArrowUp/>
                      <span>{items.reduce((s,a)=> s + (a.numeroOfertas||0), 0)} ofertas totales</span>
                    </div>
                  </div>
                </div>
                <div className="stat-card earnings">
                  <div className="stat-icon"><FaMoneyBill/></div>
                  <div className="stat-content">
                    <h3>{currency(stats.ingresos)}</h3>
                    <p>Ingresos (finalizadas)</p>
                    <div className="stat-change positive">
                      <FaArrowUp/>
                      <span>Incluye precio final</span>
                    </div>
                  </div>
                </div>
                <div className="stat-card won-auctions">
                  <div className="stat-icon"><FaClock/></div>
                  <div className="stat-content">
                    <h3>{stats.finalizadas || 0}</h3>
                    <p>Finalizadas</p>
                    <div className="stat-change">
                      <span>En curso: {stats.activas || 0}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="stat-card total-auctions">
                  <div className="stat-icon"><FaGavel/></div>
                  <div className="stat-content">
                    <h3>{stats.total || 0}</h3>
                    <p>Total de Pujas</p>
                    <div className={`stat-change ${stats.activas >= (stats.ganadas||0) ? 'positive':'negative'}`}>
                      {stats.activas >= (stats.ganadas||0) ? <FaArrowUp/> : <FaArrowDown/>}
                      <span>{stats.activas || 0} activas</span>
                    </div>
                  </div>
                </div>
                <div className="stat-card active-bids">
                  <div className="stat-icon"><FaTrophy/></div>
                  <div className="stat-content">
                    <h3>{stats.ganadas || 0}</h3>
                    <p>Subastas Ganadas</p>
                    <div className="stat-change positive">
                      <FaArrowUp/>
                      <span>¡Sigue participando!</span>
                    </div>
                  </div>
                </div>
                <div className="stat-card earnings">
                  <div className="stat-icon"><FaMoneyBill/></div>
                  <div className="stat-content">
                    <h3>{currency(stats.comprometido)}</h3>
                    <p>Monto Comprometido</p>
                    <div className="stat-change">
                      <span>En pujas activas</span>
                    </div>
                  </div>
                </div>
                <div className="stat-card won-auctions">
                  <div className="stat-icon"><FaClock/></div>
                  <div className="stat-content">
                    <h3>{items.filter(o => o.producto?.estado === 'activo').length}</h3>
                    <p>Subastas en curso</p>
                    <div className="stat-change">
                      <span>Actualiza con tus ofertas</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="dashboard-bottom">
          <div className="recent-activity">
            <h2>Actividad Reciente</h2>
            <div className="activity-list">
              {loading ? (
                <div>Cargando...</div>
              ) : recent.length ? recent.map((it) => (
                <div key={it._id} className={`activity-item ${esVendedor ? (it.estado === 'activo' ? 'bid':'win') : 'bid'}`}>
                  <div className="activity-icon"><FaGavel/></div>
                  <div className="activity-content">
                    <div className="activity-title">
                      {esVendedor ? it.titulo : it.producto?.titulo}
                    </div>
                    <p className="activity-amount">
                      {esVendedor
                        ? `Ofertas: ${it.numeroOfertas || 0} • Actual: ${currency(it.precioActual || it.precioInicial)}`
                        : `Pujaste ${currency(it.monto)} • Estado: ${it.estado}`}
                    </p>
                  </div>
                  <div className="activity-time">{new Date(it.updatedAt || it.createdAt).toLocaleString('es-CO')}</div>
                </div>
              )) : (
                <div>No hay actividad reciente</div>
              )}
            </div>
          </div>

          <div className="recent-auctions">
            <h2>{esVendedor ? 'Mis subastas' : 'Mis pujas'}</h2>
            <div className="auctions-list">
              {loading ? (
                <div>Cargando...</div>
              ) : items.slice(0, 8).map((it) => (
                <div key={it._id} className="auction-item">
                  <div className="auction-image">
                    <div className="image-placeholder"><FaGavel/></div>
                  </div>
                  <div className="auction-info">
                    <h4>{esVendedor ? it.titulo : it.producto?.titulo}</h4>
                    <div className="current-bid">{esVendedor ? currency(it.precioActual || it.precioInicial) : currency(it.producto?.precioActual || it.producto?.precioInicial)}</div>
                    <p className="time-left"><FaClock/> {esVendedor ? it.estado : it.estado}</p>
                  </div>
                  <span className={`auction-status ${esVendedor ? (it.estado === 'activo' ? 'watching' : it.estado === 'finalizado' ? 'outbid' : 'leading') : (it.estado === 'activa' ? 'leading' : it.estado === 'superada' ? 'outbid' : 'watching')}`}>
                    {esVendedor ? it.estado : it.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StatsPage;

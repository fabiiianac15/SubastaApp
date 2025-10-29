import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import productService from '../../services/productService';
import AuctionDetailModal from '../../components/auctions/AuctionDetailModal';
import PaymentModal from '../../components/payment/PaymentModal';
import { FaFilter, FaSearch, FaTrophy, FaClock, FaArrowLeft, FaExternalLinkAlt, FaCheckCircle, FaTimesCircle, FaCreditCard } from 'react-icons/fa';
import './MyBidsPage.css';

const estados = [
  { value: 'todas', label: 'Todas' },
  { value: 'activa', label: 'Activas' },
  { value: 'superada', label: 'Superadas' },
  { value: 'ganadora', label: 'Ganadoras' },
  { value: 'retirada', label: 'Retiradas' }
];

const MyBidsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bids, setBids] = useState([]);
  const [estado, setEstado] = useState('todas');
  const [ordenar, setOrdenar] = useState('-createdAt');
  const [pagina, setPagina] = useState(1);
  const [limite] = useState(10);
  const [pagination, setPagination] = useState(null);
  const [estadisticas, setEstadisticas] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedWonBid, setSelectedWonBid] = useState(null);

  const statsMap = useMemo(() => {
    const map = { activa: 0, superada: 0, ganadora: 0, retirada: 0 };
    (estadisticas || []).forEach(s => { map[s._id] = s.count; });
    return map;
  }, [estadisticas]);

  const formato = (n) => productService.formatearMoneda(n || 0);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await productService.obtenerMisOfertas({ estado, pagina, limite, ordenar });
      setBids(res.data || []);
      setPagination(res.pagination || null);
      setEstadisticas(res.estadisticas || []);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar tus pujas');
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.tipoUsuario !== 'comprador') return;
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, pagina, ordenar]);

  const openProduct = async (productoId) => {
    try {
      const res = await productService.obtenerSubastaPorId(productoId);
      setSelectedAuction(res.data);
    } catch (_) {
      // ignore
    }
  };

  const retirarOferta = async (ofertaId) => {
    try {
      await productService.retirarOferta(ofertaId);
      await cargar();
    } catch (err) {
      alert(err?.message || 'No se pudo retirar la oferta');
    }
  };

  const handlePayNow = (bid) => {
    setSelectedWonBid(bid);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (paymentData) => {
    try {
      // Actualizar la oferta con la información del pago
      await productService.pagarOfertaGanadora(selectedWonBid._id, {
        metodoPago: paymentData.metodo,
        transaccionId: paymentData.transaccionId
      });
      
      // Mostrar mensaje de agradecimiento
      alert('¡Gracias por tu compra! Tu pago ha sido procesado exitosamente. El vendedor se pondrá en contacto contigo pronto.');
      
      setShowPaymentModal(false);
      setSelectedWonBid(null);
      await cargar(); // Recargar las pujas
    } catch (err) {
      alert(err?.message || 'No se pudo procesar el pago');
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setSelectedWonBid(null);
  };

  if (user?.tipoUsuario !== 'comprador') {
    return (
      <Layout currentPage="my-bids">
        <div className="mbp-container">
          <div className="mbp-header">
            <button className="mbp-back" onClick={() => window.history.back()}><FaArrowLeft/> Volver</button>
            <h2>Mis Pujas</h2>
          </div>
          <div className="mbp-empty">Esta sección es para compradores. Ingresa como comprador para ver tus pujas.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="my-bids">
      <div className="mbp-container">
        <div className="mbp-header">
          <button className="mbp-back" onClick={() => window.history.back()}><FaArrowLeft/> Volver</button>
          <h2>Mis Pujas</h2>
        </div>

        <div className="mbp-stats">
          <div className="mbp-stat">
            <FaTrophy/>
            <span>Ganando</span>
            <strong>{statsMap.activa}</strong>
          </div>
          <div className="mbp-stat">
            <FaCheckCircle/>
            <span>Ganadas</span>
            <strong>{statsMap.ganadora}</strong>
          </div>
          <div className="mbp-stat">
            <FaTimesCircle/>
            <span>Superadas</span>
            <strong>{statsMap.superada}</strong>
          </div>
        </div>

        <div className="mbp-filters">
          <div className="mbp-filter-group">
            <FaFilter/>
            <select value={estado} onChange={(e)=> { setPagina(1); setEstado(e.target.value); }}>
              {estados.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
            <select value={ordenar} onChange={(e)=> { setPagina(1); setOrdenar(e.target.value); }}>
              <option value="-createdAt">Más recientes</option>
              <option value="createdAt">Más antiguas</option>
              <option value="-monto">Monto mayor</option>
              <option value="monto">Monto menor</option>
            </select>
          </div>
          <div className="mbp-search">
            <FaSearch/>
            <input placeholder="Buscar por título (local)" onChange={(e)=>{
              const q = e.target.value.toLowerCase();
              const filtro = (x)=> (x.producto?.titulo||'').toLowerCase().includes(q);
              setBids(prev => (q ? prev.filter(filtro) : prev));
            }} />
          </div>
        </div>

        {error && <div className="mbp-error">{error}</div>}

        {loading ? (
          <div className="mbp-loading">Cargando tus pujas...</div>
        ) : bids.length === 0 ? (
          <div className="mbp-empty">Aún no has realizado pujas.</div>
        ) : (
          <div className="mbp-grid">
            {bids.map(of => {
              const p = of.producto || {};
              const winning = (p.precioActual || 0) === (of.monto || 0);
              const isWinner = of.estado === 'ganadora';
              const img = p.imagenes?.[0]?.url;
              const STATIC_BASE = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.replace('/api','')) || 'http://localhost:5000';
              return (
                <div key={of._id} className={`mbp-card ${winning ? 'winning' : ''} ${isWinner ? 'winner' : ''}`}>
                  <div className="mbp-cover" onClick={()=> openProduct(p._id)}>
                    {img ? (
                      <img src={img.startsWith('http') ? img : `${STATIC_BASE}${img}`} alt={p.titulo} onError={(e)=>{ e.currentTarget.src='/logo512.png'; }} />
                    ) : (
                      <div className="mbp-placeholder"><FaTrophy/></div>
                    )}
                    {winning && of.estado === 'activa' && <div className="mbp-badge">¡Vas ganando!</div>}
                    {isWinner && !of.pagado && <div className="mbp-badge winner-badge">🏆 ¡GANASTE!</div>}
                    {isWinner && of.pagado && <div className="mbp-badge paid-badge">✅ Pagado</div>}
                  </div>
                  <div className="mbp-info">
                    <h4 title={p.titulo}>{p.titulo || 'Subasta'}</h4>
                    <div className="mbp-rows">
                      <div className="row">
                        <span>Tu oferta</span>
                        <strong>{formato(of.monto)}</strong>
                      </div>
                      <div className="row">
                        <span>Precio actual</span>
                        <strong>{formato(p.precioActual)}</strong>
                      </div>
                      <div className="row dim">
                        <FaClock/> <span>{new Date(of.createdAt).toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                    <div className="mbp-actions">
                      <button className="link" onClick={()=> openProduct(p._id)}><FaExternalLinkAlt/> Ver subasta</button>
                      {of.estado === 'activa' && !winning && (
                        <button className="warn" onClick={()=> retirarOferta(of._id)}>Retirar oferta</button>
                      )}
                      {of.estado === 'ganadora' && !of.pagado && (
                        <button className="pay-btn" onClick={()=> handlePayNow(of)}>
                          <FaCreditCard/> Pagar ahora
                        </button>
                      )}
                      {of.estado === 'ganadora' && of.pagado && (
                        <div className="purchased-badge"><FaCheckCircle/> Comprado</div>
                      )}
                    </div>
                    {of.estado === 'ganadora' && of.pagado && (
                      <div className="mbp-thanks">
                        ✨ ¡Gracias por tu compra! El vendedor se pondrá en contacto contigo pronto.
                      </div>
                    )}
                    {of.mensaje && <div className="mbp-msg">{of.mensaje}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination && pagination.totalPaginas > 1 && (
          <div className="mbp-pager">
            <button disabled={pagina<=1} onClick={()=> setPagina(p=> Math.max(1, p-1))}>Anterior</button>
            <span>Página {pagination.paginaActual} de {pagination.totalPaginas}</span>
            <button disabled={pagina>=pagination.totalPaginas} onClick={()=> setPagina(p=> Math.min(pagination.totalPaginas, p+1))}>Siguiente</button>
          </div>
        )}
      </div>

      <AuctionDetailModal
        open={!!selectedAuction}
        auction={selectedAuction}
        onClose={()=> setSelectedAuction(null)}
        onBidSuccess={() => cargar()}
      />

      <PaymentModal
        open={showPaymentModal}
        onClose={handlePaymentCancel}
        monto={selectedWonBid?.monto || 0}
        auction={selectedWonBid?.producto}
        onPaymentComplete={handlePaymentComplete}
        onPaymentCancel={handlePaymentCancel}
      />
    </Layout>
  );
};

export default MyBidsPage;

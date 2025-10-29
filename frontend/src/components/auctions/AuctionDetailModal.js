import React, { useEffect, useMemo, useState } from 'react';
import { FaClock, FaTimes, FaChevronLeft, FaChevronRight, FaGavel } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { registrarIntentoSubasta } from '../../services/analyticsService';
import './AuctionDetailModal.css';

const AuctionDetailModal = ({ open, onClose, auction, onBidSuccess }) => {
  const { user } = useAuth();
  const [active, setActive] = useState(0);
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ofertas, setOfertas] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const STATIC_BASE = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.replace('/api', '')) || 'http://localhost:5000';

  const precioActual = auction?.precioActual ?? auction?.precioInicial ?? 0;
  const incrementoMinimo = auction?.incrementoMinimo ?? 1000;
  const minimo = precioActual + incrementoMinimo;

  const images = useMemo(() => (auction?.imagenes?.length ? auction.imagenes : []), [auction]);

  useEffect(() => {
    if (!auction?.fechaFin) return;
    const tick = () => {
      const ahora = new Date();
      const fin = new Date(auction.fechaFin);
      const diff = fin - ahora;
      if (diff <= 0) return setTimeRemaining(null);
      const dias = Math.floor(diff / (1000*60*60*24));
      const horas = Math.floor((diff % (1000*60*60*24))/(1000*60*60));
      const minutos = Math.floor((diff % (1000*60*60))/(1000*60));
      setTimeRemaining({ dias, horas, minutos, total: diff });
    };
    tick();
    const id = setInterval(tick, 1000*30);
    return () => clearInterval(id);
  }, [auction]);

  useEffect(() => {
    if (!open || !auction?._id) return;
    const load = async () => {
      try {
        const res = await productService.obtenerOfertasProducto(auction._id, { estado: 'activa', limite: 10 });
        setOfertas(res.data || []);
      } catch (_) {}
    };
    load();
  }, [open, auction]);

  if (!open || !auction) return null;

  const placeBid = async (e) => {
    e.preventDefault();
    setError('');
    const valor = Number(monto);
    if (Number.isNaN(valor) || valor < minimo) {
      return setError(`La oferta mínima es ${productService.formatearMoneda(minimo)}`);
    }
    
    // Crear oferta directamente sin pago (el pago se hace solo si ganas al finalizar)
    try {
      setLoading(true);
      const res = await productService.crearOferta(auction._id, { 
        monto: valor
      });
      
      const nueva = res.data;
      
      // Registrar intento exitoso en analytics
      await registrarIntentoSubasta(
        auction._id,
        auction.categoria,
        valor,
        true,
        null
      );
      
      // Actualizar lista local de ofertas
      setOfertas(prev => [nueva, ...prev].slice(0, 10));
      setMonto('');
      
      if (onBidSuccess) {
        onBidSuccess(nueva);
      }
    } catch (err) {
      setError(err?.message || 'No se pudo realizar la oferta');
      
      // Registrar intento fallido en analytics
      await registrarIntentoSubasta(
        auction._id,
        auction.categoria,
        valor,
        false,
        err?.message || 'Error al crear oferta'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="adm-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="adm-modal" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
            <button className="adm-close" onClick={onClose} aria-label="Cerrar"><FaTimes/></button>
            <div className="adm-content">
              <div className="adm-gallery">
                {images.length ? (
                  <div className="adm-carousel">
                    <button className="adm-nav left" onClick={()=> setActive((active-1+images.length)%images.length)}><FaChevronLeft/></button>
                    <img
                      src={images[active].url?.startsWith('http') ? images[active].url : `${STATIC_BASE}${images[active].url}`}
                      alt={images[active].alt || auction.titulo}
                      onError={(e)=>{ e.currentTarget.src = '/logo512.png'; }}
                    />
                    <button className="adm-nav right" onClick={()=> setActive((active+1)%images.length)}><FaChevronRight/></button>
                  </div>
                ) : (
                  <div className="adm-placeholder"><FaGavel/></div>
                )}
                <div className="adm-thumbs">
                  {images.map((img, i)=> (
                    <button key={i} className={`adm-thumb ${i===active?'active':''}`} onClick={()=> setActive(i)}>
                      <img src={img.url?.startsWith('http') ? img.url : `${STATIC_BASE}${img.url}`} alt={img.alt || `${auction.titulo}-${i+1}`}/>
                    </button>
                  ))}
                </div>
              </div>
              <div className="adm-panel">
                <h3 className="adm-title">{auction.titulo}</h3>
                <p className="adm-desc">{auction.descripcion || 'Sin descripción'}</p>
                <div className="adm-price">
                  <div className="adm-price-row">
                    <span>Precio actual</span>
                    <strong>{productService.formatearMoneda(precioActual)}</strong>
                  </div>
                  <div className="adm-bid-note">
                    {/* Mensaje vivo al ofertar */}
                    {user?.tipoUsuario === 'comprador' && (
                      <span>
                        Cuando ofertes, mostraremos: <b>{`${user.nombre || 'Usuario'}`} acaba de ofertar <i>{productService.formatearMoneda(Math.max(minimo, Number(monto)||0))}</i>, ¡va ganando!!!</b>
                      </span>
                    )}
                  </div>
                  {timeRemaining && (
                    <div className="adm-time"><FaClock/>&nbsp;Termina en {timeRemaining.dias>0? `${timeRemaining.dias}d `:''}{timeRemaining.horas}h {timeRemaining.minutos}m</div>
                  )}
                </div>
                {user?.tipoUsuario === 'comprador' ? (
                  <form className="adm-form" onSubmit={placeBid}>
                    <label>Monto de la oferta</label>
                    <input
                      type="number"
                      min={minimo}
                      step={incrementoMinimo}
                      value={monto}
                      onChange={(e)=> setMonto(e.target.value)}
                      placeholder={`>= ${productService.formatearMoneda(minimo)}`}
                      required
                    />
                    {error && <div className="adm-error">{error}</div>}
                    <button disabled={loading} className="adm-submit">
                      {loading ? 'Procesando...' : 'Continuar al Pago'}
                    </button>
                  </form>
                ) : (
                  <div className="adm-info">Inicia sesión como comprador para ofertar</div>
                )}
                <div className="adm-feed">
                  <h4>Últimas ofertas</h4>
                  <ul>
                    {ofertas.map((o)=> (
                      <li key={o._id}>
                        <span className="who">{o.postor?.nombre || 'Usuario'}</span>
                        <span className="did">ofertó</span>
                        <span className="amount">{productService.formatearMoneda(o.monto)}</span>
                        <span className="when">{new Date(o.createdAt).toLocaleString('es-CO')}</span>
                        {o.mensaje && <div className="msg">{o.mensaje}</div>}
                      </li>
                    ))}
                    {ofertas.length === 0 && <li className="empty">Aún no hay ofertas</li>}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuctionDetailModal;

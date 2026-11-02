import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaArrowLeft, FaCreditCard, FaSpinner, FaTimes, FaUniversity } from 'react-icons/fa';
import productService from '../../services/productService';
import { dur, ease, spring } from '../../lib/motion';
import Dialog from '../ui/Dialog';
import '../../styles/modals.css';

const BANCOS = ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia', 'Banco de Occidente', 'Banco Popular', 'Itaú', 'Scotiabank Colpatria', 'Banco Caja Social', 'Banco Agrario', 'Banco AV Villas', 'Bancoomeva', 'Banco Falabella', 'Banco Pichincha', 'Banco Cooperativo Coopcentral', 'Nequi', 'Daviplata'];

const groups = (v) => (v.match(/.{1,4}/g) || []).join(' ');

const CardPreview = ({ numero, titular, expira, cvv, flipped }) => (
  <div className="paycard" aria-hidden="true">
    <motion.div className="paycard__inner" animate={{ rotateY: flipped ? 180 : 0 }} transition={spring.soft}>
      <div className="paycard__face">
        <span className="paycard__chip" />
        <span className="paycard__num tnum">{groups(numero.padEnd(16, '•'))}</span>
        <span className="paycard__row"><span>{titular || 'NOMBRE DEL TITULAR'}</span><span className="tnum">{expira || 'MM/AA'}</span></span>
      </div>
      <div className="paycard__face paycard__face--back">
        <span className="paycard__stripe" />
        <span className="paycard__cvv tnum">{cvv || '•••'}</span>
      </div>
    </motion.div>
  </div>
);

const SuccessMark = () => (
  <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true" className="pay-ok__mark">
    <motion.circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: ease.out }} />
    <motion.path d="M30 49l13 13 24-27" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.32, delay: 0.34, ease: ease.out }} />
  </svg>
);

const PaymentModal = ({ open, onClose, monto, auction, onPaymentComplete, onPaymentCancel }) => {
  const [metodo, setMetodo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [banco, setBanco] = useState('');
  const [tipoPersona, setTipoPersona] = useState('natural');
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [nombreTitular, setNombreTitular] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [cvv, setCvv] = useState('');
  const [cvvFocus, setCvvFocus] = useState(false);

  const total = productService.formatearMoneda(monto);

  const resetForm = () => {
    setMetodo(''); setBanco(''); setNumeroDocumento(''); setNumeroTarjeta(''); setNombreTitular('');
    setFechaExpiracion(''); setCvv(''); setError(''); setLoading(false); setSuccess(false);
  };

  const handleCancel = () => {
    if (loading || success) return;
    onPaymentCancel?.();
    resetForm();
    onClose();
  };

  const onExpiry = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length >= 2) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    if (v.length <= 5) setFechaExpiracion(v);
  };

  const procesarPago = async (e) => {
    e.preventDefault();
    setError('');
    if (metodo === 'pse' && (!banco || !numeroDocumento)) return setError('Completa todos los campos.');
    if (metodo === 'tarjeta') {
      if (!numeroTarjeta || !nombreTitular || !fechaExpiracion || !cvv) return setError('Completa todos los campos.');
      if (numeroTarjeta.length < 13) return setError('El número de tarjeta está incompleto.');
      if (cvv.length < 3) return setError('El CVV está incompleto.');
    }
    setLoading(true);
    // Simulación: aquí iría la integración con una pasarela real.
    await new Promise((r) => setTimeout(r, 2000));
    if (Math.random() <= 0.1) {
      setError('El pago simulado fue rechazado. Prueba otra vez o cambia de método.');
      setLoading(false);
      return undefined;
    }
    // La confirmación solo se muestra cuando el servidor ya registró el pago.
    try {
      await onPaymentComplete({
        metodo,
        monto,
        transaccionId: `TXN-${Date.now()}`,
        fecha: new Date().toISOString(),
        banco: metodo === 'pse' ? banco : null,
        ultimos4: metodo === 'tarjeta' ? numeroTarjeta.slice(-4) : null,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (err) {
      setError(err?.message || 'No se pudo registrar el pago.');
      setLoading(false);
    }
    return undefined;
  };

  return (
    <Dialog open={open} onClose={handleCancel} label="Pagar subasta ganada" width={520} dismissible={!loading && !success}>
      <div className="dialog__scroll">
        {success ? (
          <div className="pay-ok" role="status">
            <SuccessMark />
            <h2 className="display">Pago registrado</h2>
            <p className="display pay-ok__amount tnum">{total}</p>
            <p className="muted">{auction?.titulo}</p>
          </div>
        ) : (
          <>
            <div className="dialog__head">
              <h2 className="display">Pagar {total}</h2>
              <button type="button" className="icon-btn" onClick={handleCancel} disabled={loading} aria-label="Cerrar pago"><FaTimes size={16} /></button>
            </div>
            <div className="dialog__body">
              <p className="muted">{auction?.titulo}</p>
              <p className="alert alert--note">Pago de demostración: no se cobra nada. No escribas datos reales de tu tarjeta o cuenta.</p>
              <AnimatePresence mode="wait" initial={false}>
                {!metodo ? (
                  <motion.div key="m" className="paymethods" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16, transition: { duration: dur.exit } }} transition={{ duration: dur.fast, ease: ease.out }}>
                    <button type="button" className="paymethod" onClick={() => setMetodo('pse')}><FaUniversity size={24} /><strong>PSE</strong><small>Débito bancario</small></button>
                    <button type="button" className="paymethod" onClick={() => setMetodo('tarjeta')}><FaCreditCard size={24} /><strong>Tarjeta</strong><small>Crédito o débito</small></button>
                  </motion.div>
                ) : (
                  <motion.form key="f" className="payform" onSubmit={procesarPago} autoComplete="off" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16, transition: { duration: dur.exit } }} transition={{ duration: dur.fast, ease: ease.out }}>
                    <button type="button" className="link payform__back" onClick={() => { setMetodo(''); setError(''); }} disabled={loading}><FaArrowLeft size={12} /> Cambiar método</button>
                    {metodo === 'pse' ? (
                      <>
                        <div className="field">
                          <label htmlFor="pse-persona">Tipo de persona</label>
                          <select id="pse-persona" className="select" value={tipoPersona} onChange={(e) => setTipoPersona(e.target.value)}>
                            <option value="natural">Persona natural</option>
                            <option value="juridica">Persona jurídica</option>
                          </select>
                        </div>
                        <div className="form-row">
                          <div className="field">
                            <label htmlFor="pse-tipo">Documento</label>
                            <select id="pse-tipo" className="select" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)}>
                              <option value="CC">Cédula de ciudadanía</option>
                              <option value="CE">Cédula de extranjería</option>
                              <option value="NIT">NIT</option>
                              <option value="TI">Tarjeta de identidad</option>
                              <option value="PP">Pasaporte</option>
                            </select>
                          </div>
                          <div className="field">
                            <label htmlFor="pse-num">Número</label>
                            <input id="pse-num" className="input tnum" inputMode="numeric" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} />
                          </div>
                        </div>
                        <div className="field">
                          <label htmlFor="pse-banco">Banco</label>
                          <select id="pse-banco" className="select" value={banco} onChange={(e) => setBanco(e.target.value)}>
                            <option value="">Selecciona tu banco</option>
                            {BANCOS.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <CardPreview numero={numeroTarjeta} titular={nombreTitular} expira={fechaExpiracion} cvv={cvv} flipped={cvvFocus} />
                        <div className="field">
                          <label htmlFor="card-num">Número de tarjeta</label>
                          <input id="card-num" className="input tnum" inputMode="numeric" value={groups(numeroTarjeta)} onChange={(e) => { const v = e.target.value.replace(/\s/g, ''); if (v.length <= 16 && /^\d*$/.test(v)) setNumeroTarjeta(v); }} placeholder="0000 0000 0000 0000" />
                        </div>
                        <div className="field">
                          <label htmlFor="card-name">Titular</label>
                          <input id="card-name" className="input" value={nombreTitular} onChange={(e) => setNombreTitular(e.target.value.toUpperCase())} />
                        </div>
                        <div className="form-row">
                          <div className="field">
                            <label htmlFor="card-exp">Vence</label>
                            <input id="card-exp" className="input tnum" inputMode="numeric" value={fechaExpiracion} onChange={onExpiry} placeholder="MM/AA" />
                          </div>
                          <div className="field">
                            <label htmlFor="card-cvv">CVV</label>
                            <input id="card-cvv" className="input tnum" inputMode="numeric" value={cvv} onFocus={() => setCvvFocus(true)} onBlur={() => setCvvFocus(false)} onChange={(e) => { const v = e.target.value; if (v.length <= 4 && /^\d*$/.test(v)) setCvv(v); }} />
                          </div>
                        </div>
                      </>
                    )}
                    {error && <p className="alert alert--error" role="alert">{error}</p>}
                    <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
                      {loading ? <><FaSpinner className="spin" /> Procesando…</> : `Pagar ${total}`}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};

export default PaymentModal;

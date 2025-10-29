import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaCreditCard, 
  FaUniversity, 
  FaLock, 
  FaCheckCircle,
  FaSpinner,
  FaShieldAlt
} from 'react-icons/fa';
import './PaymentModal.css';

const PaymentModal = ({ open, onClose, monto, auction, onPaymentComplete, onPaymentCancel }) => {
  const [metodo, setMetodo] = useState(''); // 'pse', 'tarjeta'
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Datos de PSE
  const [banco, setBanco] = useState('');
  const [tipoPersona, setTipoPersona] = useState('natural');
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  
  // Datos de Tarjeta
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [nombreTitular, setNombreTitular] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [cvv, setCvv] = useState('');
  
  const [error, setError] = useState('');

  const bancosColombia = [
    'Bancolombia',
    'Banco de Bogotá',
    'Davivienda',
    'BBVA Colombia',
    'Banco de Occidente',
    'Banco Popular',
    'Itaú',
    'Scotiabank Colpatria',
    'Banco Caja Social',
    'Banco Agrario',
    'Banco AV Villas',
    'Bancoomeva',
    'Banco Falabella',
    'Banco Pichincha',
    'Banco Cooperativo Coopcentral',
    'Nequi',
    'Daviplata'
  ];

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const formatearTarjeta = (valor) => {
    const limpio = valor.replace(/\s/g, '');
    const grupos = limpio.match(/.{1,4}/g);
    return grupos ? grupos.join(' ') : limpio;
  };

  const handleTarjetaChange = (e) => {
    const valor = e.target.value.replace(/\s/g, '');
    if (valor.length <= 16 && /^\d*$/.test(valor)) {
      setNumeroTarjeta(valor);
    }
  };

  const handleExpiracionChange = (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length >= 2) {
      valor = valor.slice(0, 2) + '/' + valor.slice(2, 4);
    }
    if (valor.length <= 5) {
      setFechaExpiracion(valor);
    }
  };

  const handleCvvChange = (e) => {
    const valor = e.target.value;
    if (valor.length <= 4 && /^\d*$/.test(valor)) {
      setCvv(valor);
    }
  };

  const procesarPago = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones
    if (metodo === 'pse') {
      if (!banco || !numeroDocumento) {
        setError('Por favor completa todos los campos');
        setLoading(false);
        return;
      }
    } else if (metodo === 'tarjeta') {
      if (!numeroTarjeta || !nombreTitular || !fechaExpiracion || !cvv) {
        setError('Por favor completa todos los campos');
        setLoading(false);
        return;
      }
      if (numeroTarjeta.length < 13) {
        setError('Número de tarjeta inválido');
        setLoading(false);
        return;
      }
      if (cvv.length < 3) {
        setError('CVV inválido');
        setLoading(false);
        return;
      }
    }

    try {
      // Simular procesamiento de pago (aquí iría integración real con pasarela)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulación: 90% éxito, 10% fallo
      const exitoso = Math.random() > 0.1;
      
      if (exitoso) {
        setSuccess(true);
        setTimeout(() => {
          onPaymentComplete({
            metodo,
            monto,
            transaccionId: `TXN-${Date.now()}`,
            fecha: new Date().toISOString(),
            banco: metodo === 'pse' ? banco : null,
            ultimos4: metodo === 'tarjeta' ? numeroTarjeta.slice(-4) : null
          });
          resetForm();
        }, 1500);
      } else {
        throw new Error('El pago fue rechazado por el banco. Por favor verifica tus datos o intenta con otro método.');
      }
    } catch (err) {
      setError(err.message || 'Error al procesar el pago');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onPaymentCancel) {
      onPaymentCancel();
    }
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setMetodo('');
    setBanco('');
    setNumeroDocumento('');
    setNumeroTarjeta('');
    setNombreTitular('');
    setFechaExpiracion('');
    setCvv('');
    setError('');
    setLoading(false);
    setSuccess(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="payment-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="payment-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {!success ? (
              <>
                <div className="payment-header">
                  <div className="payment-header-content">
                    <FaShieldAlt className="shield-icon" />
                    <div>
                      <h2>Pago Seguro</h2>
                      <p>Confirma tu oferta de {formatearMoneda(monto)}</p>
                    </div>
                  </div>
                  <button className="payment-close" onClick={handleCancel}>
                    <FaTimes />
                  </button>
                </div>

                <div className="payment-body">
                  <div className="auction-info">
                    <h4>{auction?.titulo}</h4>
                    <div className="payment-amount">
                      <span>Monto a pagar:</span>
                      <strong>{formatearMoneda(monto)}</strong>
                    </div>
                  </div>

                  {!metodo ? (
                    <div className="payment-methods">
                      <h3>Selecciona método de pago</h3>
                      <div className="methods-grid">
                        <button 
                          className="method-card"
                          onClick={() => setMetodo('pse')}
                        >
                          <FaUniversity className="method-icon" />
                          <span>PSE</span>
                          <small>Débito bancario</small>
                        </button>
                        <button 
                          className="method-card"
                          onClick={() => setMetodo('tarjeta')}
                        >
                          <FaCreditCard className="method-icon" />
                          <span>Tarjeta</span>
                          <small>Crédito o débito</small>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={procesarPago} className="payment-form">
                      <button 
                        type="button"
                        className="back-button"
                        onClick={() => setMetodo('')}
                      >
                        ← Cambiar método
                      </button>

                      {metodo === 'pse' ? (
                        <>
                          <h3><FaUniversity /> Pago con PSE</h3>
                          
                          <div className="form-group">
                            <label>Tipo de persona</label>
                            <select 
                              value={tipoPersona}
                              onChange={(e) => setTipoPersona(e.target.value)}
                              required
                            >
                              <option value="natural">Persona Natural</option>
                              <option value="juridica">Persona Jurídica</option>
                            </select>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Tipo de documento</label>
                              <select 
                                value={tipoDocumento}
                                onChange={(e) => setTipoDocumento(e.target.value)}
                                required
                              >
                                <option value="CC">Cédula de Ciudadanía</option>
                                <option value="CE">Cédula de Extranjería</option>
                                <option value="NIT">NIT</option>
                                <option value="TI">Tarjeta de Identidad</option>
                                <option value="PP">Pasaporte</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Número de documento</label>
                              <input 
                                type="text"
                                value={numeroDocumento}
                                onChange={(e) => setNumeroDocumento(e.target.value)}
                                placeholder="123456789"
                                required
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Banco</label>
                            <select 
                              value={banco}
                              onChange={(e) => setBanco(e.target.value)}
                              required
                            >
                              <option value="">Selecciona tu banco</option>
                              {bancosColombia.map(b => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3><FaCreditCard /> Pago con Tarjeta</h3>
                          
                          <div className="form-group">
                            <label>Número de tarjeta</label>
                            <input 
                              type="text"
                              value={formatearTarjeta(numeroTarjeta)}
                              onChange={handleTarjetaChange}
                              placeholder="1234 5678 9012 3456"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Nombre del titular</label>
                            <input 
                              type="text"
                              value={nombreTitular}
                              onChange={(e) => setNombreTitular(e.target.value.toUpperCase())}
                              placeholder="NOMBRE COMO APARECE EN LA TARJETA"
                              required
                            />
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Fecha de expiración</label>
                              <input 
                                type="text"
                                value={fechaExpiracion}
                                onChange={handleExpiracionChange}
                                placeholder="MM/AA"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>CVV</label>
                              <input 
                                type="text"
                                value={cvv}
                                onChange={handleCvvChange}
                                placeholder="123"
                                maxLength="4"
                                required
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {error && (
                        <div className="payment-error">
                          {error}
                        </div>
                      )}

                      <div className="payment-security">
                        <FaLock />
                        <span>Pago 100% seguro y encriptado</span>
                      </div>

                      <div className="payment-actions">
                        <button 
                          type="button"
                          className="btn-cancel"
                          onClick={handleCancel}
                          disabled={loading}
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit"
                          className="btn-pay"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <FaSpinner className="spinner" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              Pagar {formatearMoneda(monto)}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="payment-success">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <FaCheckCircle className="success-icon" />
                </motion.div>
                <h2>¡Pago exitoso!</h2>
                <p>Tu oferta ha sido registrada correctamente</p>
                <div className="success-amount">
                  {formatearMoneda(monto)}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;

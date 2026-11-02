import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useAnimate } from 'framer-motion';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaGavel, FaShoppingBag, FaSpinner } from 'react-icons/fa';
import { useAuthActions, useAuth } from '../../context/AuthContext';
import Gavel, { Logo } from '../ui/Gavel';
import { Segmented } from '../ui/Controls';
import { dur, ease, spring } from '../../lib/motion';
import '../ui/ui.css';
import './AuthForm.css';

const EMPTY = {
  email: '', password: '', nombre: '', apellido: '', telefono: '', tipoUsuario: 'comprador',
  direccion: { calle: '', ciudad: '', codigoPostal: '', pais: 'Colombia' },
};

const Field = ({ id, label, hint, ...props }) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    <input id={id} className="input" aria-describedby={hint ? `${id}-h` : undefined} {...props} />
    {hint && <span id={`${id}-h`} className="field__hint">{hint}</span>}
  </div>
);

const ROLES = [
  { value: 'comprador', icon: FaShoppingBag, title: 'Quiero comprar', text: 'Puja y gana lotes.' },
  { value: 'vendedor', icon: FaGavel, title: 'Quiero vender', text: 'Publica tus subastas.' },
];

const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [showPass, setShowPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState([]);
  const { login, register, clearError } = useAuthActions();
  const { loading, error } = useAuth();
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (!error) return undefined;
    const t = setTimeout(clearError, 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const onField = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('direccion.')) {
      const key = name.split('.')[1];
      setFormData((p) => ({ ...p, direccion: { ...p.direccion, [key]: value } }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors([]);
    try {
      if (isSignUp) await register(formData);
      else await login({ email: formData.email, password: formData.password });
    } catch (err) {
      setFieldErrors(Array.isArray(err.errors) ? err.errors : []);
      animate('.auth__form', { x: [0, -8, 8, -4, 0] }, { duration: 0.32, ease: 'easeOut' });
    }
  };

  const switchMode = (mode) => {
    const signUp = mode === 'up';
    if (signUp === isSignUp) return;
    setIsSignUp(signUp);
    setFieldErrors([]);
    clearError();
  };

  // authService repite el mensaje general dentro de errors: se muestra una sola vez.
  const messages = fieldErrors.length ? [...new Set(fieldErrors.map((f) => f.msg))] : error ? [error] : [];

  return (
    <div className="auth" ref={scope}>
      <aside className="auth__art" aria-hidden="true">
        <Link to="/" className="auth__logo" tabIndex={-1}><Logo /></Link>
        <motion.span
          className="auth__gavel"
          animate={loading ? { rotate: [0, 18, -4, 0] } : { rotate: 0 }}
          transition={loading ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } : spring.soft}
        >
          <Gavel size="100%" />
        </motion.span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={isSignUp ? 'up' : 'in'} className="auth__claim display" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, transition: { duration: dur.exit } }} transition={{ duration: 0.34, ease: ease.out }}>
            {isSignUp ? 'Tu primera puja' : 'La sala sigue abierta'}
          </motion.p>
        </AnimatePresence>
      </aside>

      <main className="auth__main">
        <Link to="/" className="auth__logo auth__logo--mobile" aria-label="SubastApp, inicio"><Logo /></Link>
        <motion.div className="auth__card" layout="size" transition={{ duration: 0.3, ease: ease.out }}>
          <motion.h1 layout="position" className="display">{isSignUp ? 'Crear cuenta' : 'Entrar'}</motion.h1>
          <motion.div layout="position">
            <Segmented id="auth-mode" label="Acceso" value={isSignUp ? 'up' : 'in'} onChange={switchMode} options={[{ value: 'in', label: 'Iniciar sesión' }, { value: 'up', label: 'Registrarme' }]} />
          </motion.div>

          <form className="auth__form" onSubmit={onSubmit}>
            <AnimatePresence initial={false}>
              {messages.length > 0 && (
                <motion.div key="err" className="alert alert--error" role="alert" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: dur.exit } }}>
                  <FaExclamationCircle size={14} />
                  <div>{messages.map((m) => <div key={m}>{m}</div>)}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false} mode="popLayout">
              {isSignUp && (
                <motion.div key="who" className="auth__group" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18, transition: { duration: dur.exit } }} transition={{ duration: dur.ui, ease: ease.out }}>
                  <div className="auth__roles" role="radiogroup" aria-label="Tipo de cuenta">
                    {ROLES.map((r) => {
                      const on = formData.tipoUsuario === r.value;
                      return (
                        <button key={r.value} type="button" role="radio" aria-checked={on} className={`auth__role ${on ? 'is-on' : ''}`} onClick={() => setFormData((p) => ({ ...p, tipoUsuario: r.value }))}>
                          {on && <motion.span layoutId="auth-role" className="auth__role-pill" transition={spring.ui} />}
                          <r.icon size={18} /><strong>{r.title}</strong><small>{r.text}</small>
                        </button>
                      );
                    })}
                  </div>
                  <div className="form-row">
                    <Field id="a-nombre" label="Nombre" name="nombre" autoComplete="given-name" required value={formData.nombre} onChange={onField} />
                    <Field id="a-apellido" label="Apellido" name="apellido" autoComplete="family-name" required value={formData.apellido} onChange={onField} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Field id="a-email" label="Correo" type="email" name="email" autoComplete="email" required value={formData.email} onChange={onField} />

            <div className="field">
              <label htmlFor="a-pass">Contraseña</label>
              <div className="auth__pass">
                <input id="a-pass" className="input" type={showPass ? 'text' : 'password'} name="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} required minLength={isSignUp ? 6 : undefined} value={formData.password} onChange={onField} aria-describedby={isSignUp ? 'a-pass-h' : undefined} />
                <button type="button" className="icon-btn" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPass}>
                  {showPass ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
              {isSignUp && <span id="a-pass-h" className="field__hint">Mínimo 6 caracteres, con mayúscula, minúscula y número.</span>}
            </div>

            <AnimatePresence initial={false} mode="popLayout">
              {isSignUp && (
                <motion.div key="addr" className="auth__group" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18, transition: { duration: dur.exit } }} transition={{ duration: dur.ui, ease: ease.out, delay: 0.04 }}>
                  <Field id="a-tel" label="Teléfono" type="tel" name="telefono" autoComplete="tel" required hint="Con indicativo, sin espacios: +573001234567" value={formData.telefono} onChange={onField} />
                  <Field id="a-calle" label="Dirección" name="direccion.calle" autoComplete="street-address" required value={formData.direccion.calle} onChange={onField} />
                  <div className="form-row">
                    <Field id="a-ciudad" label="Ciudad" name="direccion.ciudad" autoComplete="address-level2" required value={formData.direccion.ciudad} onChange={onField} />
                    <Field id="a-cp" label="Código postal" name="direccion.codigoPostal" autoComplete="postal-code" required value={formData.direccion.codigoPostal} onChange={onField} />
                  </div>
                  <Field id="a-pais" label="País" name="direccion.pais" autoComplete="country-name" required value={formData.direccion.pais} onChange={onField} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button layout="position" type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
              {loading ? <><FaSpinner className="spin" /> Un momento…</> : isSignUp ? 'Crear mi cuenta' : 'Entrar'}
            </motion.button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default AuthForm;

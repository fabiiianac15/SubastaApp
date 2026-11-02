import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCamera, FaExclamationTriangle, FaTimes, FaTrash, FaUser } from 'react-icons/fa';
import { useAuth, useAuthActions } from '../../context/AuthContext';
import authService from '../../services/authService';
import productService from '../../services/productService';
import { dur, ease } from '../../lib/motion';
import Dialog from '../ui/Dialog';
import { Segmented } from '../ui/Controls';
import '../../styles/modals.css';

const fromUser = (user) => ({
  nombre: user?.nombre || '',
  apellido: user?.apellido || '',
  email: user?.email || '',
  telefono: user?.telefono || '',
  direccion: {
    calle: user?.direccion?.calle || '',
    ciudad: user?.direccion?.ciudad || '',
    codigoPostal: user?.direccion?.codigoPostal || '',
    pais: user?.direccion?.pais || '',
  },
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const ProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { logout, updateUser } = useAuthActions();
  const [tab, setTab] = useState('datos');
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [total, setTotal] = useState(null);
  const [formData, setFormData] = useState(() => fromUser(user));
  const fileInputRef = useRef(null);
  const esVendedor = user?.tipoUsuario === 'vendedor';

  useEffect(() => setFormData(fromUser(user)), [user]);

  useEffect(() => {
    if (!user?._id) return;
    try {
      setProfileImage(localStorage.getItem(`profileImage_${user._id}`));
    } catch {
      setProfileImage(null);
    }
  }, [user, isOpen]);

  // Actividad real de la cuenta en lugar de cifras de relleno.
  useEffect(() => {
    if (!isOpen || !user) return undefined;
    let alive = true;
    const req = esVendedor
      ? productService.obtenerMisSubastas({ limite: 1 })
      : productService.obtenerMisOfertas({ limite: 1 });
    req.then((r) => alive && setTotal(r.pagination?.total ?? 0)).catch(() => alive && setTotal(null));
    return () => {
      alive = false;
    };
  }, [isOpen, user, esVendedor]);

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const onField = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('direccion.')) {
      const key = name.split('.')[1];
      setFormData((p) => ({ ...p, direccion: { ...p.direccion, [key]: value } }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      try {
        localStorage.setItem(`profileImage_${user._id}`, reader.result);
      } catch {
        setError('La imagen es demasiado grande para guardarla en este navegador.');
      }
      window.dispatchEvent(new Event('profile-image'));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { nombre, apellido, email, telefono, direccion } = formData;
      const res = await authService.updateProfile({ nombre, apellido, email, telefono, direccion });
      if (res.success) {
        updateUser(res.data);
        setIsEditing(false);
        flash('Perfil actualizado.');
      }
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const { currentPassword, newPassword, confirmPassword } = formData;
    if (!currentPassword || !newPassword || !confirmPassword) return setError('Completa los tres campos de contraseña.');
    if (newPassword !== confirmPassword) return setError('Las contraseñas nuevas no coinciden.');
    if (newPassword.length < 6 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return setError('La contraseña nueva necesita 6 caracteres o más, con mayúscula, minúscula y número.');
    }
    setLoading(true);
    try {
      const res = await authService.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setFormData((p) => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
        flash('Contraseña actualizada.');
      }
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  const handleDelete = async () => {
    if (!deletePassword) return setError('Escribe tu contraseña para confirmar.');
    setLoading(true);
    setError('');
    try {
      const res = await authService.deleteAccount(deletePassword);
      if (res.success) {
        localStorage.removeItem(`profileImage_${user._id}`);
        logout();
        onClose();
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la cuenta.');
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  const desde = user?.fechaRegistro || user?.createdAt;
  const field = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={`pf-${name}`}>{label}</label>
      <input
        id={`pf-${name}`}
        name={name}
        className="input"
        disabled={!isEditing}
        value={name.startsWith('direccion.') ? formData.direccion[name.split('.')[1]] : formData[name]}
        onChange={onField}
        {...props}
      />
    </div>
  );

  return (
    <Dialog open={isOpen} onClose={onClose} label="Mi perfil" width={680}>
      <div className="dialog__scroll">
        <div className="profile__hero">
          <div className="profile__avatar">
            {profileImage ? <img src={profileImage} alt="" /> : <FaUser size={30} />}
            <button type="button" className="profile__photo" aria-label="Cambiar foto" onClick={() => fileInputRef.current?.click()}><FaCamera size={13} /></button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onImage} />
          </div>
          <div className="profile__who">
            <h2 className="display">{user?.nombre} {user?.apellido}</h2>
            <p className="muted">
              {esVendedor ? 'Vendedor' : 'Comprador'}
              {total !== null && ` · ${total} ${esVendedor ? (total === 1 ? 'subasta' : 'subastas') : total === 1 ? 'oferta' : 'ofertas'}`}
              {desde && ` · Desde ${new Date(desde).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`}
            </p>
          </div>
          <button type="button" className="icon-btn profile__close" onClick={onClose} aria-label="Cerrar perfil"><FaTimes size={16} /></button>
        </div>

        <div className="dialog__body">
          <Segmented id="profile" label="Secciones del perfil" value={tab} onChange={(v) => { setTab(v); setError(''); setSuccess(''); }} options={[{ value: 'datos', label: 'Datos' }, { value: 'seguridad', label: 'Seguridad' }]} />
          <AnimatePresence initial={false}>
            {error && <motion.p key="e" className="alert alert--error" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><FaExclamationTriangle size={13} /> {error}</motion.p>}
            {success && <motion.p key="s" className="alert alert--ok" role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{success}</motion.p>}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} className="profile__tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: dur.fast, ease: ease.out }}>
              {tab === 'datos' ? (
                <>
                  <div className="form-row">{field('nombre', 'Nombre', { autoComplete: 'given-name' })}{field('apellido', 'Apellido', { autoComplete: 'family-name' })}</div>
                  <div className="form-row">{field('email', 'Correo', { type: 'email', autoComplete: 'email' })}{field('telefono', 'Teléfono', { type: 'tel', autoComplete: 'tel' })}</div>
                  {field('direccion.calle', 'Dirección', { autoComplete: 'street-address' })}
                  <div className="form-row">{field('direccion.ciudad', 'Ciudad')}{field('direccion.codigoPostal', 'Código postal')}</div>
                  {field('direccion.pais', 'País')}
                  <div className="profile__actions">
                    {isEditing ? (
                      <>
                        <button type="button" className="btn" disabled={loading} onClick={() => { setIsEditing(false); setError(''); setFormData(fromUser(user)); }}>Cancelar</button>
                        <button type="button" className="btn btn--primary" disabled={loading} onClick={handleSave}>{loading ? 'Guardando…' : 'Guardar cambios'}</button>
                      </>
                    ) : (
                      <button type="button" className="btn" onClick={() => setIsEditing(true)}>Editar datos</button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <form className="profile__tab" onSubmit={handlePassword}>
                    <div className="field">
                      <label htmlFor="pw-now">Contraseña actual</label>
                      <input id="pw-now" className="input" type="password" name="currentPassword" autoComplete="current-password" value={formData.currentPassword} onChange={onField} />
                    </div>
                    <div className="form-row">
                      <div className="field">
                        <label htmlFor="pw-new">Contraseña nueva</label>
                        <input id="pw-new" className="input" type="password" name="newPassword" autoComplete="new-password" value={formData.newPassword} onChange={onField} />
                      </div>
                      <div className="field">
                        <label htmlFor="pw-again">Repítela</label>
                        <input id="pw-again" className="input" type="password" name="confirmPassword" autoComplete="new-password" value={formData.confirmPassword} onChange={onField} />
                      </div>
                    </div>
                    <div className="profile__actions"><button type="submit" className="btn btn--primary" disabled={loading}>{loading ? 'Actualizando…' : 'Actualizar contraseña'}</button></div>
                  </form>
                  <div className="profile__danger">
                    <h3>Eliminar la cuenta</h3>
                    <p className="muted">Se borran tus datos de forma permanente. No se puede deshacer.</p>
                    {!showDeleteConfirm ? (
                      <button type="button" className="btn btn--danger" onClick={() => { setShowDeleteConfirm(true); setError(''); }}><FaTrash size={13} /> Eliminar mi cuenta</button>
                    ) : (
                      <motion.div className="profile__tab" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="field">
                          <label htmlFor="pw-del">Escribe tu contraseña para confirmar</label>
                          <input id="pw-del" className="input" type="password" autoComplete="current-password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
                        </div>
                        <div className="profile__actions">
                          <button type="button" className="btn" disabled={loading} onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setError(''); }}>Conservar cuenta</button>
                          <button type="button" className="btn btn--danger" disabled={loading} onClick={handleDelete}>{loading ? 'Eliminando…' : 'Sí, eliminar'}</button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Dialog>
  );
};

export default ProfileModal;

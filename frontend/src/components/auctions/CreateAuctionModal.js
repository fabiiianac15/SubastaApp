import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaExclamationTriangle, FaImage, FaSpinner, FaTimes, FaTrash, FaUpload } from 'react-icons/fa';
import productService from '../../services/productService';
import authService from '../../services/authService';
import { mediaUrl, toLocalInput } from '../../lib/media';
import { dur, ease, spring } from '../../lib/motion';
import Dialog from '../ui/Dialog';
import { Segmented } from '../ui/Controls';
import '../../styles/modals.css';

const EMPTY = { titulo: '', descripcion: '', categoria: 'tecnologia', precioInicial: '', porcentajeMinimo: '5', fechaInicio: '', fechaFin: '', tipoSubasta: 'publica', condiciones: '', tags: '' };

const CreateAuctionModal = ({ isOpen, onClose, auction = null, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [iniciarAhora, setIniciarAhora] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const fileInputRef = useRef(null);
  const locked = auction?.numeroOfertas > 0;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setImagenes([]);
    setIniciarAhora(false);
    if (auction) {
      setFormData({
        titulo: auction.titulo || '',
        descripcion: auction.descripcion || '',
        categoria: auction.categoria || 'tecnologia',
        precioInicial: auction.precioInicial?.toString() || '',
        porcentajeMinimo: auction.porcentajeMinimo?.toString() || '5',
        fechaInicio: auction.fechaInicio ? toLocalInput(auction.fechaInicio) : '',
        fechaFin: auction.fechaFin ? toLocalInput(auction.fechaFin) : '',
        tipoSubasta: auction.tipoSubasta || 'publica',
        condiciones: auction.condiciones || '',
        tags: auction.tags ? auction.tags.join(', ') : '',
      });
      setPreviews((auction.imagenes || []).map((img) => ({ id: img._id || img.url, url: mediaUrl(img.url), isExisting: true })));
    } else {
      setFormData(EMPTY);
      setPreviews([]);
    }
  }, [auction, isOpen]);

  const onField = (e) => {
    const { name, value } = e.target;
    if (error) setError(null);
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const toggleNow = (e) => {
    setIniciarAhora(e.target.checked);
    setFormData((p) => ({ ...p, fechaInicio: e.target.checked ? toLocalInput(new Date()) : '' }));
  };

  const onFiles = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (previews.length + files.length > 5) return setError('Puedes subir hasta 5 imágenes.');
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
    if (valid.length < files.length) setError('Cada imagen debe pesar menos de 5 MB.');
    setImagenes((p) => [...p, ...valid]);
    setPreviews((p) => [...p, ...valid.map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, url: URL.createObjectURL(file), isNew: true }))]);
    return undefined;
  };

  const removeImage = (id) => {
    const target = previews.find((i) => i.id === id);
    setPreviews((p) => p.filter((i) => i.id !== id));
    if (target?.isNew) setImagenes((p) => p.filter((f) => f !== target.file));
  };

  const validate = () => {
    const errs = [];
    if (!formData.titulo.trim()) errs.push('El título es obligatorio');
    if (!formData.descripcion.trim()) errs.push('La descripción es obligatoria');
    if (!formData.precioInicial || Number(formData.precioInicial) <= 0) errs.push('El precio inicial debe ser mayor a 0');
    if (!formData.fechaInicio) errs.push('Falta la fecha de inicio');
    if (!formData.fechaFin) errs.push('Falta la fecha de fin');
    if (formData.fechaInicio && formData.fechaFin) {
      const mins = (new Date(formData.fechaFin) - new Date(formData.fechaInicio)) / 60000;
      if (mins <= 0) errs.push('El fin debe ser posterior al inicio');
      else if (mins < 60) errs.push('La subasta debe durar al menos 1 hora');
    }
    if (!auction && previews.length === 0) errs.push('Sube al menos una imagen');
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const user = authService.getCurrentUser();
    if (!localStorage.getItem('token')) return setError('Debes iniciar sesión para crear una subasta.');
    if (!user || user.tipoUsuario !== 'vendedor') return setError('Solo las cuentas de vendedor pueden crear subastas.');
    const errs = validate();
    if (errs.length) return setError(errs.join('. '));
    setLoading(true);
    setError(null);
    try {
      const data = new FormData();
      // Las fechas viajan en ISO para que el servidor no las interprete en su zona horaria.
      const payload = { ...formData, fechaInicio: new Date(formData.fechaInicio).toISOString(), fechaFin: new Date(formData.fechaFin).toISOString() };
      if (locked) {
        ['titulo', 'descripcion', 'condiciones', 'tags'].forEach((k) => payload[k] && data.append(k, payload[k]));
      } else {
        Object.keys(payload).forEach((k) => data.append(k, payload[k]));
        imagenes.forEach((f) => data.append('imagenes', f));
      }
      const res = auction ? await productService.actualizarSubasta(auction._id, data) : await productService.crearSubasta(data);
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      if (Array.isArray(err.errors)) setError(err.errors.map((x) => x.msg).join('. '));
      else setError(err.response?.data?.message || err.message || 'No se pudo guardar la subasta.');
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  return (
    <Dialog open={isOpen} onClose={onClose} labelledBy="cam-title" width={720} dismissible={!loading}>
      <div className="dialog__head">
        <h2 id="cam-title" className="display">{auction ? 'Editar subasta' : 'Nueva subasta'}</h2>
        <button type="button" className="icon-btn" onClick={onClose} disabled={loading} aria-label="Cerrar"><FaTimes size={16} /></button>
      </div>
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <div className="dialog__scroll">
          <div className="dialog__body">
            {locked && <p className="alert alert--note">Esta subasta ya tiene ofertas: solo puedes cambiar la descripción y las condiciones.</p>}
            <div className="field">
              <label htmlFor="cam-titulo">Título</label>
              <input id="cam-titulo" className="input" name="titulo" value={formData.titulo} onChange={onField} maxLength={100} disabled={locked} aria-describedby="cam-titulo-n" />
              <span id="cam-titulo-n" className="field__hint tnum"><span /> {formData.titulo.length}/100</span>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="cam-cat">Categoría</label>
                <select id="cam-cat" className="select" name="categoria" value={formData.categoria} onChange={onField} disabled={locked}>
                  {productService.categorias.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="field">
                <span className="field-label">Visibilidad</span>
                <Segmented id="cam-tipo" label="Visibilidad" value={formData.tipoSubasta} onChange={(v) => !locked && setFormData((p) => ({ ...p, tipoSubasta: v }))} options={[{ value: 'publica', label: 'Pública' }, { value: 'privada', label: 'Privada' }]} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="cam-desc">Descripción</label>
              <textarea id="cam-desc" className="textarea" name="descripcion" rows={4} maxLength={2000} value={formData.descripcion} onChange={onField} />
              <span className="field__hint tnum"><span /> {formData.descripcion.length}/2000</span>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="cam-precio">Precio inicial (COP)</label>
                <input id="cam-precio" className="input tnum" type="number" min="1" step="any" name="precioInicial" value={formData.precioInicial} onChange={onField} disabled={locked} />
              </div>
              <div className="field">
                <label htmlFor="cam-pct">Incremento mínimo (%)</label>
                <input id="cam-pct" className="input tnum" type="number" min="1" max="50" step="0.1" name="porcentajeMinimo" value={formData.porcentajeMinimo} onChange={onField} disabled={locked} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label htmlFor="cam-ini">Inicio</label>
                <input id="cam-ini" className="input" type="datetime-local" name="fechaInicio" value={formData.fechaInicio} onChange={onField} disabled={locked || iniciarAhora} />
                <label className="check"><input type="checkbox" checked={iniciarAhora} onChange={toggleNow} disabled={locked} /> Empezar ahora</label>
              </div>
              <div className="field">
                <label htmlFor="cam-fin">Fin</label>
                <input id="cam-fin" className="input" type="datetime-local" name="fechaFin" value={formData.fechaFin} onChange={onField} disabled={locked} />
              </div>
            </div>
            <div className="field">
              <span className="field-label">Imágenes</span>
              <div className="upl">
                <AnimatePresence initial={false} mode="popLayout">
                  {previews.map((img, i) => (
                    <motion.div key={img.id} layout className="upl__item" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92, transition: { duration: dur.exit } }} transition={spring.ui}>
                      <img src={img.url} alt={`Imagen ${i + 1}`} />
                      {i === 0 && <span className="upl__main">Portada</span>}
                      {img.isNew && <button type="button" className="upl__del" onClick={() => removeImage(img.id)} aria-label={`Quitar imagen ${i + 1}`}><FaTrash size={11} /></button>}
                    </motion.div>
                  ))}
                  {previews.length < 5 && !locked && (
                    <motion.button key="add" layout type="button" className="upl__add" onClick={() => fileInputRef.current?.click()} transition={{ duration: dur.fast, ease: ease.out }}>
                      <FaUpload size={18} /><span>Agregar</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <input ref={fileInputRef} type="file" hidden multiple accept="image/*" onChange={onFiles} />
              <span className="field__hint tnum"><span><FaImage size={11} /> JPG, PNG, GIF o WEBP. Máximo 5 MB.</span> {previews.length}/5</span>
            </div>
            <div className="field">
              <label htmlFor="cam-tags">Etiquetas, separadas por comas</label>
              <input id="cam-tags" className="input" name="tags" value={formData.tags} onChange={onField} disabled={locked} />
            </div>
            <div className="field">
              <label htmlFor="cam-cond">Condiciones (opcional)</label>
              <textarea id="cam-cond" className="textarea" rows={3} maxLength={500} name="condiciones" value={formData.condiciones} onChange={onField} />
            </div>
            {error && <p className="alert alert--error" role="alert"><FaExclamationTriangle size={13} /> {error}</p>}
          </div>
        </div>
        <div className="dialog__foot">
          <button type="button" className="btn" onClick={onClose} disabled={loading}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? <><FaSpinner className="spin" /> Guardando…</> : auction ? 'Guardar cambios' : 'Publicar subasta'}
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default CreateAuctionModal;

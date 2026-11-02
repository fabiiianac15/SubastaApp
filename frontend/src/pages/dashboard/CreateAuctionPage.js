import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCamera, FaCheck, FaGavel, FaSpinner, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import productService from '../../services/productService';
import { registrarIntentoSubasta } from '../../services/analyticsService';
import { categoryLabel, toLocalInput } from '../../lib/media';
import { dur, ease, spring } from '../../lib/motion';
import { Segmented } from '../../components/ui/Controls';
import Odometer from '../../components/ui/Odometer';
import { Countdown } from '../../components/ui/Countdown';
import './CreateAuctionPage.css';

const STEPS = ['El lote', 'Fotos', 'Precio y fechas', 'Publicar'];
const EMPTY = { titulo: '', descripcion: '', categoria: 'tecnologia', precioInicial: '', porcentajeMinimo: '5', fechaInicio: '', fechaFin: '', tipoSubasta: 'publica', condiciones: '', tags: '' };
const DURACIONES = [[1, '1 día'], [3, '3 días'], [7, '7 días'], [14, '14 días']];
const money = (n) => productService.formatearMoneda(Number(n) || 0);

const CreateAuctionPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [[step, dir], setStep] = useState([1, 1]);
  const [startNow, setStartNow] = useState(true);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const previews = useRef(new Set());

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const set = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => (p[name] ? { ...p, [name]: '' } : p));
  };
  const onField = (e) => set(e.target.name, e.target.value);

  const addFiles = (list) => {
    const incoming = Array.from(list).filter((f) => f.type.startsWith('image/'));
    const tooBig = incoming.some((f) => f.size > 5 * 1024 * 1024);
    const ok = incoming.filter((f) => f.size <= 5 * 1024 * 1024);
    setImages((prev) => {
      const room = Math.max(0, 5 - prev.length);
      const items = ok.slice(0, room).map((file) => {
        const url = URL.createObjectURL(file);
        previews.current.add(url);
        return { id: url, url, file };
      });
      return [...prev, ...items];
    });
    setErrors((p) => ({ ...p, images: tooBig ? 'Cada imagen debe pesar menos de 5 MB.' : '' }));
  };

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!formData.titulo.trim()) e.titulo = 'Ponle un título al lote.';
      if (formData.descripcion.trim().length < 10) e.descripcion = 'Escribe al menos 10 caracteres.';
    }
    if (s === 2 && images.length === 0) e.images = 'Sube al menos una foto.';
    if (s === 3) {
      if (!(Number(formData.precioInicial) > 0)) e.precioInicial = 'El precio de salida debe ser mayor a 0.';
      if (!startNow && !formData.fechaInicio) e.fechaInicio = 'Elige cuándo empieza.';
      if (!formData.fechaFin) e.fechaFin = 'Elige cuándo cierra.';
      const inicio = startNow ? new Date() : new Date(formData.fechaInicio);
      if (formData.fechaFin && new Date(formData.fechaFin) - inicio < 3600000) e.fechaFin = 'Debe durar al menos 1 hora.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const go = (to) => {
    if (to > step && !validate(step)) return;
    setStep([to, to > step ? 1 : -1]);
    window.scrollTo({ top: 0 });
  };

  const setDuracion = (dias) => {
    const base = startNow || !formData.fechaInicio ? new Date() : new Date(formData.fechaInicio);
    set('fechaFin', toLocalInput(new Date(base.getTime() + dias * 86400000)));
  };

  const handleSubmit = async () => {
    if (![1, 2, 3].every(validate)) return;
    const inicio = startNow ? new Date() : new Date(formData.fechaInicio);
    try {
      setSubmitting(true);
      const data = new FormData();
      Object.entries({ ...formData, fechaInicio: inicio.toISOString(), fechaFin: new Date(formData.fechaFin).toISOString() }).forEach(([k, v]) => data.append(k, v));
      images.forEach((i) => data.append('imagenes', i.file));
      const result = await productService.crearSubasta(data);
      const creada = result?.data;
      registrarIntentoSubasta(creada?._id || 'nuevo', formData.titulo, formData.categoria, Number(formData.precioInicial) || 0, true, null);
      await Swal.fire({
        title: creada?.estado === 'activo' ? 'Subasta abierta' : 'Subasta programada',
        text: creada?.estado === 'activo' ? 'Tu lote ya está recibiendo ofertas.' : 'Quedó como borrador. Actívala desde Mis subastas cuando llegue la fecha.',
        icon: 'success',
        confirmButtonText: 'Ver mis subastas',
      });
      navigate('/dashboard/my-auctions');
    } catch (error) {
      registrarIntentoSubasta(null, formData.titulo, formData.categoria, Number(formData.precioInicial) || 0, false, error.message || 'Error desconocido');
      Swal.fire('No se pudo publicar', error.message || 'Inténtalo de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cover = images[0]?.url;
  const incremento = useMemo(() => Math.ceil((Number(formData.precioInicial) || 0) * (Number(formData.porcentajeMinimo) / 100)), [formData.precioInicial, formData.porcentajeMinimo]);

  return (
    <div className="page create">
      <header className="page-head"><h1 className="display">Crear subasta</h1></header>

      <ol className="stepper" aria-label="Progreso">
        {STEPS.map((title, i) => {
          const n = i + 1;
          const state = step === n ? 'current' : step > n ? 'done' : 'todo';
          return (
            <li key={title} className={`stepper__item is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              <button type="button" disabled={n >= step} onClick={() => go(n)}>
                <span className="stepper__bar"><motion.span initial={false} animate={{ scaleX: step >= n ? 1 : 0 }} transition={{ duration: 0.34, ease: ease.out }} /></span>
                <span className="stepper__label">{state === 'done' && <FaCheck size={10} />} {title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="create__grid">
        <div className="create__form">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              className="create__step"
              variants={{ from: (d) => ({ opacity: 0, x: d * 28 }), at: { opacity: 1, x: 0 }, to: (d) => ({ opacity: 0, x: d * -16, transition: { duration: dur.exit } }) }}
              initial="from"
              animate="at"
              exit="to"
              transition={{ duration: dur.ui, ease: ease.out }}
            >
              {step === 1 && (
                <>
                  <h2 className="display">¿Qué vas a subastar?</h2>
                  <div className="field">
                    <label htmlFor="c-titulo">Título</label>
                    <input id="c-titulo" className={`input ${errors.titulo ? 'input--error' : ''}`} name="titulo" maxLength={100} value={formData.titulo} onChange={onField} autoFocus aria-describedby="c-titulo-e" />
                    <span id="c-titulo-e" className="field__hint tnum"><span className="field__error">{errors.titulo}</span> {formData.titulo.length}/100</span>
                  </div>
                  <div className="field">
                    <label htmlFor="c-desc">Descripción</label>
                    <textarea id="c-desc" className={`textarea ${errors.descripcion ? 'input--error' : ''}`} name="descripcion" rows={6} maxLength={2000} value={formData.descripcion} onChange={onField} placeholder="Estado, medidas, detalles, qué incluye." aria-describedby="c-desc-e" />
                    <span id="c-desc-e" className="field__hint tnum"><span className="field__error">{errors.descripcion}</span> {formData.descripcion.length}/2000</span>
                  </div>
                  <div className="field">
                    <label htmlFor="c-cat">Categoría</label>
                    <select id="c-cat" className="select" name="categoria" value={formData.categoria} onChange={onField}>
                      {productService.categorias.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="display">Fotos del lote</h2>
                  <p className="muted">Hasta 5, de menos de 5 MB. Arrastra para ordenar: la primera es la portada.</p>
                  {images.length > 0 && (
                    <Reorder.Group axis="x" values={images} onReorder={setImages} className="reorder">
                      <AnimatePresence initial={false}>
                        {images.map((img, i) => (
                          <Reorder.Item key={img.id} value={img} className="reorder__item" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: dur.exit } }} whileDrag={{ scale: 1.05, zIndex: 2 }} transition={spring.ui}>
                            <img src={img.url} alt={`Foto ${i + 1}`} draggable={false} />
                            {i === 0 && <span className="upl__main">Portada</span>}
                            <button type="button" className="upl__del" onPointerDown={(e) => e.stopPropagation()} onClick={() => setImages((p) => p.filter((x) => x.id !== img.id))} aria-label={`Quitar foto ${i + 1}`}><FaTimes size={11} /></button>
                          </Reorder.Item>
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  )}
                  {images.length < 5 && (
                    <button
                      type="button"
                      className={`drop ${dragging ? 'is-over' : ''} ${errors.images ? 'is-error' : ''}`}
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                    >
                      <FaCamera size={26} />
                      <strong>Suelta las fotos aquí o elígelas</strong>
                      <span className="muted tnum">{images.length}/5</span>
                    </button>
                  )}
                  <input ref={fileRef} type="file" hidden multiple accept="image/*" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
                  {errors.images && <p className="field__error" role="alert">{errors.images}</p>}
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="display">Precio y fechas</h2>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="c-precio">Precio de salida (COP)</label>
                      <input id="c-precio" className={`input tnum ${errors.precioInicial ? 'input--error' : ''}`} type="number" min="1" inputMode="numeric" name="precioInicial" value={formData.precioInicial} onChange={onField} autoFocus />
                      {errors.precioInicial && <span className="field__error" role="alert">{errors.precioInicial}</span>}
                    </div>
                    <div className="field">
                      <label htmlFor="c-pct">Incremento mínimo</label>
                      <select id="c-pct" className="select" name="porcentajeMinimo" value={formData.porcentajeMinimo} onChange={onField}>
                        <option value="1">1 %</option>
                        <option value="5">5 %</option>
                        <option value="10">10 %</option>
                        <option value="15">15 %</option>
                      </select>
                      <span className="field__hint tnum">{incremento > 0 ? `Cada oferta sube al menos ${money(incremento)}.` : ' '}</span>
                    </div>
                  </div>
                  <div className="field">
                    <span className="field-label">Inicio</span>
                    <Segmented id="c-start" label="Inicio" value={startNow ? 'now' : 'later'} onChange={(v) => { setStartNow(v === 'now'); set('fechaInicio', ''); }} options={[{ value: 'now', label: 'Al publicar' }, { value: 'later', label: 'Programar' }]} />
                    {!startNow && (
                      <>
                        <input className={`input ${errors.fechaInicio ? 'input--error' : ''}`} type="datetime-local" aria-label="Fecha de inicio" name="fechaInicio" min={toLocalInput(new Date())} value={formData.fechaInicio} onChange={onField} />
                        {errors.fechaInicio && <span className="field__error" role="alert">{errors.fechaInicio}</span>}
                      </>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="c-fin">Cierre</label>
                    <div className="create__durations">
                      {DURACIONES.map(([d, l]) => <button key={d} type="button" className="btn btn--sm" onClick={() => setDuracion(d)}>{l}</button>)}
                    </div>
                    <input id="c-fin" className={`input ${errors.fechaFin ? 'input--error' : ''}`} type="datetime-local" name="fechaFin" min={formData.fechaInicio || toLocalInput(new Date())} value={formData.fechaFin} onChange={onField} />
                    {errors.fechaFin && <span className="field__error" role="alert">{errors.fechaFin}</span>}
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h2 className="display">Últimos detalles</h2>
                  <div className="field">
                    <span className="field-label">Visibilidad</span>
                    <Segmented id="c-tipo" label="Visibilidad" value={formData.tipoSubasta} onChange={(v) => set('tipoSubasta', v)} options={[{ value: 'publica', label: 'Pública' }, { value: 'privada', label: 'Solo invitados' }]} />
                  </div>
                  <div className="field">
                    <label htmlFor="c-cond">Condiciones (opcional)</label>
                    <textarea id="c-cond" className="textarea" rows={3} maxLength={500} name="condiciones" value={formData.condiciones} onChange={onField} placeholder="Envío, garantía, forma de entrega." />
                  </div>
                  <div className="field">
                    <label htmlFor="c-tags">Etiquetas, separadas por comas (opcional)</label>
                    <input id="c-tags" className="input" name="tags" value={formData.tags} onChange={onField} />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="create__nav">
            {step > 1 ? <button type="button" className="btn" onClick={() => go(step - 1)} disabled={submitting}><FaArrowLeft size={12} /> Atrás</button> : <span />}
            {step < 4 ? (
              <button type="button" className="btn btn--primary btn--lg" onClick={() => go(step + 1)}>Siguiente <FaArrowRight size={12} /></button>
            ) : (
              <button type="button" className="btn btn--primary btn--lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><FaSpinner className="spin" /> Publicando…</> : <><FaGavel size={15} /> Publicar subasta</>}
              </button>
            )}
          </div>
        </div>

        <aside className="preview" aria-label="Vista previa del lote">
          <span className="preview__label muted">Así se verá</span>
          <div className="lot preview__card">
            <div className="lot__media">
              <div className="lot__frame" style={{ borderRadius: 14 }}>
                <AnimatePresence initial={false}>
                  {cover ? (
                    <motion.img key={cover} src={cover} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.fast }} style={{ position: 'absolute', inset: 0 }} />
                  ) : (
                    <span className="lot__noimg"><FaCamera size={30} /></span>
                  )}
                </AnimatePresence>
              </div>
              {formData.fechaFin && <span className="lot__time"><Countdown end={formData.fechaFin} /></span>}
            </div>
            <div className="lot__info">
              <h3 className="lot__title preview__title">{formData.titulo || 'Título del lote'}</h3>
              <div className="lot__price display"><Odometer value={money(formData.precioInicial)} /></div>
              <p className="lot__meta">0 ofertas · {categoryLabel(formData.categoria, productService.categorias)}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CreateAuctionPage;

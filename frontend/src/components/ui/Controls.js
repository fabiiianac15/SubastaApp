import React from 'react';
import { motion } from 'framer-motion';
import { spring } from '../../lib/motion';

export const Segmented = ({ id, value, onChange, options, label }) => (
  <div className="segmented" role="group" aria-label={label}>
    {options.map((o) => {
      const on = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          className="segmented__opt"
          aria-pressed={on}
          aria-label={o.ariaLabel}
          onClick={(e) => onChange(o.value, e)}
        >
          {on && <motion.span layoutId={`seg-${id}`} className="segmented__pill" transition={spring.ui} />}
          {o.icon}
          {o.label && <span>{o.label}</span>}
        </button>
      );
    })}
  </div>
);

export const Chips = ({ id, value, onChange, options, label }) => (
  <div className="chips" role="group" aria-label={label}>
    {options.map((o) => {
      const on = o.value === value;
      return (
        <button key={o.value} type="button" className="chip" aria-pressed={on} onClick={() => onChange(o.value)}>
          {on && <motion.span layoutId={`chip-${id}`} className="chip__pill" transition={spring.ui} />}
          <span>{o.label}</span>
        </button>
      );
    })}
  </div>
);

export const Switch = ({ checked, onChange, label }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={onChange}>
    <motion.span layout className="switch__knob" transition={spring.ui} />
  </button>
);

export const LotSkeletons = ({ count = 8 }) => (
  <div className="lot-grid" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton lot-skeleton" />
    ))}
  </div>
);

export const estadoSubasta = {
  borrador: { label: 'Borrador', tone: '' },
  activo: { label: 'Activa', tone: 'win' },
  pausado: { label: 'Pausada', tone: 'warn' },
  finalizado: { label: 'Finalizada', tone: 'info' },
  cancelado: { label: 'Cancelada', tone: 'danger' },
};

export const estadoOferta = {
  activa: { label: 'Vas ganando', tone: 'win' },
  superada: { label: 'Superada', tone: 'danger' },
  ganadora: { label: 'Ganada', tone: 'accent' },
  retirada: { label: 'Retirada', tone: '' },
  pagada: { label: 'Pagada', tone: 'win' },
};

export const StatusPill = ({ map, value }) => {
  const s = map[value] || { label: value, tone: '' };
  return <span className={`pill ${s.tone ? `pill--${s.tone}` : ''}`}>{s.label}</span>;
};

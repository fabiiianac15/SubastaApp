import React from 'react';
import { useNow } from '../../hooks/useNow';
import Odometer from './Odometer';

const pad = (n) => String(n).padStart(2, '0');

export const timeParts = (end, now) => {
  const ms = new Date(end).getTime() - now;
  if (!end || Number.isNaN(ms) || ms <= 0) return { ended: true, ms: 0, urgent: false };
  const s = Math.floor(ms / 1000);
  return {
    ended: false,
    ms,
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    urgent: ms < 3600000,
  };
};

const compact = (t) => {
  if (t.d > 0) return `${t.d}d ${t.h}h`;
  if (t.h > 0) return `${t.h}h ${pad(t.m)}m`;
  return `${pad(t.m)}:${pad(t.s)}`;
};

// Texto compacto y cambio de color cuando queda menos de una hora.
export const Countdown = ({ end, className = '', endedLabel = 'Finalizada' }) => {
  const t = timeParts(end, useNow());
  return (
    <span className={`countdown tnum ${t.urgent ? 'is-urgent' : ''} ${className}`}>
      {t.urgent && <span className="dot-live" aria-hidden="true" />}
      {t.ended ? endedLabel : compact(t)}
    </span>
  );
};

// Reloj grande de la ficha: los dígitos ruedan.
export const CountdownBig = ({ end }) => {
  const t = timeParts(end, useNow());
  if (t.ended) return <span className="clock clock--ended display">Finalizada</span>;
  const text = t.d > 0 ? `${t.d}d ${pad(t.h)}:${pad(t.m)}:${pad(t.s)}` : `${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`;
  return (
    <span className={`clock display ${t.urgent ? 'is-urgent' : ''}`}>
      <Odometer value={text} label={`Termina en ${compact(t)}`} />
    </span>
  );
};

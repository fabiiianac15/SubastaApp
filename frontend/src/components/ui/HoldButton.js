import React, { useCallback, useEffect, useRef, useState } from 'react';
import './ui.css';

const HOLD_MS = 800;

// Las ofertas comprometen: se confirman manteniendo pulsado. Enter o Espacio
// confirman de inmediato, así que el teclado y los lectores de pantalla no
// dependen del gesto.
const HoldButton = ({ onComplete, disabled, busy, children, holdLabel = 'Sigue pulsando…' }) => {
  const [holding, setHolding] = useState(false);
  const [nudge, setNudge] = useState(false);
  const timer = useRef(null);
  const startedAt = useRef(0);
  const done = useRef(false);

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    setHolding(false);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onPointerDown = (e) => {
    if (disabled || busy || e.button > 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    done.current = false;
    startedAt.current = Date.now();
    setNudge(false);
    setHolding(true);
    timer.current = setTimeout(() => {
      done.current = true;
      setHolding(false);
      onComplete();
    }, HOLD_MS);
  };

  const onPointerUp = () => {
    if (!holding) return;
    cancel();
    if (!done.current && Date.now() - startedAt.current < HOLD_MS) setNudge(true);
  };

  const onClick = (e) => {
    // detail === 0: clic generado por teclado o tecnología de asistencia.
    if (e.detail === 0 && !disabled && !busy) onComplete();
  };

  return (
    <div className="hold">
      <button
        type="button"
        className={`hold__btn ${holding ? 'is-holding' : ''}`}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={cancel}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="hold__label">{children}</span>
        <span className="hold__fill" aria-hidden="true">
          <span className="hold__label">{holding ? holdLabel : children}</span>
        </span>
      </button>
      <p className={`hold__hint ${nudge ? 'is-nudged' : ''}`} key={nudge ? 'n' : 'i'}>
        Mantén pulsado para confirmar. Con teclado, pulsa Enter.
      </p>
    </div>
  );
};

export default HoldButton;

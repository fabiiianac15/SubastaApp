import React, { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { ease } from '../../lib/motion';

// Número que sube al entrar en pantalla. Escribe en el DOM sin renderizar React.
const CountUp = ({ value = 0, format = (n) => Math.round(n).toLocaleString('es-CO'), className }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const from = useRef(0);

  useEffect(() => {
    if (!ref.current || !inView) return undefined;
    if (reduce) {
      ref.current.textContent = format(value);
      return undefined;
    }
    const controls = animate(from.current, value, {
      duration: 0.9,
      ease: ease.out,
      onUpdate: (v) => {
        from.current = v;
        if (ref.current) ref.current.textContent = format(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, reduce]);

  return (
    <span ref={ref} className={`tnum ${className || ''}`}>
      {format(value)}
    </span>
  );
};

export default CountUp;

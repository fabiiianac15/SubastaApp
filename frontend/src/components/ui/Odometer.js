import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { spring } from '../../lib/motion';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const Column = memo(({ digit }) => (
  <span className="odo__col">
    <span className="odo__ghost">0</span>
    <motion.span
      className="odo__stack"
      initial={false}
      animate={{ y: `${-digit}em` }}
      transition={spring.ui}
    >
      {DIGITS.map((d) => (
        <span key={d}>{d}</span>
      ))}
    </motion.span>
  </span>
));

// Cada cifra rueda hasta su valor. Se indexa desde la derecha para que las
// columnas conserven su identidad cuando el número gana un dígito.
const Odometer = ({ value, className = '', label }) => {
  const chars = String(value).split('');
  return (
    <span className={`odo ${className}`} role="img" aria-label={label || String(value)}>
      {chars.map((ch, i) => {
        const key = chars.length - i;
        return /\d/.test(ch) ? (
          <Column key={key} digit={Number(ch)} />
        ) : (
          <span key={key} className="odo__sep" aria-hidden="true">
            {ch}
          </span>
        );
      })}
    </span>
  );
};

export default Odometer;

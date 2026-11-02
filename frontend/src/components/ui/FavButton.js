import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { spring } from '../../lib/motion';

const SPARKS = [0, 60, 120, 180, 240, 300];

const FavButton = ({ active, onToggle, title }) => {
  const [burst, setBurst] = useState(0);
  return (
    <button
      type="button"
      className={`fav ${active ? 'is-on' : ''}`}
      aria-pressed={active}
      aria-label={`${active ? 'Quitar de' : 'Agregar a'} favoritos: ${title}`}
      onClick={(e) => {
        e.stopPropagation();
        if (!active) setBurst((b) => b + 1);
        onToggle();
      }}
    >
      <AnimatePresence>
        {burst > 0 && (
          <span key={burst} className="fav__burst" aria-hidden="true">
            {SPARKS.map((deg) => (
              <motion.i
                key={deg}
                initial={{ opacity: 1, transform: `rotate(${deg}deg) translateY(-6px) scale(1)` }}
                animate={{ opacity: 0, transform: `rotate(${deg}deg) translateY(-26px) scale(0.3)` }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            ))}
          </span>
        )}
      </AnimatePresence>
      <motion.span key={active ? 'on' : 'off'} initial={{ scale: active ? 0.6 : 1 }} animate={{ scale: 1 }} transition={spring.pop} className="fav__icon">
        {active ? <FaHeart size={17} /> : <FaRegHeart size={17} />}
      </motion.span>
    </button>
  );
};

export default FavButton;

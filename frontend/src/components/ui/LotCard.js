import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaGavel } from 'react-icons/fa';
import productService from '../../services/productService';
import { coverOf, categoryLabel } from '../../lib/media';
import { dur, ease } from '../../lib/motion';
import { Countdown } from './Countdown';
import FavButton from './FavButton';
import Odometer from './Odometer';

const money = (n) => productService.formatearMoneda(n);

// Ficha de lote. La imagen comparte layoutId con la ficha abierta, de modo que
// el lote "se abre" desde su sitio en la cuadrícula.
const LotCard = memo(function LotCard({
  auction,
  index = 0,
  view = 'grid',
  isFavorite,
  onToggleFavorite,
  onOpen,
  footer,
  sharedLayout = true,
  variant,
}) {
  const id = auction._id;
  const cover = coverOf(auction);
  const price = auction.precioActual ?? auction.precioInicial;

  const onPointerMove = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);

  return (
    <motion.article
      layout="position"
      className={`lot lot--${view} ${variant ? `lot--${variant}` : ''}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: dur.exit } }}
      transition={{ duration: 0.42, ease: ease.out, delay: Math.min(index, 8) * 0.045, layout: { duration: 0.28, ease: ease.out } }}
      onPointerMove={onPointerMove}
    >
      <span className="lot__glow" aria-hidden="true" />
      <div className="lot__media">
        <motion.div layoutId={sharedLayout ? `lot-media-${id}` : undefined} className="lot__frame" style={{ borderRadius: 14 }}>
          {cover ? (
            <img
              src={cover}
              alt=""
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="lot__noimg"><FaGavel size={32} /></span>
          )}
        </motion.div>
        <span className="lot__time"><Countdown end={auction.fechaFin} /></span>
        {onToggleFavorite && (
          <span className="lot__fav">
            <FavButton active={isFavorite} title={auction.titulo} onToggle={() => onToggleFavorite(id)} />
          </span>
        )}
      </div>
      <div className="lot__info">
        <h3 className="lot__title">
          <button type="button" className="lot__open" onClick={() => onOpen?.(auction)}>
            {auction.titulo}
          </button>
        </h3>
        <div className="lot__price display">
          <Odometer value={money(price)} label={`Precio actual ${money(price)}`} />
        </div>
        <p className="lot__meta">
          {auction.numeroOfertas || 0} {auction.numeroOfertas === 1 ? 'oferta' : 'ofertas'} · {categoryLabel(auction.categoria, productService.categorias)}
        </p>
        {footer && <div className="lot__footer">{footer}</div>}
      </div>
    </motion.article>
  );
});

export default LotCard;

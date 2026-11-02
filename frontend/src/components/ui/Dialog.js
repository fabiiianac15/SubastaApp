import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion';
import { dur, ease } from '../../lib/motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
let locks = 0;

const Panel = ({ onClose, label, labelledBy, width, className, children, dismissible }) => {
  const ref = useRef(null);
  const sheet = useMediaQuery('(max-width: 720px)');
  const drag = useDragControls();
  const reduce = useReducedMotion();

  useEffect(() => {
    const previous = document.activeElement;
    locks += 1;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    ref.current?.focus({ preventScroll: true });
    return () => {
      locks -= 1;
      if (locks === 0) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  const onKeyDown = (e) => {
    if (e.key === 'Escape' && dismissible) {
      e.stopPropagation();
      onClose();
    }
    if (e.key !== 'Tab') return;
    const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const hidden = sheet && !reduce ? { y: '100%' } : { opacity: 0, scale: reduce ? 1 : 0.96 };
  const shown = sheet && !reduce ? { y: 0 } : { opacity: 1, scale: 1 };

  return (
    <motion.div className="dialog-root" onKeyDown={onKeyDown}>
      <motion.div
        className="dialog-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: dur.exit } }}
        transition={{ duration: dur.ui }}
        onClick={dismissible ? onClose : undefined}
      />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`dialog ${className || ''}`}
        style={{ '--dialog-w': width ? `${width}px` : undefined }}
        initial={hidden}
        animate={shown}
        exit={{ ...hidden, transition: { duration: sheet ? 0.22 : dur.exit, ease: ease.out } }}
        transition={sheet ? { duration: 0.42, ease: ease.drawer } : { duration: dur.ui, ease: ease.out }}
        drag={sheet && dismissible ? 'y' : false}
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.9 }}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 500) onClose();
        }}
      >
        <div className="dialog__grab" onPointerDown={(e) => drag.start(e)} aria-hidden="true" />
        {children}
      </motion.div>
    </motion.div>
  );
};

// Diálogo centrado en escritorio y hoja inferior arrastrable en móvil.
const Dialog = ({ open, onClose, label, labelledBy, width, className, children, dismissible = true }) =>
  createPortal(
    <AnimatePresence>
      {open && (
        <Panel key="dialog" {...{ onClose, label, labelledBy, width, className, dismissible }}>
          {children}
        </Panel>
      )}
    </AnimatePresence>,
    document.body
  );

export default Dialog;

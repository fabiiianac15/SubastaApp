// Tokens de movimiento. Duraciones de interfaz < 300 ms; salidas más cortas que
// entradas; los springs quedan para gestos y seguimiento del puntero.
export const ease = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
};
export const dur = { press: 0.16, fast: 0.2, ui: 0.26, slow: 0.5, exit: 0.15 };
export const spring = {
  ui: { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 },
  soft: { type: 'spring', duration: 0.5, bounce: 0.15 },
  pointer: { stiffness: 170, damping: 22, mass: 0.5 },
  pop: { type: 'spring', stiffness: 520, damping: 16 },
};
export const STAGGER = 0.05;

// Entrada escalonada: se detiene pronto para que nunca bloquee la lectura.
export const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: dur.slow, ease: ease.out, delay: Math.min(i, 8) * STAGGER },
});

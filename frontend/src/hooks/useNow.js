import { useSyncExternalStore } from 'react';

// Un solo reloj para toda la app; se detiene con la pestaña oculta.
const subs = new Set();
let now = Date.now();
let timer = null;

const tick = () => {
  now = Date.now();
  subs.forEach((fn) => fn());
};
const start = () => {
  if (!timer && !document.hidden) timer = setInterval(tick, 1000);
};
const stop = () => {
  clearInterval(timer);
  timer = null;
};
const onVisibility = () => {
  if (document.hidden) stop();
  else {
    tick();
    start();
  }
};

const subscribe = (fn) => {
  if (subs.size === 0) {
    document.addEventListener('visibilitychange', onVisibility);
    start();
  }
  subs.add(fn);
  return () => {
    subs.delete(fn);
    if (subs.size === 0) {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    }
  };
};

export const useNow = () => useSyncExternalStore(subscribe, () => now);

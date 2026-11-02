import '@testing-library/jest-dom';

// jsdom no trae estas API del navegador.
window.matchMedia = window.matchMedia || ((query) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
}));
window.scrollTo = () => {};
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./services/productService', () => ({
  __esModule: true,
  default: {
    obtenerSubastas: () => Promise.resolve({ data: [], pagination: { total: 0 } }),
    formatearMoneda: (n) => String(n),
    categorias: [{ value: 'arte', label: 'Arte' }],
  },
}));

test('la portada carga con su titular y el acceso', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/sube el precio/i);
  expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/auth');
});

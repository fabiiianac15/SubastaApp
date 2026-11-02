const LIMITE_MAXIMO = 100;

// Un texto de búsqueda es literal: no debe interpretarse como expresión regular.
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// express convierte ?campo[$ne]=x en un objeto; los filtros solo aceptan texto.
const texto = (valor) => (typeof valor === 'string' ? valor : undefined);

const paginacion = ({ pagina, limite }, limitePorDefecto = 12) => {
  const p = Math.max(1, parseInt(pagina, 10) || 1);
  const l = Math.min(LIMITE_MAXIMO, Math.max(1, parseInt(limite, 10) || limitePorDefecto));
  return { pagina: p, limite: l, skip: (p - 1) * l };
};

const respuestaPaginacion = ({ pagina, limite }, total) => ({
  paginaActual: pagina,
  totalPaginas: Math.ceil(total / limite),
  total,
  limite,
});

module.exports = { escaparRegex, texto, paginacion, respuestaPaginacion };

// Devuelve el id como texto tanto si la referencia viene poblada como si no.
// Los pre-hooks de Bid y Product hacen populate, así que `doc.campo.toString()`
// no sirve para comparar dueños.
const idDe = (ref) => String(ref && ref._id ? ref._id : ref);

const mismoId = (a, b) => idDe(a) === idDe(b);

module.exports = { idDe, mismoId };

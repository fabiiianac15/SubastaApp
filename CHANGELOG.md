# Historial de cambios

## Rama `redesign/ui`

### Repositorio

- `.env`, `node_modules` y `backend/uploads` dejan de versionarse. Siguen en el historial de git anterior a esta rama.
- Scripts raíz: `setup`, `seed`, `dev` y `test`, más archivos `.env.example`.

### Interfaz

- Sistema de diseño nuevo con tema oscuro y claro funcional, y tipografía autoalojada.
- Portada, acceso y todas las páginas del panel rediseñadas, con versión móvil.
- Marco del panel persistente entre rutas. Se elimina la carga simulada de 1,5 s al navegar.
- La búsqueda del encabezado funciona, y «Para ti» y «Mi actividad» ya tienen enlace.
- Se corrige el error de compilación de `handleViewDetails`, que dejaba toda la app con la pantalla de error.
- Se retiran cifras inventadas (usuarios, transacciones, reseñas), promesas sin respaldo y la imagen de relleno en subastas sin foto.
- El pago se presenta como demostración y solo confirma cuando el servidor lo registra.
- El formulario de acceso muestra el error sin recargar la página tras un 401.

### Autenticación

- `pre('save')` de `User` no devolvía tras `next()`: rehasheaba la contraseña o fallaba al editar el perfil.
- El login ya no revela si un correo existe, y devuelve teléfono y dirección para el perfil.
- Un token de una cuenta eliminada responde 401 en lugar de 500.
- Cambiar la contraseña aplica la misma regla que el registro.
- Eliminar una cuenta borra de verdad sus ofertas (filtraba por un campo inexistente), notificaciones, actividad e imágenes, y repone el precio de las subastas afectadas.

### Ofertas

- Pagar y retirar devolvían siempre 403 porque comparaban un postor ya poblado.
- Retirar era imposible por la regla anterior. Ahora se pueden retirar las ofertas superadas durante 30 minutos.
- Reserva atómica del precio: de dos ofertas simultáneas gana una y la otra recibe 409.
- Las respuestas públicas ya no exponen correo, IP ni `userAgent` de los postores, ni el correo del vendedor.
- `Mis pujas` recibe las imágenes del lote.
- Notificaciones reales de oferta superada, nueva oferta y pago recibido.
- Se elimina un registro de analítica que corrompía documentos de `UserActivity`.

### Subastas

- Apertura y cierre automáticos según las fechas, con ganador y avisos.
- Validación en el servidor al crear, incluida la imagen obligatoria.
- Un error dentro del callback de multer ya no apaga el servidor.
- La búsqueda trata el texto como literal: `(` daba 500 y se aceptaban expresiones regulares arbitrarias.
- Las subastas privadas y los borradores ajenos ya no aparecen en listados ni en el detalle.
- Cancelar avisa a los postores. Editar el precio sin ofertas actualiza el precio actual.
- Eliminar una subasta borra sus archivos.

### Analítica

- Una sesión sin ubicación se registra como desconocida en lugar de responder 400.
- Cada cuenta solo puede tocar sus sesiones y ver su propio reporte, que antes exponía a todos los usuarios.

### Servidor y pruebas

- `app.js` separado de `server.js`, CORS por variable de entorno, `/api/health` y límite estricto en login y registro.
- El arranque se detiene con un mensaje claro si falta configuración, y los errores 500 no exponen detalles.
- 13 pruebas de integración con `node:test` y una prueba de la portada con Jest.

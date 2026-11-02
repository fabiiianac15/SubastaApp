# API de SubastApp

Base: `http://localhost:5000/api`. Todas las respuestas son JSON con esta forma:

```json
{ "success": true, "message": "opcional", "data": {}, "pagination": {} }
```

Los errores traen `success: false`, `message` y, en validaciones, `errors` con el detalle por campo.

Las rutas marcadas con *token* piden el encabezado `Authorization: Bearer <token>`. El token se obtiene al registrarse o iniciar sesión.

| Código | Significado |
| --- | --- |
| 400 | Datos inválidos o regla de negocio incumplida |
| 401 | Falta el token, no es válido, o las credenciales son incorrectas |
| 403 | El rol o el dueño no coinciden |
| 404 | No existe, o el id está mal formado |
| 409 | Conflicto: otra oferta o cambio de estado llegó primero |
| 429 | Límite superado: 1000 peticiones cada 15 minutos por IP, y 50 en login y registro |

Los listados aceptan `pagina` y `limite` (máximo 100) y responden `pagination` con `paginaActual`, `totalPaginas`, `total` y `limite`.

## Sistema

| Método | Ruta | Acceso | Uso |
| --- | --- | --- | --- |
| GET | `/health` | Público | Comprobar que la API responde |

## Autenticación: `/auth`

| Método | Ruta | Acceso | Uso |
| --- | --- | --- | --- |
| POST | `/register` | Público | Crear cuenta |
| POST | `/login` | Público | Iniciar sesión |
| GET | `/profile` | Token | Ver el perfil |
| PUT | `/profile` | Token | Editar el perfil |
| PUT | `/change-password` | Token | Cambiar la contraseña |
| DELETE | `/profile` | Token | Eliminar la cuenta y sus datos. Cuerpo: `{ "password" }` |

La contraseña necesita 6 caracteres o más, con minúscula, mayúscula y número.

```bash
curl -X POST localhost:5000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"comprador@demo.subastapp.co","password":"Demo1234"}'
```

## Subastas: `/products`

| Método | Ruta | Acceso | Uso |
| --- | --- | --- | --- |
| GET | `/` | Público | Listar |
| GET | `/:id` | Público | Detalle con las últimas 10 ofertas. Suma una vista |
| GET | `/vendedor/mis-subastas` | Vendedor | Listar las propias, con estadísticas por estado |
| POST | `/` | Vendedor | Crear (`multipart/form-data`) |
| PUT | `/:id` | Dueño | Editar |
| DELETE | `/:id` | Dueño | Eliminar. Con ofertas exige `?forzar=true` y las borra también |
| PATCH | `/:id/estado` | Dueño | Cambiar estado. Cuerpo: `{ "estado" }` |

Filtros de `GET /`: `categoria`, `estado` (por defecto `activo`; `todas` incluye activas, pausadas y finalizadas), `busqueda`, `precioMin`, `precioMax` y `ordenar` (por ejemplo `-numeroOfertas`, `fechaFin`, `precioActual`). Si la petición lleva token, también aparecen las subastas privadas propias o donde hay invitación.

Campos de creación: `titulo` (5 a 100), `descripcion` (10 a 2000), `categoria` (`tecnologia`, `moda`, `hogar`, `deportes`, `arte`, `vehiculos`, `otros`), `precioInicial`, `porcentajeMinimo` (1 a 50), `fechaInicio`, `fechaFin` (al menos 1 hora después), `tipoSubasta` (`publica`, `privada`), `condiciones`, `tags` (separadas por comas) e `imagenes` (de 1 a 5 archivos JPG, PNG, GIF o WEBP de hasta 5 MB).

## Ofertas: `/bids`

| Método | Ruta | Acceso | Uso |
| --- | --- | --- | --- |
| POST | `/products/:productId/ofertas` | Comprador | Ofertar. Cuerpo: `{ "monto", "mensaje?" }` |
| GET | `/products/:productId/ofertas` | Público | Ofertas de un lote. Filtro `estado` (por defecto `activa`; admite `todas`) |
| GET | `/products/:productId/historial-ofertas` | Dueño del lote | Historial completo con correos y análisis por postor |
| GET | `/mis-ofertas` | Comprador | Ofertas propias, con estadísticas por estado |
| DELETE | `/:id` | Dueño de la oferta | Retirar una oferta superada, hasta 30 minutos después de hacerla |
| PATCH | `/:id/pagar` | Dueño de la oferta | Registrar el pago de una oferta ganadora. Cuerpo: `{ "metodoPago", "transaccionId" }` |

`metodoPago` acepta `tarjeta_credito`, `tarjeta_debito`, `transferencia` y `efectivo`.

## Notificaciones: `/notifications`

Todas piden token y solo operan sobre las del usuario.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/` | Listar |
| GET | `/contador` | Número de no leídas |
| PATCH | `/:id/leer` | Marcar una como leída |
| PATCH | `/leer-todas` | Marcar todas |
| DELETE | `/:id` | Eliminar |

La API genera estos avisos: oferta superada, nueva oferta (al vendedor), subasta ganada, subasta adjudicada o sin ofertas (al vendedor), subasta cancelada (a los postores) y pago recibido (al vendedor).

## Analítica: `/analytics`

Todas piden token y solo operan sobre las sesiones del usuario.

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/session/start` | Iniciar sesión de seguimiento. Cuerpo opcional: `{ "ubicacionNavegador" }` |
| PUT | `/session/:sessionId/tiempo` | Actualizar el tiempo de uso |
| POST | `/session/:sessionId/categoria` | Registrar un clic en una categoría |
| POST | `/intento-subasta` | Registrar un intento de oferta o de publicación |
| GET | `/resumen` | Resumen de las últimas 20 sesiones |
| GET | `/reporte` | Reporte de las sesiones propias. Filtros `fechaInicio` y `fechaFin` |

En `backend/scripts/` hay consultas de ejemplo para Mongo y peticiones `.http`. Se escribieron antes de estos cambios: el reporte ya no admite `userId`.

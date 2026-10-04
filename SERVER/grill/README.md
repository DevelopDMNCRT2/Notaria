# Grill · Cuestionario de requerimientos del Asistente Notarial

Landing tipo Typeform para que la notaría conteste el cuestionario con el que se arma el perfil del asistente.
Es **temporal y desechable**: todo vive en piezas aisladas.

## Piezas

| Dónde | Qué |
|---|---|
| `SERVER/grill/questions.js` | Preguntas, secciones, bienvenida y despedida (edítalas aquí, sin tocar la UI) |
| `SERVER/grill/index.js` | Tablas `grill_*` (se crean solas al arrancar) y rutas `/api/grill/*` |
| `SERVER/grill/export.js` | Export JSON / Markdown agrupado por sección |
| `SERVER/grill/create-session.js` | Crea un link desde la terminal |
| `SERVER/grill/drop.sql` | Borra las tablas |
| `PAGE/grill.html` + `PAGE/src/grill/` | La landing (`/grill/:token`) |
| `ADMIN/src/views/Grill.vue` | Vista admin: crear links, ver respuestas, descargar export y archivos |
| Archivos subidos | MinIO, bucket `notaria-documentos`, prefijo `grill/<session_id>/` |

## Uso

```bash
# Crear link (en el VPS)
docker exec notaria_server node grill/create-session.js "Haydé"
```

O desde el admin → **Cuestionario** → "Crear link". El admin pide confirmar usuario/contraseña
(rol Operativo no tiene acceso). El export Markdown es el insumo para el perfil del agente.

- Las respuestas se guardan con debounce mientras escribe y al avanzar; si se cae la red quedan en
  `localStorage` y se reenvían al volver.
- Respuesta = `{ value, ask_lic }` en `grill_answers.answer` (JSONB). Fichas: `repeat_index` 0..n.
- Cambiar una `key` en `questions.js` no borra respuestas viejas: salen en el export como
  "preguntas que ya no están".
- Variables opcionales del server: `GRILL_PUBLIC_URL` (base de los links), `GRILL_ADMIN_SECRET`
  (firma del acceso admin; si no está, se genera al arrancar y hay que volver a entrar tras reiniciar).

## Privacidad
- `noindex` (meta + `X-Robots-Tag`), `Referrer-Policy: no-referrer`, sin caché.
- El token no se loguea: el logger de `SERVER/index.js` salta `/api/grill` y el nginx de PAGE
  tiene `access_log off` en `/grill/` y `/api/grill/`. El nginx del host del VPS necesita lo mismo
  (ver abajo).

## Nginx del host (VPS, `/etc/nginx/sites-enabled/notaria.conf`, bloque `notaria.74.208.149.57.nip.io`)

```nginx
client_max_body_size 160m;          # sin esto las subidas > 1 MB fallan con 413
location ~ ^/(grill|api/grill)/ {
    access_log off;                  # el token va en la URL
    error_log /var/log/nginx/error.log error;
    proxy_request_buffering off;
    proxy_pass http://127.0.0.1:9189;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Cómo quitarlo

1. Exporta lo que necesites desde el admin.
2. Borra `SERVER/grill/`, `PAGE/grill.html`, `PAGE/src/grill/`, `ADMIN/src/views/Grill.vue`.
3. Quita las líneas marcadas con "grill" en: `SERVER/index.js` (require + logger),
   `PAGE/vite.config.js` (entrada `grill`, rewrite y proxy), `PAGE/nginx.conf` (bloque `--- grill ---`),
   `ADMIN/src/router/index.ts`, `ADMIN/src/components/layout/AppSidebar.vue`,
   `docker-compose.yml` (`GRILL_PUBLIC_URL`) y el bloque del nginx del host.
4. `docker exec -i notaria_postgres psql -U notaria_user -d notaria_db < SERVER/grill/drop.sql`
5. Borra en MinIO el prefijo `grill/`.

// ============================================================
// Módulo "grill": cuestionario de requerimientos para configurar el Asistente Notarial.
// Autocontenido y desechable: se monta con una sola línea en SERVER/index.js.
// Para quitarlo: ver SERVER/grill/README.md
// ============================================================
const crypto = require('crypto');
const multer = require('multer');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const config = require('./questions');
const { buildExport, toMarkdown } = require('./export');

const MAX_FILE_MB = 15;
const MAX_REPEAT = 100;

// Mapa question_key -> { text, section, type, group? }
const QUESTION_MAP = {};
for (const q of config.questions) {
  if (q.type === 'repeatable_group') {
    for (const f of q.fields) QUESTION_MAP[f.key] = { ...f, section: q.section, group: q.key };
  } else {
    QUESTION_MAP[q.key] = q;
  }
}
const GROUPS = Object.fromEntries(config.questions.filter((q) => q.type === 'repeatable_group').map((q) => [q.key, q]));

const newToken = () => crypto.randomBytes(24).toString('base64url');

// ---------- Auth admin (token HMAC propio, sin tocar el login existente) ----------
const ADMIN_SECRET = process.env.GRILL_ADMIN_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_TTL_MS = 12 * 60 * 60 * 1000;

const signAdmin = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
};

const verifyAdmin = (token) => {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', ADMIN_SECRET).update(body).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
};

const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const user = verifyAdmin(auth.replace(/^Bearer\s+/i, ''));
  if (!user) return res.status(401).json({ error: 'No autorizado' });
  req.grillAdmin = user;
  next();
};

module.exports = function mountGrill(app, { pool, s3Client, bucket }) {
  const publicBaseUrl = () => (process.env.GRILL_PUBLIC_URL || '').replace(/\/$/, '');

  // ---------- Tablas ----------
  const ready = pool
    .query(`
      CREATE TABLE IF NOT EXISTS grill_sessions (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        respondent_name TEXT,
        status TEXT NOT NULL DEFAULT 'in_progress',
        meta JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMPTZ
      );
      CREATE TABLE IF NOT EXISTS grill_answers (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES grill_sessions(id) ON DELETE CASCADE,
        section_key TEXT NOT NULL,
        question_key TEXT NOT NULL,
        question_text TEXT,
        answer JSONB,
        repeat_index INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (session_id, question_key, repeat_index)
      );
      CREATE TABLE IF NOT EXISTS grill_files (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES grill_sessions(id) ON DELETE CASCADE,
        question_key TEXT NOT NULL,
        file_path TEXT NOT NULL,
        original_name TEXT,
        mime TEXT,
        size INTEGER,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `)
    .then(() => console.log('Tablas grill verificadas.'))
    .catch((err) => console.error('Error al inicializar tablas grill:', err.message));

  const createSession = async (respondentName) => {
    await ready;
    const { rows } = await pool.query(
      'INSERT INTO grill_sessions (token, respondent_name) VALUES ($1, $2) RETURNING id, token, respondent_name, status, created_at',
      [newToken(), respondentName || null]
    );
    return rows[0];
  };

  const loadSession = async (token) => {
    if (!token || token.length < 20) return null;
    const { rows } = await pool.query('SELECT * FROM grill_sessions WHERE token = $1', [token]);
    return rows[0] || null;
  };

  // Resuelve la sesión del token o responde 404 (sin mencionar el token en logs).
  const withSession = (handler) => async (req, res) => {
    try {
      await ready;
      const session = await loadSession(req.params.token);
      if (!session) return res.status(404).json({ error: 'Link no válido' });
      await handler(req, res, session);
    } catch (err) {
      console.error('[grill] error:', err.message);
      res.status(500).json({ error: 'Error del servidor' });
    }
  };

  const touch = (sessionId) => pool.query('UPDATE grill_sessions SET updated_at = NOW() WHERE id = $1', [sessionId]);

  const groupCount = async (session, groupKey) => {
    const fieldKeys = GROUPS[groupKey].fields.map((f) => f.key);
    const { rows } = await pool.query(
      'SELECT COALESCE(MAX(repeat_index) + 1, 0) AS n FROM grill_answers WHERE session_id = $1 AND question_key = ANY($2)',
      [session.id, fieldKeys]
    );
    return Math.max(Number(rows[0].n), Number(session.meta?.groups?.[groupKey] || 0));
  };

  const listFiles = async (sessionId) =>
    (
      await pool.query(
        'SELECT id, question_key, original_name, mime, size, created_at FROM grill_files WHERE session_id = $1 ORDER BY created_at ASC',
        [sessionId]
      )
    ).rows;

  // Sin caché y sin indexar en todas las respuestas del grill.
  app.use('/api/grill', (req, res, next) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.set('Cache-Control', 'no-store');
    next();
  });

  // ============================================================
  // --- RUTAS PÚBLICAS (por token) ---
  // ============================================================

  app.get('/api/grill/s/:token', withSession(async (req, res, session) => {
    const { rows } = await pool.query(
      'SELECT question_key, repeat_index, answer FROM grill_answers WHERE session_id = $1',
      [session.id]
    );
    const groups = {};
    for (const key of Object.keys(GROUPS)) groups[key] = await groupCount(session, key);
    res.json({
      session: {
        respondent_name: session.respondent_name,
        status: session.status,
        submitted_at: session.submitted_at,
        last_step: session.meta?.last_step || null,
        groups,
      },
      config,
      answers: rows,
      files: await listFiles(session.id),
    });
  }));

  // Upsert de respuestas: { answers: [{ question_key, repeat_index, value, ask_lic }] }
  app.put('/api/grill/s/:token/answers', withSession(async (req, res, session) => {
    const list = Array.isArray(req.body?.answers) ? req.body.answers : [];
    if (!list.length || list.length > 50) return res.status(400).json({ error: 'Formato inválido' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const a of list) {
        const q = QUESTION_MAP[a.question_key];
        const idx = q?.group ? Number(a.repeat_index) : 0;
        if (!q || !Number.isInteger(idx) || idx < 0 || idx >= MAX_REPEAT) continue;
        const value = a.value ?? null;
        const askLic = !!a.ask_lic;
        const empty = value === null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length);
        if (empty && !askLic) {
          await client.query(
            'DELETE FROM grill_answers WHERE session_id = $1 AND question_key = $2 AND repeat_index = $3',
            [session.id, a.question_key, idx]
          );
          continue;
        }
        await client.query(
          `INSERT INTO grill_answers (session_id, section_key, question_key, question_text, answer, repeat_index, updated_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())
           ON CONFLICT (session_id, question_key, repeat_index)
           DO UPDATE SET answer = EXCLUDED.answer, question_text = EXCLUDED.question_text,
                         section_key = EXCLUDED.section_key, updated_at = NOW()`,
          [session.id, q.section, a.question_key, q.text, JSON.stringify({ value, ask_lic: askLic }), idx]
        );
      }
      await client.query('UPDATE grill_sessions SET updated_at = NOW() WHERE id = $1', [session.id]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    res.json({ ok: true, saved_at: new Date().toISOString() });
  }));

  // Recordar en qué pantalla se quedó.
  app.put('/api/grill/s/:token/progress', withSession(async (req, res, session) => {
    const step = typeof req.body?.last_step === 'string' ? req.body.last_step.slice(0, 120) : null;
    await pool.query(
      `UPDATE grill_sessions SET meta = jsonb_set(meta, '{last_step}', to_jsonb($2::text)) WHERE id = $1`,
      [session.id, step]
    );
    res.json({ ok: true });
  }));

  // Agregar una ficha (repeatable_group). Devuelve el nuevo índice.
  app.post('/api/grill/s/:token/group/:group', withSession(async (req, res, session) => {
    const groupKey = req.params.group;
    if (!GROUPS[groupKey]) return res.status(404).json({ error: 'Grupo inexistente' });
    const n = await groupCount(session, groupKey);
    if (n >= MAX_REPEAT) return res.status(400).json({ error: 'Demasiadas fichas' });
    await pool.query(
      `UPDATE grill_sessions SET updated_at = NOW(),
         meta = jsonb_set(jsonb_set(meta, '{groups}', COALESCE(meta->'groups', '{}'::jsonb)), ARRAY['groups', $2::text], to_jsonb($3::int))
       WHERE id = $1`,
      [session.id, groupKey, n + 1]
    );
    res.json({ index: n, count: n + 1 });
  }));

  // Quitar una ficha y recorrer los índices posteriores.
  app.delete('/api/grill/s/:token/group/:group/:index', withSession(async (req, res, session) => {
    const groupKey = req.params.group;
    const idx = Number(req.params.index);
    if (!GROUPS[groupKey] || !Number.isInteger(idx) || idx < 0) return res.status(400).json({ error: 'Parámetros inválidos' });
    const fieldKeys = GROUPS[groupKey].fields.map((f) => f.key);
    const n = await groupCount(session, groupKey);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'DELETE FROM grill_answers WHERE session_id = $1 AND question_key = ANY($2) AND repeat_index = $3',
        [session.id, fieldKeys, idx]
      );
      // Dos pasos para no chocar con el UNIQUE al recorrer índices.
      await client.query(
        'UPDATE grill_answers SET repeat_index = -repeat_index - 1000 WHERE session_id = $1 AND question_key = ANY($2) AND repeat_index > $3',
        [session.id, fieldKeys, idx]
      );
      await client.query(
        'UPDATE grill_answers SET repeat_index = -(repeat_index + 1000) - 1 WHERE session_id = $1 AND question_key = ANY($2) AND repeat_index < 0',
        [session.id, fieldKeys]
      );
      await client.query(
        `UPDATE grill_sessions SET updated_at = NOW(),
           meta = jsonb_set(jsonb_set(meta, '{groups}', COALESCE(meta->'groups', '{}'::jsonb)), ARRAY['groups', $2::text], to_jsonb($3::int))
         WHERE id = $1`,
        [session.id, groupKey, Math.max(n - 1, 0)]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    res.json({ ok: true, count: Math.max(n - 1, 0) });
  }));

  // Subida de archivos (varios) a MinIO bajo grill/<session_id>/
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: 10 },
    defParamCharset: 'utf8',
    fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype) || file.mimetype === 'application/pdf'),
  });

  app.post('/api/grill/s/:token/files/:question', (req, res, next) => {
    upload.array('files', 10)(req, res, (err) => {
      if (err) {
        const msg = err.code === 'LIMIT_FILE_SIZE' ? `Cada archivo debe pesar máximo ${MAX_FILE_MB} MB` : 'No se pudo subir el archivo';
        return res.status(400).json({ error: msg });
      }
      next();
    });
  }, withSession(async (req, res, session) => {
    const q = QUESTION_MAP[req.params.question];
    if (!q || q.type !== 'file_upload') return res.status(400).json({ error: 'Pregunta inválida' });
    if (!req.files?.length) return res.status(400).json({ error: 'Solo se aceptan imágenes o PDF' });
    for (const file of req.files) {
      const safeName = file.originalname.normalize('NFD').replace(/[^\w.\-]+/g, '_').slice(-80);
      const key = `grill/${session.id}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeName}`;
      await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }));
      await pool.query(
        'INSERT INTO grill_files (session_id, question_key, file_path, original_name, mime, size) VALUES ($1, $2, $3, $4, $5, $6)',
        [session.id, q.key, key, file.originalname, file.mimetype, file.size]
      );
    }
    await touch(session.id);
    res.status(201).json({ files: await listFiles(session.id) });
  }));

  app.delete('/api/grill/s/:token/files/:id', withSession(async (req, res, session) => {
    const { rows } = await pool.query(
      'DELETE FROM grill_files WHERE id = $1 AND session_id = $2 RETURNING file_path',
      [Number(req.params.id) || 0, session.id]
    );
    if (rows[0]) {
      s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: rows[0].file_path })).catch(() => {});
    }
    await touch(session.id);
    res.json({ files: await listFiles(session.id) });
  }));

  app.post('/api/grill/s/:token/submit', withSession(async (req, res, session) => {
    await pool.query(
      "UPDATE grill_sessions SET status = 'submitted', submitted_at = NOW(), updated_at = NOW() WHERE id = $1",
      [session.id]
    );
    res.json({ ok: true });
  }));

  // ============================================================
  // --- RUTAS ADMIN ---
  // ============================================================

  // Re-autenticación con las credenciales del admin existente (rol Operativo no tiene acceso).
  app.post('/api/grill/admin/login', async (req, res) => {
    const { usuario, password } = req.body || {};
    if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    try {
      const { rows } = await pool.query(
        'SELECT * FROM usuarios WHERE "Usuario" = $1 AND "Contraseña" = $2 LIMIT 1',
        [usuario, password]
      );
      const user = rows[0];
      if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });
      if ((user.Rol || user.rol) === 'Operativo') return res.status(403).json({ error: 'Sin permiso' });
      res.json({ token: signAdmin({ id: user.id, usuario: user.Usuario || user.usuario, exp: Date.now() + ADMIN_TTL_MS }) });
    } catch (err) {
      console.error('[grill] error en login:', err.message);
      res.status(500).json({ error: 'Error del servidor' });
    }
  });

  app.get('/api/grill/admin/sessions', requireAdmin, async (req, res) => {
    await ready;
    const { rows } = await pool.query(`
      SELECT s.id, s.token, s.respondent_name, s.status, s.created_at, s.updated_at, s.submitted_at,
        (SELECT COUNT(*) FROM grill_answers a WHERE a.session_id = s.id)::int AS answers_count,
        (SELECT COUNT(*) FROM grill_files f WHERE f.session_id = s.id)::int AS files_count
      FROM grill_sessions s ORDER BY s.created_at DESC
    `);
    res.json({ public_base_url: publicBaseUrl(), sessions: rows });
  });

  app.post('/api/grill/admin/sessions', requireAdmin, async (req, res) => {
    const name = typeof req.body?.respondent_name === 'string' ? req.body.respondent_name.trim().slice(0, 120) : null;
    const s = await createSession(name);
    res.status(201).json(s);
  });

  app.delete('/api/grill/admin/sessions/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id) || 0;
    const { rows: files } = await pool.query('SELECT file_path FROM grill_files WHERE session_id = $1', [id]);
    await pool.query('DELETE FROM grill_sessions WHERE id = $1', [id]);
    for (const f of files) s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: f.file_path })).catch(() => {});
    res.sendStatus(204);
  });

  app.get('/api/grill/admin/sessions/:id/export', requireAdmin, async (req, res) => {
    const id = Number(req.params.id) || 0;
    const { rows: [session] } = await pool.query('SELECT * FROM grill_sessions WHERE id = $1', [id]);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    const { rows: answers } = await pool.query(
      'SELECT * FROM grill_answers WHERE session_id = $1 ORDER BY question_key, repeat_index',
      [id]
    );
    const { rows: files } = await pool.query('SELECT * FROM grill_files WHERE session_id = $1 ORDER BY created_at', [id]);
    const data = buildExport(session, answers, files);
    const slug = (session.respondent_name || `sesion-${id}`).normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase();
    if (req.query.format === 'md') {
      res.set('Content-Type', 'text/markdown; charset=utf-8');
      if (req.query.download) res.set('Content-Disposition', `attachment; filename="grill-${slug}.md"`);
      return res.send(toMarkdown(data));
    }
    if (req.query.download) res.set('Content-Disposition', `attachment; filename="grill-${slug}.json"`);
    res.json(data);
  });

  app.get('/api/grill/admin/files/:id', requireAdmin, async (req, res) => {
    const { rows: [file] } = await pool.query('SELECT * FROM grill_files WHERE id = $1', [Number(req.params.id) || 0]);
    if (!file) return res.status(404).json({ error: 'Archivo no encontrado' });
    try {
      const obj = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: file.file_path }));
      res.set('Content-Type', file.mime || 'application/octet-stream');
      res.set('Content-Disposition', `${req.query.download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.original_name || 'archivo')}`);
      obj.Body.pipe(res);
    } catch (err) {
      console.error('[grill] error leyendo archivo:', err.message);
      res.status(500).json({ error: 'No se pudo leer el archivo' });
    }
  });

  return { createSession, ready };
};

module.exports.QUESTION_MAP = QUESTION_MAP;

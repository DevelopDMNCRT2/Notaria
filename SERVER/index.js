const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// --- CONFIGURACIÓN DE AWS S3 / MINIO ---
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'notaria_admin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'Notaria2026SecurePass!',
  },
};

if (process.env.S3_ENDPOINT) {
  s3Config.endpoint = process.env.S3_ENDPOINT;
  s3Config.forcePathStyle = true;
}

const s3Client = new S3Client(s3Config);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // Límite 50MB
});

const app = express();
const PORT = process.env.PORT || 3000;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://dmncrt.app.n8n.cloud/webhook/notaria-asistente';
const N8N_CONFIRMAR_CITA_URL = 'https://dmncrt.app.n8n.cloud/webhook/notaria-confirmar-cita';
const N8N_RECHAZAR_CITA_URL  = 'https://dmncrt.app.n8n.cloud/webhook/notaria-rechazar-cita';

app.use(cors({
  origin: function (origin, callback) {
    // Permite subdominios vercel, localhost, IP del VPS o sin origin
    if (!origin || /\.vercel\.app$/.test(origin) || /^http:\/\/localhost/.test(origin) || /^http:\/\/74\.208\.149\.57/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true
}));
app.use(bodyParser.json());

// ============================================================
// --- ENDPOINTS DE ALMACENAMIENTO (MINIO / S3) ---
// ============================================================

// Subida directa multipart a MinIO/S3
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo en el campo "file"' });
    }

    const key = `documentos/${Date.now()}-${req.file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || 'notaria-documentos',
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await s3Client.send(command);

    res.status(201).json({
      success: true,
      key,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      viewUrl: `/api/files/view/${encodeURIComponent(key)}`,
      downloadUrl: `/api/files/download/${encodeURIComponent(key)}`,
    });
  } catch (error) {
    console.error('Error al subir archivo a MinIO/S3:', error);
    res.status(500).json({ error: error.message });
  }
});

// Streaming de previsualización directa desde MinIO/S3
app.get('/api/files/view/*key', async (req, res) => {
  try {
    const rawKey = req.params.key;
    const key = Array.isArray(rawKey) ? rawKey.join('/') : rawKey;
    if (!key) return res.status(400).json({ error: 'Key requerida' });

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || 'notaria-documentos',
      Key: key,
    });

    const data = await s3Client.send(command);
    if (data.ContentType) {
      res.setHeader('Content-Type', data.ContentType);
    }
    res.setHeader('Content-Disposition', 'inline');
    if (data.ContentLength) {
      res.setHeader('Content-Length', data.ContentLength);
    }
    data.Body.pipe(res);
  } catch (error) {
    console.error('Error al visualizar archivo de MinIO:', error);
    res.status(500).json({ error: error.message });
  }
});

// Streaming de descarga forzada desde MinIO/S3
app.get('/api/files/download/*key', async (req, res) => {
  try {
    const rawKey = req.params.key;
    const key = Array.isArray(rawKey) ? rawKey.join('/') : rawKey;
    if (!key) return res.status(400).json({ error: 'Key requerida' });

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || 'notaria-documentos',
      Key: key,
    });

    const data = await s3Client.send(command);
    const filename = key.split('/').pop() || 'archivo';
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    if (data.ContentType) {
      res.setHeader('Content-Type', data.ContentType);
    }
    if (data.ContentLength) {
      res.setHeader('Content-Length', data.ContentLength);
    }
    data.Body.pipe(res);
  } catch (error) {
    console.error('Error al descargar archivo de MinIO:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar archivo de MinIO/S3
app.delete('/api/files/*key', async (req, res) => {
  try {
    const rawKey = req.params.key;
    const key = Array.isArray(rawKey) ? rawKey.join('/') : rawKey;
    if (!key) return res.status(400).json({ error: 'Key requerida' });

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || 'notaria-documentos',
      Key: key,
    });

    await s3Client.send(command);
    res.json({ success: true, message: 'Archivo eliminado de MinIO' });
  } catch (error) {
    console.error('Error al eliminar archivo de MinIO:', error);
    res.status(500).json({ error: error.message });
  }
});

// Genera una URL prefirmada para subir un archivo (legacy fallback)
app.post('/api/upload', async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName y fileType son requeridos' });
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || 'notaria-documentos',
      Key: `documentos/${Date.now()}-${fileName}`,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    res.status(200).json({ uploadUrl, key: command.input.Key });
  } catch (error) {
    console.error('Error generando URL de S3:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar archivos del bucket S3 / MinIO
app.get('/api/files', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME || 'notaria-documentos',
    });

    const data = await s3Client.send(command);
    const files = (data.Contents || [])
      .filter(item => item.Size > 0)
      .map(item => {
        const parts = item.Key.split('/');
        const rawName = parts[parts.length - 1];
        const cleanName = rawName.replace(/^\d+-/, '');
        return {
          key: item.Key,
          name: cleanName || rawName,
          size: item.Size,
          lastModified: item.LastModified,
          url: `/api/files/view/${encodeURIComponent(item.Key)}`,
          downloadUrl: `/api/files/download/${encodeURIComponent(item.Key)}`,
        };
      })
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    res.json(files);
  } catch (error) {
    console.error('Error listando archivos de S3:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas de almacenamiento de S3 (espacio usado real)
app.get('/api/storage', async (req, res) => {
  try {
    const LIMIT_GB = 50;
    const LIMIT_BYTES = LIMIT_GB * 1024 * 1024 * 1024;

    let totalBytes = 0;
    let isTruncated = true;
    let continuationToken = undefined;

    // Paginar por si hay más de 1000 archivos
    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME,
        ContinuationToken: continuationToken,
      });

      const data = await s3Client.send(command);
      const contents = data.Contents || [];

      // Sumar tamaño de todos los objetos (excluir carpetas)
      contents.filter(item => item.Size > 0).forEach(item => {
        totalBytes += item.Size;
      });

      isTruncated = data.IsTruncated;
      continuationToken = data.NextContinuationToken;
    }

    const usedGB = totalBytes / (1024 * 1024 * 1024);
    const usedPercent = Math.min((totalBytes / LIMIT_BYTES) * 100, 100);

    res.json({
      usedBytes: totalBytes,
      usedGB: parseFloat(usedGB.toFixed(2)),
      limitGB: LIMIT_GB,
      limitBytes: LIMIT_BYTES,
      usedPercent: parseFloat(usedPercent.toFixed(2)),
    });
  } catch (error) {
    console.error('Error calculando almacenamiento de S3:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- CONFIGURACIÓN DE POSTGRESQL ---
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
});

// Inicializar tabla de Citas
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Citas (
        id SERIAL PRIMARY KEY,
        client_nombre TEXT NOT NULL,
        fecha DATE NOT NULL,
        horario TEXT,
        telefono TEXT,
        tramite TEXT,
        estado TEXT DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabla Citas verificada.');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
  }
};
initDB();

// ============================================================
// --- ENDPOINTS DE CITAS ---
// ============================================================

// Obtener todas las citas CONFIRMADAS (para el calendario)
app.get('/api/citas', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Citas WHERE estado = 'confirmado' ORDER BY fecha ASC, horario ASC");

    const events = result.rows.map(row => {
      try {
        const dateStr = (row.fecha instanceof Date) ? row.fecha.toISOString() : String(row.fecha);
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const start = `${datePart}T${row.horario || '00:00:00'}`;
        return {
          id: row.id.toString(),
          title: row.tramite || 'Cita',
          start: start,
          extendedProps: {
            nombre: row.client_nombre || 'Cliente',
            celular: row.telefono || ''
          }
        };
      } catch (e) {
        console.error('Error procesando fila de cita:', e, row);
        return null;
      }
    }).filter(e => e !== null);

    res.json(events);
  } catch (err) {
    console.error('Error en /api/citas:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener todas las citas PENDIENTES (solicitudes)
app.get('/api/solicitudes', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Citas WHERE estado = 'pendiente' ORDER BY created_at DESC");

    const normalized = result.rows.map(row => {
      try {
        const dateStr = (row.fecha instanceof Date) ? row.fecha.toISOString() : String(row.fecha);
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const start_date = `${datePart}T${row.horario || '00:00:00'}`;
        return {
          ...row,
          title: row.tramite || 'Solicitud',
          nombre: row.client_nombre || 'Cliente',
          celular: row.telefono || '',
          start_date: start_date
        };
      } catch (e) {
        console.error('Error procesando solicitud:', e, row);
        return null;
      }
    }).filter(e => e !== null);

    res.json(normalized);
  } catch (err) {
    console.error('Error en /api/solicitudes:', err);
    res.status(500).json({ error: err.message });
  }
});

// Confirmar, Rechazar o Reagendar solicitud (con integración n8n)
app.put('/api/solicitudes/:id', async (req, res) => {
  const { id } = req.params;
  const { status, fecha, horario } = req.body;

  try {
    if (status === 'rejected') {
      const rejectResult = await pool.query(
        'UPDATE Citas SET estado = $1 WHERE id = $2 RETURNING *',
        ['rechazado', id]
      );
      const cita = rejectResult.rows[0];
      // Notificar a n8n usando el mismo flujo central
      try {
        await fetch(N8N_CONFIRMAR_CITA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: cita.id,
            nombre: cita.client_nombre,
            telefono: cita.telefono,
            tramite: cita.tramite,
            fecha: cita.fecha,
            horario: cita.horario,
            estado: 'rechazado',
            webhook_destino: 'https://notaria-server.vercel.app/api/webhook'
          })
        });
        console.log(`❌ Cita ID ${id} rechazada y notificada a n8n`);
      } catch (n8nErr) {
        console.error('⚠️ Error al llamar n8n (rechazo):', n8nErr.message);
      }
      return res.json({ message: 'Solicitud rechazada', cita });
    }

    if (status === 'rescheduled') {
      if (!fecha || !horario) {
        return res.status(400).json({ error: 'fecha y horario son requeridos para reagendar' });
      }
      const result = await pool.query(
        'UPDATE Citas SET estado = $1, fecha = $2, horario = $3 WHERE id = $4 RETURNING *',
        ['reagendado', fecha, horario, id]
      );
      const cita = result.rows[0];

      // Notificar reagendado a n8n
      try {
        await fetch(N8N_CONFIRMAR_CITA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: cita.id,
            nombre: cita.client_nombre,
            telefono: cita.telefono,
            tramite: cita.tramite,
            fecha: cita.fecha,
            horario: cita.horario,
            estado: 'reagendado',
            webhook_destino: 'https://notaria-server.vercel.app/api/webhook'
          })
        });
        console.log(`🔄 Cita ID ${id} reagendada y notificada a n8n`);
      } catch (n8nErr) {
        console.error('⚠️ Error al llamar n8n (reagendado):', n8nErr.message);
      }

      return res.json({ message: 'Cita reagendada', cita });
    }

    // Confirmar
    const result = await pool.query(
      'UPDATE Citas SET estado = $1 WHERE id = $2 RETURNING *',
      ['confirmado', id]
    );
    const cita = result.rows[0];

    // 2. Disparar flujo n8n para enviar confirmación al cliente via WhatsApp
    const n8nPayload = {
      id: cita.id,
      nombre: cita.client_nombre,
      telefono: cita.telefono,
      tramite: cita.tramite,
      fecha: cita.fecha,
      horario: cita.horario,
      estado: 'confirmado',
      webhook_destino: 'https://notaria-server.vercel.app/api/webhook'
    };

    try {
      await fetch(N8N_CONFIRMAR_CITA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload)
      });
      console.log(`✅ Flujo n8n disparado para cita ID ${id} (${cita.client_nombre})`);
    } catch (n8nErr) {
      console.error('⚠️ Error al llamar n8n:', n8nErr.message);
    }

    res.json(cita);
  } catch (err) {
    console.error('Error al actualizar solicitud:', err);
    res.status(500).json({ error: err.message });
  }
});

// Crear cita directamente desde admin
app.post('/api/citas', async (req, res) => {
  const { title, start, nombre, celular } = req.body;
  const [fecha, horario] = start.split('T');

  try {
    const result = await pool.query(
      'INSERT INTO Citas (tramite, fecha, horario, client_nombre, telefono, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, fecha, horario || '00:00:00', nombre, celular, 'confirmado']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear cita:', err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar cita del calendario
app.delete('/api/citas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Citas WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error al eliminar cita:', err);
    res.status(500).json({ error: err.message });
  }
});

// Modificar cita del calendario
app.put('/api/citas/:id', async (req, res) => {
  const { id } = req.params;
  const { title, start, nombre, celular } = req.body;
  const [fechaStr, horarioStr] = start.split('T');
  const nuevoHorario = horarioStr || '00:00:00';

  try {
    // 1. Obtener la cita actual
    const currentRes = await pool.query('SELECT fecha, horario, estado FROM Citas WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    const current = currentRes.rows[0];

    // 2. Normalizar la fecha actual (de DB) para poder comparar (Y-m-d)
    const currentDate = current.fecha instanceof Date ? current.fecha : new Date(current.fecha);
    const currentDateStr = currentDate.toISOString().split('T')[0];

    // 3. Normalizar horario actual (hh:mm)
    const currentHorario = (current.horario || '00:00:00').substring(0, 5);
    const newHorarioCompare = nuevoHorario.substring(0, 5);

    // 4. Determinar si hubo cambios
    let nuevoEstado = current.estado;
    if (currentDateStr !== fechaStr || currentHorario !== newHorarioCompare) {
      nuevoEstado = 'reagendado';
    }

    // 5. Actualizar en base de datos
    const result = await pool.query(
      'UPDATE Citas SET tramite = $1, fecha = $2, horario = $3, client_nombre = $4, telefono = $5, estado = $6 WHERE id = $7 RETURNING *',
      [title, fechaStr, nuevoHorario, nombre, celular, nuevoEstado, id]
    );
    const citaActualizada = result.rows[0];

    // 6. Disparar flujo n8n para notificar al cliente via WhatsApp (Reagendado o Modificado)
    const n8nPayload = {
      id: citaActualizada.id,
      nombre: citaActualizada.client_nombre,
      telefono: citaActualizada.telefono,
      tramite: citaActualizada.tramite,
      fecha: citaActualizada.fecha,
      horario: citaActualizada.horario,
      estado: citaActualizada.estado,
      webhook_destino: 'https://notaria-server.vercel.app/api/webhook'
    };

    try {
      await fetch(N8N_CONFIRMAR_CITA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload)
      });
      console.log(`✅ Flujo n8n disparado para actualización de cita ID ${id} (${citaActualizada.client_nombre})`);
    } catch (n8nErr) {
      console.error('⚠️ Error al llamar n8n (actualización):', n8nErr.message);
    }

    res.json(citaActualizada);
  } catch (err) {
    console.error('Error al actualizar cita:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// --- ENDPOINTS DE MENSAJERÍA (Chat / WhatsApp) ---
// ============================================================

let messages = [];

app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.post('/api/reset', (req, res) => {
  messages = [];
  console.log('Historial de mensajes borrado.');
  res.json({ message: 'Chat reiniciado correctamente' });
});

// Recibir mensaje DESDE n8n (confirmación de cita u otro mensaje)
app.post('/api/webhook', (req, res) => {
  const { text, sender } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const newMessage = {
    id: messages.length + 1,
    sender: sender || 'Asistente AI',
    text,
    timestamp: new Date(),
    incoming: true
  };

  messages.push(newMessage);
  console.log('Mensaje recibido desde n8n:', newMessage);
  res.status(201).json(newMessage);
});

// Enviar mensaje A n8n (Chat del cliente)
app.post('/api/messages', async (req, res) => {
  const { text, SessionID } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const newMessage = {
    id: messages.length + 1,
    sender: 'Me',
    text,
    timestamp: new Date(),
    incoming: false
  };

  messages.push(newMessage);

  try {
    console.log('Enviando mensaje a n8n...');
    await axios.post(N8N_WEBHOOK_URL, {
      SessionID: SessionID || 'fallback-id',
      Message: text
    });
    console.log('Mensaje enviado a n8n exitosamente');
  } catch (error) {
    console.error('Error al enviar mensaje a n8n:', error.message);
  }

  res.status(201).json(newMessage);
});

// ============================================================
// ============================================================
// --- ENDPOINTS DE USUARIOS ---
// ============================================================

// Login: validar credenciales contra la tabla usuarios
app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  try {
    // La tabla usa columnas con mayúsculas ("Usuario", "Contraseña")
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE "Usuario" = $1 AND "Contraseña" = $2 LIMIT 1',
      [usuario, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.Nombre || user.nombre,
        usuario: user.Usuario || user.usuario,
        correo: user.Correo || user.correo,
        rol: user.Rol || user.rol
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
    const normalized = result.rows.map(row => ({
      id: row.id,
      nombre: row.Nombre || row.nombre,
      usuario: row.Usuario || row.usuario,
      correo: row.Correo || row.correo,
      password: row.Contraseña || row.contraseña,
      rol: row.Rol || row.rol,
      created_at: row.created_at
    }));
    res.json(normalized);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const { nombre, usuario, correo, password, rol } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios ("Nombre", "Usuario", "Correo", "Contraseña", "Rol") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, usuario, correo, password, rol]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, usuario, correo, password, rol } = req.body;
  try {
    let result;
    if (password) {
      result = await pool.query(
        'UPDATE usuarios SET "Nombre" = $1, "Usuario" = $2, "Correo" = $3, "Contraseña" = $4, "Rol" = $5 WHERE id = $6 RETURNING *',
        [nombre, usuario, correo, password, rol, id]
      );
    } else {
      result = await pool.query(
        'UPDATE usuarios SET "Nombre" = $1, "Usuario" = $2, "Correo" = $3, "Rol" = $4 WHERE id = $5 RETURNING *',
        [nombre, usuario, correo, rol, id]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ error: err.message });
  }
});


// ============================================================
// Exportar para Vercel (serverless) y también escuchar en local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
    console.log(`Conectado a n8n en: ${N8N_WEBHOOK_URL}`);
  });
}

module.exports = app;

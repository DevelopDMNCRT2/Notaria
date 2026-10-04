// Crea una sesión del grill e imprime el link con token.
// Uso en el VPS:  docker exec notaria_server node grill/create-session.js "Haydé"
// Local:          node grill/create-session.js "Haydé"   (con PG* en el entorno)
require('dotenv').config();
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  database: process.env.PGDATABASE || 'notaria_db',
  user: process.env.PGUSER || 'notaria_user',
  password: String(process.env.PGPASSWORD || ''),
  port: parseInt(process.env.PGPORT || '5435', 10),
});

(async () => {
  const name = process.argv[2] || null;
  const token = crypto.randomBytes(24).toString('base64url');
  const { rows } = await pool.query(
    'INSERT INTO grill_sessions (token, respondent_name) VALUES ($1, $2) RETURNING id',
    [token, name]
  );
  const base = (process.env.GRILL_PUBLIC_URL || 'http://localhost:9189').replace(/\/$/, '');
  console.log(`Sesión #${rows[0].id} creada para ${name || '(sin nombre)'}`);
  console.log(`${base}/grill/${token}`);
  await pool.end();
})().catch((err) => {
  console.error(err.message.includes('grill_sessions') ? 'La tabla grill_sessions no existe: arranca el server una vez primero.' : err.message);
  process.exit(1);
});

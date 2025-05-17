import dotenv from 'dotenv';
import express from 'express';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Pool } = pkg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createTable = `
CREATE TABLE IF NOT EXISTS stats (
  id SERIAL PRIMARY KEY,
  ip TEXT,
  user_agent TEXT,
  url TEXT,
  navigation_start BIGINT,
  dom_content_loaded INT,
  load_time INT,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

pool.query(createTable).then(() => {
  console.log('Таблиця створена або вже існує');
}).catch(err => {
  console.error('Помилка при створенні таблиці:', err);
});

app.post('/stats', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const { userAgent, url, navigationStart, domContentLoaded, loadTime } = req.body;

    await pool.query(
      `INSERT INTO stats (ip, user_agent, url, navigation_start, dom_content_loaded, load_time)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ip, userAgent, url, navigationStart, domContentLoaded, loadTime]
    );

    res.status(204).send();
  } catch (err) {
    console.error('Помилка при вставці в БД:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('Сервер запущено на http://localhost:3000');
});

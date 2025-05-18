import dotenv from 'dotenv';
import express from 'express';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import auth from 'basic-auth';

const { Pool } = pkg;
dotenv.config();

const USERNAME = process.env.VIEW_USER;
const PASSWORD = process.env.VIEW_PASS;

function checkAuth(req, res, next) {
  const credentials = auth(req);
  if (!credentials || credentials.name !== USERNAME || credentials.pass !== PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Protected Area"');
    return res.status(401).send('Access denied');
  }
  next();
}

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
  navigation_start TIMESTAMP,
  dom_content_loaded TIMESTAMP,
  load_time TIMESTAMP,
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

    const navigationStartDate = new Date(navigationStart).toISOString();
    const domContentLoadedDate = new Date(domContentLoaded).toISOString();
    const loadTimeDate = new Date(loadTime).toISOString();

    await pool.query(
      `INSERT INTO stats (ip, user_agent, url, navigation_start, dom_content_loaded, load_time)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ip, userAgent, url, navigationStartDate, domContentLoadedDate, loadTimeDate]
    );

    res.status(204).send();
  } catch (err) {
    console.error('Помилка при вставці в БД:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/info', checkAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stats ORDER BY created_at DESC');
    const rows = result.rows;

    let table = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Статистика</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f9f9f9;
              padding: 20px;
            }
            h1 {
              color: #333;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              background: #fff;
            }
            th, td {
              padding: 10px;
              text-align: left;
              border: 1px solid #ccc;
              font-size: 14px;
            }
            th {
              background-color: #f2f2f2;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #f1f1f1;
            }
          </style>
        </head>
        <body>
          <h1>📈 Статистика</h1>
          <table>
            <tr>
              <th>IP</th><th>User Agent</th><th>URL</th><th>Start</th>
              <th>DOM Loaded</th><th>Load Time</th><th>Created</th>
            </tr>`;
    for (const row of rows) {
      table += `<tr>
        <td>${row.ip}</td>
        <td>${row.user_agent}</td>
        <td>${row.url}</td>
        <td>${row.navigation_start}</td>
        <td>${row.dom_content_loaded}</td>
        <td>${row.load_time}</td>
        <td>${row.created_at}</td>
      </tr>`;
    }
    table += `</table></body></html>`;
    res.send(table);
  } catch (err) {
    res.status(500).send('Помилка при отриманні даних');
  }
});

app.listen(3000, () => {
  console.log('Сервер запущено на http://localhost:3000');
});

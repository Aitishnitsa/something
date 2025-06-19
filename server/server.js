import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import auth from 'basic-auth';

dotenv.config();

const USERNAME = process.env.VIEW_USER;
const PASSWORD = process.env.VIEW_PASS;
const API_BASE = process.env.API_BASE;

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

app.post('/stats', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const { userAgent, url, navigationStart, domContentLoaded, loadTime } = req.body;

    const newStat = {
      ip,
      user_agent: userAgent,
      url,
      navigation_start: new Date(navigationStart).toISOString(),
      dom_content_loaded: new Date(domContentLoaded).toISOString(),
      load_time: new Date(loadTime).toISOString(),
      created_at: new Date().toISOString(),
    };

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStat),
    });

    if (!response.ok) {
      throw new Error('Failed to save data to MockAPI');
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error saving data to MockAPI:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/info', checkAuth, async (req, res) => {
  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data from MockAPI');
    }

    const rows = await response.json();

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
    console.error('Error fetching data from MockAPI:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('Сервер запущено на http://localhost:3000');
});
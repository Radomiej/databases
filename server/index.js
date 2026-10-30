import express from 'express';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getFreeModels, postAiTutor } from './aiTutorRoute.js';

function loadLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/u);
  lines.forEach((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/u);
    if (!match || process.env[match[1]] !== undefined) return;
    const value = match[2].replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/u, '$1$2');
    process.env[match[1]] = value;
  });
}

loadLocalEnv(fileURLToPath(new URL('./.env', import.meta.url)));

const app = express();
const port = Number(process.env.PORT || 5187);

app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.use((request, response, next) => {
  const origin = request.headers.origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/u.test(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (request.method === 'OPTIONS') return response.status(204).end();
  return next();
});

app.get('/api/health', (_request, response) => response.json({
  ok: true,
  service: 'sql-learning-lab-backend',
}));

app.post('/api/ai/chat', postAiTutor);
app.get('/api/ai/free-models', getFreeModels);

app.use((_request, response) => response.status(404).json({ ok: false, errorType: 'not-found', message: 'Nie znaleziono endpointu.', hint: 'Sprawdź adres API.' }));

app.listen(port, '127.0.0.1', () => {
  console.log(`Backend SQL Lab działa na http://localhost:${port}`);
});

import express from 'express';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createMysqlConfig } from './queryPolicy.js';
import { describeMysqlTable, executeMysqlQuery, listMysqlTables, testMysqlConnection } from './mysqlClient.js';

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
const port = Number(process.env.PORT || 3001);

app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (request.method === 'OPTIONS') return response.status(204).end();
  return next();
});

function sendError(response, error) {
  return response.status(400).json({ ok: false, errorType: 'request', message: error.message, hint: 'Sprawdź pola formularza connectora.' });
}

function getConfig(request) {
  const body = request.body ?? {};
  const connection = body.connection ?? body;
  return createMysqlConfig({ ...connection, allowMutations: body.allowMutations === true });
}

app.get('/api/health', (_request, response) => response.json({
  ok: true,
  service: 'sql-learning-lab-mysql-connector',
  allowMutationsAvailable: String(process.env.MYSQL_ALLOW_MUTATIONS).toLowerCase() === 'true',
}));

app.post('/api/mysql/test-connection', async (request, response) => {
  try {
    const result = await testMysqlConnection(getConfig(request));
    return response.status(result.ok ? 200 : 502).json(result);
  } catch (error) {
    return sendError(response, error);
  }
});

app.post('/api/mysql/query', async (request, response) => {
  try {
    const sql = String(request.body?.sql ?? '');
    const config = getConfig(request);
    const result = await executeMysqlQuery(config, sql);
    return response.status(result.ok ? 200 : result.errorType === 'policy' ? 403 : 400).json(result);
  } catch (error) {
    return sendError(response, error);
  }
});

app.post('/api/mysql/tables', async (request, response) => {
  try {
    const result = await listMysqlTables(getConfig(request));
    return response.status(result.ok ? 200 : 502).json(result);
  } catch (error) {
    return sendError(response, error);
  }
});

app.post('/api/mysql/describe', async (request, response) => {
  try {
    const result = await describeMysqlTable(getConfig(request), String(request.body?.tableName ?? ''));
    return response.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    return sendError(response, error);
  }
});

app.use((_request, response) => response.status(404).json({ ok: false, errorType: 'not-found', message: 'Nie znaleziono endpointu.', hint: 'Sprawdź adres API connectora.' }));

app.listen(port, '127.0.0.1', () => {
  console.log(`MySQL connector działa na http://localhost:${port}`);
});

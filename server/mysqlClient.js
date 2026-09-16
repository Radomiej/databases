import mysql from 'mysql2/promise';
import { performance } from 'node:perf_hooks';
import { classifyMysqlStatement, isMysqlReadOnly, validateMysqlConfig } from './queryPolicy.js';

function resultDuration(startedAt) {
  return Number((performance.now() - startedAt).toFixed(2));
}

function errorPayload(error, durationMs, statementType = 'UNKNOWN') {
  const code = error?.code ?? 'MYSQL_ERROR';
  let errorType = 'query';
  let hint = 'Sprawdź składnię, nazwy tabel i kolumn.';

  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
    errorType = 'connection';
    hint = 'Sprawdź, czy serwer MySQL działa oraz czy host i port są poprawne.';
  } else if (code === 'ER_ACCESS_DENIED_ERROR') {
    errorType = 'credentials';
    hint = 'Sprawdź użytkownika, hasło i uprawnienia do wybranej bazy.';
  } else if (code === 'ER_BAD_DB_ERROR') {
    errorType = 'database';
    hint = 'Baza nie istnieje albo nazwa w connectorze jest niepoprawna.';
  } else if (code === 'ER_BAD_FIELD_ERROR') {
    errorType = 'unknown-column';
    hint = 'Sprawdź nazwę kolumny w panelu schematu.';
  } else if (code === 'ER_NO_SUCH_TABLE') {
    errorType = 'unknown-table';
    hint = 'Sprawdź nazwę tabeli w panelu schematu.';
  }

  return {
    ok: false,
    errorType,
    code,
    message: error?.sqlMessage ?? error?.message ?? 'Wystąpił błąd MySQL.',
    hint,
    durationMs,
    statementType,
  };
}

function rowsToMatrix(rows, fields = []) {
  const columns = fields.map((field) => field.name);
  if (!columns.length && rows.length && typeof rows[0] === 'object') columns.push(...Object.keys(rows[0]));
  const matrix = rows.map((row) => columns.map((column) => row[column] ?? null));
  return { columns, rows: matrix };
}

async function connect(config) {
  validateMysqlConfig(config);
  return mysql.createConnection({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    connectTimeout: 5000,
    multipleStatements: false,
  });
}

export async function testMysqlConnection(config) {
  const startedAt = performance.now();
  let connection;
  try {
    connection = await connect(config);
    const [rows] = await connection.execute('SELECT VERSION() AS version;');
    return { ok: true, serverVersion: rows[0]?.version ?? 'nieznana', durationMs: resultDuration(startedAt) };
  } catch (error) {
    return errorPayload(error, resultDuration(startedAt), 'SELECT');
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}

export async function executeMysqlQuery(config, sql) {
  const startedAt = performance.now();
  const statementType = classifyMysqlStatement(sql);
  if (!String(sql ?? '').trim()) {
    return { ok: false, errorType: 'empty', message: 'Wpisz zapytanie SQL.', hint: 'Zacznij od SELECT.', durationMs: 0, statementType };
  }
  if (!isMysqlReadOnly(sql) && !config.allowMutations) {
    return { ok: false, errorType: 'policy', message: 'Operacje modyfikujące są wyłączone w connectorze.', hint: 'Włącz zapis tylko dla lokalnej bazy ćwiczeniowej i ustaw MYSQL_ALLOW_MUTATIONS=true.', durationMs: resultDuration(startedAt), statementType };
  }

  let connection;
  try {
    connection = await connect(config);
    const [rows, fields] = await connection.execute(sql);
    if (Array.isArray(rows)) {
      const normalized = rowsToMatrix(rows, fields);
      return { ok: true, ...normalized, rowCount: normalized.rows.length, changedRows: 0, durationMs: resultDuration(startedAt), statementType };
    }
    return { ok: true, columns: [], rows: [], rowCount: 0, changedRows: Number(rows?.affectedRows ?? rows?.changedRows ?? 0), durationMs: resultDuration(startedAt), statementType };
  } catch (error) {
    return errorPayload(error, resultDuration(startedAt), statementType);
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}

export async function listMysqlTables(config) {
  const result = await executeMysqlQuery(config, 'SHOW TABLES;');
  if (!result.ok) return result;
  return { ...result, tableNames: result.rows.map((row) => row[0]) };
}

export async function describeMysqlTable(config, tableName) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(tableName)) {
    return { ok: false, errorType: 'unknown-table', message: 'Niepoprawna nazwa tabeli.', hint: 'Wybierz tabelę z listy connectora.', durationMs: 0, statementType: 'DESCRIBE' };
  }
  return executeMysqlQuery(config, `DESCRIBE \`${tableName}\`;`);
}

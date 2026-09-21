import initSqlJs from 'sql.js';

const DEFAULT_WASM_PATH = '/sql-wasm.wasm';

const QUERY_STATEMENTS = new Set(['SELECT', 'WITH', 'PRAGMA', 'EXPLAIN', 'SHOW', 'DESCRIBE']);
const DML_STATEMENTS = new Set(['INSERT', 'UPDATE', 'DELETE', 'REPLACE']);

export function stripSqlComments(sql) {
  return sql
    .replace(/^\s*(?:--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/\s*)*/u, '')
    .trim();
}

export function classifyStatement(sql) {
  const firstWord = stripSqlComments(sql).match(/^([a-z]+)/iu)?.[1]?.toUpperCase();
  return firstWord === 'WITH' ? 'WITH' : firstWord || 'UNKNOWN';
}

export function normalizeSqliteRows(rawResult = { columns: [], values: [] }) {
  const columns = Array.isArray(rawResult.columns) ? [...rawResult.columns] : [];
  const rows = Array.isArray(rawResult.values) ? rawResult.values.map((row) => [...row]) : [];
  return { columns, rows, rowCount: rows.length };
}

function friendlySqliteError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  let errorType = 'syntax';
  let hint = 'Sprawdź składnię, nazwy tabel i kolumn.';

  if (normalized.includes('no such column')) {
    errorType = 'unknown-column';
    hint = 'Sprawdź, czy kolumna istnieje w wybranej tabeli i czy używasz właściwego aliasu.';
  } else if (normalized.includes('no such table')) {
    errorType = 'unknown-table';
    hint = 'Sprawdź nazwę tabeli w panelu schematu.';
  } else if (normalized.includes('constraint')) {
    errorType = 'constraint';
    hint = 'Sprawdź klucze główne, obce i wartości wymagane przez tabelę.';
  }

  return { errorType, message, hint };
}

export async function createSqliteDatabase(dataset, initializer = initSqlJs, locateFile = () => DEFAULT_WASM_PATH) {
  const SQL = await initializer({ locateFile });
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  if (dataset.seedSql?.trim()) db.run(dataset.seedSql);

  return {
    db,
    destroy: () => db.close(),
  };
}

export function executeSqliteQuery(db, sql) {
  const startedAt = performance.now();
  const cleanedSql = sql?.trim();

  if (!cleanedSql) {
    return {
      ok: false,
      errorType: 'empty',
      message: 'Wpisz zapytanie SQL.',
      hint: 'Zacznij od SELECT i wybierz tabelę z panelu schematu.',
      durationMs: 0,
    };
  }

  const statementType = classifyStatement(cleanedSql);

  try {
    if (QUERY_STATEMENTS.has(statementType)) {
      const [rawResult = { columns: [], values: [] }] = db.exec(cleanedSql);
      const normalized = normalizeSqliteRows(rawResult);
      return {
        ok: true,
        ...normalized,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
        statementType,
        changedRows: 0,
      };
    }

    db.run(cleanedSql);
    const changedRows = DML_STATEMENTS.has(statementType)
      ? Number(db.exec('SELECT changes() AS changedRows;')[0]?.values?.[0]?.[0] ?? 0)
      : 0;
    return {
      ok: true,
      columns: [],
      rows: [],
      rowCount: 0,
      changedRows,
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      statementType,
    };
  } catch (error) {
    return {
      ok: false,
      ...friendlySqliteError(error),
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      statementType,
    };
  }
}

function quoteSqliteIdentifier(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

export function getSqliteSchema(db) {
  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
  const tableNames = tablesResult[0]?.values?.map(([name]) => String(name)) ?? [];

  return tableNames.map((name) => {
    const quotedName = quoteSqliteIdentifier(name);
    const columnsResult = db.exec(`PRAGMA table_info(${quotedName});`);
    const foreignKeysResult = db.exec(`PRAGMA foreign_key_list(${quotedName});`);
    const columns = columnsResult[0]?.values?.map(([cid, columnName, type, notNull, defaultValue, primaryKey]) => ({
      id: cid,
      name: columnName,
      type: type || 'TEXT',
      notNull: Boolean(notNull),
      defaultValue,
      primaryKey: Boolean(primaryKey),
    })) ?? [];
    const foreignKeys = foreignKeysResult[0]?.values?.map(([, , referencedTable, from, to]) => ({
      table: referencedTable,
      from,
      to,
    })) ?? [];

    return { name, columns, foreignKeys };
  });
}

export function isQueryStatement(sql) {
  return QUERY_STATEMENTS.has(classifyStatement(sql));
}

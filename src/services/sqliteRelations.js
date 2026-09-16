import { getSqliteSchema } from './sqliteEngine.js';

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/u;
const ENDPOINT_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)$/u;

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function parseEndpoint(endpoint, label) {
  const match = String(endpoint ?? '').match(ENDPOINT_PATTERN);
  if (!match) throw new Error(`${label} musi mieć format tabela.kolumna.`);
  return { table: match[1], column: match[2], endpoint: `${match[1]}.${match[2]}` };
}

function typeAffinity(type) {
  const normalized = String(type ?? '').toUpperCase();
  if (normalized.includes('INT')) return 'INTEGER';
  if (normalized.includes('CHAR') || normalized.includes('CLOB') || normalized.includes('TEXT')) return 'TEXT';
  if (normalized.includes('BLOB') || normalized === '') return 'BLOB';
  if (normalized.includes('REAL') || normalized.includes('FLOA') || normalized.includes('DOUB')) return 'REAL';
  return 'NUMERIC';
}

function normalizeRelationship(relationship) {
  const from = parseEndpoint(relationship?.from, 'Relacja źródłowa');
  const to = parseEndpoint(relationship?.to, 'Relacja docelowa');
  return { from: from.endpoint, to: to.endpoint, fromTable: from.table, fromColumn: from.column, toTable: to.table, toColumn: to.column };
}

function relationshipKey(relationship) {
  return `${relationship.from}->${relationship.to}`;
}

function relationshipsForTable(relationships, tableName) {
  return relationships
    .filter((relationship) => relationship.fromTable === tableName)
    .map((relationship) => ({ from: relationship.fromColumn, table: relationship.toTable, to: relationship.toColumn }));
}

function foreignKeysKey(foreignKeys = []) {
  return foreignKeys.map((foreignKey) => `${foreignKey.from}->${foreignKey.table}.${foreignKey.to}`).sort().join('|');
}

function buildTableDefinition(table, foreignKeys, temporaryName) {
  const primaryKeyColumns = table.columns.filter((column) => column.primaryKey).map((column) => column.name);
  const columnDefinitions = table.columns.map((column) => {
    const definition = [quoteIdentifier(column.name), column.type || 'TEXT'];
    if (primaryKeyColumns.length === 1 && column.primaryKey) definition.push('PRIMARY KEY');
    if (column.notNull) definition.push('NOT NULL');
    if (column.defaultValue !== null && column.defaultValue !== undefined) definition.push(`DEFAULT ${column.defaultValue}`);
    return definition.join(' ');
  });
  if (primaryKeyColumns.length > 1) {
    columnDefinitions.push(`PRIMARY KEY (${primaryKeyColumns.map(quoteIdentifier).join(', ')})`);
  }
  const foreignKeyDefinitions = foreignKeys.map((foreignKey) => (
    `FOREIGN KEY (${quoteIdentifier(foreignKey.from)}) REFERENCES ${quoteIdentifier(foreignKey.table)} (${quoteIdentifier(foreignKey.to)})`
  ));
  return `CREATE TABLE ${quoteIdentifier(temporaryName)} (${[...columnDefinitions, ...foreignKeyDefinitions].join(', ')});`;
}

function tableColumn(table, columnName) {
  return table.columns.find((column) => column.name === columnName);
}

function validateRelationships(schema, relationships) {
  const tables = new Map(schema.map((table) => [table.name, table]));
  const seen = new Set();

  relationships.forEach((relationship) => {
    const key = relationshipKey(relationship);
    if (seen.has(key)) throw new Error(`Relacja ${key} występuje więcej niż raz.`);
    seen.add(key);

    const fromTable = tables.get(relationship.fromTable);
    const toTable = tables.get(relationship.toTable);
    if (!fromTable || !toTable) throw new Error(`Tabela wskazana w relacji ${key} nie istnieje.`);

    const fromColumn = tableColumn(fromTable, relationship.fromColumn);
    const toColumn = tableColumn(toTable, relationship.toColumn);
    if (!fromColumn) throw new Error(`Kolumna źródłowa ${relationship.from} nie istnieje.`);
    if (!toColumn) throw new Error(`Kolumna docelowa ${relationship.to} nie istnieje.`);
    if (!toColumn.primaryKey) throw new Error(`Kolumna docelowa ${relationship.to} musi być kluczem głównym.`);
    if (typeAffinity(fromColumn.type) !== typeAffinity(toColumn.type)) {
      throw new Error(`Kolumny ${relationship.from} i ${relationship.to} mają niezgodne typy.`);
    }
  });
}

function foreignKeysEnabled(db) {
  return Number(db.exec('PRAGMA foreign_keys;')[0]?.values?.[0]?.[0] ?? 1) === 1;
}

function hasTable(db, tableName) {
  const escaped = tableName.replaceAll("'", "''");
  return db.exec(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '${escaped}' LIMIT 1;`)[0]?.values?.length > 0;
}

function temporaryTableName(db, tableName, index) {
  let candidate = `__sql_lab_relation_tmp_${index}`;
  let suffix = 0;
  while (hasTable(db, candidate) || candidate === tableName) {
    suffix += 1;
    candidate = `__sql_lab_relation_tmp_${index}_${suffix}`;
  }
  return candidate;
}

function runForeignKeyCheck(db) {
  const result = db.exec('PRAGMA foreign_key_check;');
  if (result[0]?.values?.length) {
    throw new Error('Istniejące dane nie spełniają wybranych relacji. Zmiana została wycofana.');
  }
}

export function normalizeRelationships(relationships = []) {
  if (!Array.isArray(relationships)) throw new Error('Relacje muszą być tablicą.');
  return relationships.map(normalizeRelationship).map(({ from, to }) => ({ from, to }));
}

export function applySqliteRelationships(db, relationships = []) {
  let normalized;
  let schema;
  try {
    normalized = normalizeRelationships(relationships).map((relationship) => normalizeRelationship(relationship));
    schema = getSqliteSchema(db);
    validateRelationships(schema, normalized);
  } catch (error) {
    return {
      ok: false,
      errorType: 'relationship',
      message: error instanceof Error ? error.message : String(error),
      hint: 'Wybierz istniejące kolumny, zgodne typy i klucz główny po stronie docelowej.',
    };
  }

  const affectedTables = schema
    .filter((table) => foreignKeysKey(table.foreignKeys) !== foreignKeysKey(relationshipsForTable(normalized, table.name)))
    .map((table) => table.name);

  if (!affectedTables.length) return { ok: true, relationships: normalized.map(({ from, to }) => ({ from, to })) };

  const wasForeignKeysEnabled = foreignKeysEnabled(db);
  let transactionStarted = false;
  try {
    db.run('PRAGMA foreign_keys = OFF;');
    db.run('BEGIN;');
    transactionStarted = true;

    affectedTables.forEach((tableName, index) => {
      const table = schema.find((item) => item.name === tableName);
      const temporaryName = temporaryTableName(db, tableName, index);
      const columnNames = table.columns.map((column) => column.name);
      const quotedColumns = columnNames.map(quoteIdentifier).join(', ');
      db.run(buildTableDefinition(table, relationshipsForTable(normalized, tableName), temporaryName));
      db.run(`INSERT INTO ${quoteIdentifier(temporaryName)} (${quotedColumns}) SELECT ${quotedColumns} FROM ${quoteIdentifier(tableName)};`);
      db.run(`DROP TABLE ${quoteIdentifier(tableName)};`);
      db.run(`ALTER TABLE ${quoteIdentifier(temporaryName)} RENAME TO ${quoteIdentifier(tableName)};`);
    });

    runForeignKeyCheck(db);
    db.run('COMMIT;');
    transactionStarted = false;
    if (wasForeignKeysEnabled) db.run('PRAGMA foreign_keys = ON;');
    return { ok: true, relationships: normalized.map(({ from, to }) => ({ from, to })) };
  } catch (error) {
    if (transactionStarted) {
      try { db.run('ROLLBACK;'); } catch {
        // The original database error is more useful to the caller.
      }
    }
    try {
      if (wasForeignKeysEnabled) db.run('PRAGMA foreign_keys = ON;');
    } catch {
      // Keep the original error payload.
    }
    return {
      ok: false,
      errorType: 'relationship',
      message: error instanceof Error ? error.message : String(error),
      hint: 'Sprawdź istniejące wartości kluczy obcych. Niepoprawna zmiana została wycofana.',
    };
  }
}

export function relationshipEndpointParts(endpoint) {
  const parsed = parseEndpoint(endpoint, 'Relacja');
  if (!IDENTIFIER_PATTERN.test(parsed.table) || !IDENTIFIER_PATTERN.test(parsed.column)) {
    throw new Error('Relacja zawiera niepoprawny identyfikator.');
  }
  return parsed;
}

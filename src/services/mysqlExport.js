const MYSQL_IDENTIFIER_PATTERN = /[^\w$]/gu;

export function escapeMysqlIdentifier(identifier) {
  return `\`${String(identifier ?? '').replaceAll('`', '``')}\``;
}

export function escapeMysqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'NULL';
    return String(value);
  }
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (value instanceof Uint8Array) {
    return `X'${Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('')}'`;
  }
  const escaped = String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('\0', '\\0')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\b', '\\b')
    .replaceAll('\t', '\\t')
    .replaceAll('\x1a', '\\Z')
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"');
  return `'${escaped}'`;
}

export function sqliteTypeToMysql(type) {
  const normalized = String(type ?? '').toUpperCase();
  if (/INT/u.test(normalized)) return 'INT';
  if (/DATETIME|TIMESTAMP/u.test(normalized)) return 'DATETIME';
  if (/^DATE/u.test(normalized)) return 'DATE';
  if (/^TIME/u.test(normalized)) return 'TIME';
  if (/REAL|FLOA|DOUB/u.test(normalized)) return 'DOUBLE';
  if (/DEC|NUMERIC/u.test(normalized)) return 'DECIMAL(10,2)';
  if (/BOOL/u.test(normalized)) return 'TINYINT(1)';
  if (/BLOB/u.test(normalized)) return 'BLOB';
  return 'TEXT';
}

export function sanitizeMysqlDatabaseName(name) {
  const sanitized = String(name ?? '').replace(MYSQL_IDENTIFIER_PATTERN, '_');
  return sanitized || 'sql_lab_export';
}

function buildColumnDefinition(column) {
  const parts = [escapeMysqlIdentifier(column.name), sqliteTypeToMysql(column.type)];
  if (column.notNull || column.primaryKey || column.pk) parts.push('NOT NULL');
  if (column.defaultValue !== null && column.defaultValue !== undefined) parts.push(`DEFAULT ${column.defaultValue}`);
  return parts.join(' ');
}

function buildCreateTableSql(table) {
  const lines = table.columns.map((column) => `  ${buildColumnDefinition(column)}`);
  const primaryKeys = table.columns.filter((column) => column.primaryKey || column.pk).map((column) => escapeMysqlIdentifier(column.name));
  if (primaryKeys.length) lines.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
  (table.foreignKeys ?? []).forEach((foreignKey) => {
    const constraintName = `fk_${table.name}_${foreignKey.from}`;
    lines.push(`  CONSTRAINT ${escapeMysqlIdentifier(constraintName)} FOREIGN KEY (${escapeMysqlIdentifier(foreignKey.from)}) REFERENCES ${escapeMysqlIdentifier(foreignKey.table)} (${escapeMysqlIdentifier(foreignKey.to)})`);
  });
  return `CREATE TABLE ${escapeMysqlIdentifier(table.name)} (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
}

function buildInsertSql(table) {
  if (!table.rows?.length) return '';
  const columnList = table.columns.map((column) => escapeMysqlIdentifier(column.name)).join(', ');
  const values = table.rows.map((row) => `  (${row.map(escapeMysqlValue).join(', ')})`);
  return `INSERT INTO ${escapeMysqlIdentifier(table.name)} (${columnList}) VALUES\n${values.join(',\n')};`;
}

export function buildMysqlExportScript({ databaseName, sourceName, tables = [] }) {
  const safeName = sanitizeMysqlDatabaseName(databaseName);
  const rowCount = tables.reduce((count, table) => count + (table.rows?.length ?? 0), 0);
  const parts = [
    '-- SQL Learning Lab — eksport do MySQL/MariaDB',
    `-- Źródło: ${sourceName ?? databaseName ?? 'baza SQLite'} (SQLite)`,
    '-- Import: phpMyAdmin → zakładka SQL (wklej) albo Import (wybierz plik .sql).',
    '',
    `CREATE DATABASE IF NOT EXISTS ${escapeMysqlIdentifier(safeName)} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    `USE ${escapeMysqlIdentifier(safeName)};`,
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
  ];

  if (!tables.length) {
    parts.push('', '-- Baza nie zawiera tabel do wyeksportowania.');
  }

  tables.forEach((table) => {
    parts.push('', `-- Tabela: ${table.name}`, `DROP TABLE IF EXISTS ${escapeMysqlIdentifier(table.name)};`, buildCreateTableSql(table));
    const insertSql = buildInsertSql(table);
    if (insertSql) parts.push(insertSql);
  });

  parts.push('', 'SET FOREIGN_KEY_CHECKS = 1;', '');

  return { sql: parts.join('\n'), databaseName: safeName, tableCount: tables.length, rowCount };
}

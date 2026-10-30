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
    .replaceAll("'", "''");
  return `'${escaped}'`;
}

export function sqliteTypeToMysql(type) {
  const normalized = String(type ?? '').toUpperCase();
  // SQLite INTEGER is 64-bit, so plain INT would reject larger IDs on import.
  if (/INT/u.test(normalized)) return 'BIGINT';
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

function buildColumnDefinition(column, { indexedColumns, autoIncrementColumn }) {
  let mysqlType = sqliteTypeToMysql(column.type);
  const isPrimaryKey = Boolean(column.primaryKey || column.pk);
  if (indexedColumns.has(column.name) && /^(TEXT|BLOB)$/u.test(mysqlType)) {
    // MySQL can't index unbounded TEXT/BLOB keys; VARCHAR(255) is the practical key type.
    mysqlType = 'VARCHAR(255)';
  }
  const parts = [escapeMysqlIdentifier(column.name), mysqlType];
  if (column.notNull || isPrimaryKey) parts.push('NOT NULL');
  if (autoIncrementColumn === column.name) parts.push('AUTO_INCREMENT');
  if (column.defaultValue !== null && column.defaultValue !== undefined) {
    // TEXT/BLOB defaults need expression syntax: DEFAULT ('x').
    const defaultExpression = /^(TEXT|BLOB)$/u.test(sqliteTypeToMysql(column.type)) ? `(${column.defaultValue})` : column.defaultValue;
    parts.push(`DEFAULT ${defaultExpression}`);
  }
  return parts.join(' ');
}

function buildCreateTableSql(table) {
  const uniqueIndexes = (table.uniqueIndexes ?? []).filter((index) => index.columns?.length);
  const indexedColumns = new Set();
  const primaryKeyColumns = table.columns.filter((column) => column.primaryKey || column.pk);
  primaryKeyColumns.forEach((column) => indexedColumns.add(column.name));
  uniqueIndexes.forEach((index) => index.columns.forEach((column) => indexedColumns.add(column)));
  const autoIncrementColumn =
    primaryKeyColumns.length === 1 && /INT/ui.test(primaryKeyColumns[0].type ?? '') ? primaryKeyColumns[0].name : undefined;
  const lines = table.columns.map((column) => `  ${buildColumnDefinition(column, { indexedColumns, autoIncrementColumn })}`);
  const primaryKeys = primaryKeyColumns.map((column) => escapeMysqlIdentifier(column.name));
  if (primaryKeys.length) lines.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
  uniqueIndexes.forEach((index) => {
    const columns = index.columns.map(escapeMysqlIdentifier).join(', ');
    lines.push(`  UNIQUE KEY ${escapeMysqlIdentifier(index.name)} (${columns})`);
  });
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

function sanitizeCommentText(text) {
  return String(text ?? '').replaceAll(/[\r\n]+/gu, ' ');
}

export function buildMysqlExportScript({ databaseName, sourceName, tables = [] }) {
  const safeName = sanitizeMysqlDatabaseName(databaseName);
  const rowCount = tables.reduce((count, table) => count + (table.rows?.length ?? 0), 0);
  const parts = [
    '-- SQL Learning Lab — eksport do MySQL/MariaDB',
    `-- Źródło: ${sanitizeCommentText(sourceName ?? databaseName ?? 'baza SQLite')} (SQLite)`,
    '-- Import: phpMyAdmin → zakładka SQL (wklej) albo Import (wybierz plik .sql).',
    '',
    `CREATE DATABASE IF NOT EXISTS ${escapeMysqlIdentifier(safeName)} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    `USE ${escapeMysqlIdentifier(safeName)};`,
    'SET NAMES utf8mb4;',
    "SET SESSION sql_mode = REPLACE(@@SESSION.sql_mode, 'NO_BACKSLASH_ESCAPES', '');",
    'SET FOREIGN_KEY_CHECKS = 0;',
  ];

  if (!tables.length) {
    parts.push('', '-- Baza nie zawiera tabel do wyeksportowania.');
  }

  tables.forEach((table) => {
    parts.push('', `-- Tabela: ${sanitizeCommentText(table.name)}`, `DROP TABLE IF EXISTS ${escapeMysqlIdentifier(table.name)};`, buildCreateTableSql(table));
    const insertSql = buildInsertSql(table);
    if (insertSql) parts.push(insertSql);
  });

  parts.push('', 'SET FOREIGN_KEY_CHECKS = 1;', '');

  return { sql: parts.join('\n'), databaseName: safeName, tableCount: tables.length, rowCount };
}

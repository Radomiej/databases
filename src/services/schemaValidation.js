function normalizeType(type) {
  const normalized = String(type ?? '').trim().toUpperCase();
  if (/^(?:TINY|SMALL|MEDIUM|BIG)?INT(?:EGER)?(?:\s*\([^)]*\))?/u.test(normalized)) return 'INTEGER';
  if (/^(?:CHAR|N?VARCHAR|TEXT|CLOB)/u.test(normalized)) return 'TEXT';
  if (/^(?:REAL|FLOAT|DOUBLE|DECIMAL|NUMERIC)/u.test(normalized)) return 'REAL';
  if (/^(?:DATE|DATETIME|TIMESTAMP)/u.test(normalized)) return 'DATE';
  return normalized;
}

function normalizeDefault(value) {
  if (value === undefined || value === null) return null;
  return String(value)
    .trim()
    .replace(/^\((.*)\)$/u, '$1')
    .replace(/^(['"])(.*)\1$/u, '$2');
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object ?? {}, key);
}

function findTable(schema, name) {
  return (schema ?? []).find((table) => String(table.name) === String(name));
}

function findColumn(table, name) {
  return (table?.columns ?? []).find((column) => String(column.name) === String(name));
}

function normalizeForeignKey(foreignKey) {
  return {
    from: String(foreignKey.from),
    table: String(foreignKey.table ?? foreignKey.referencedTable),
    to: String(foreignKey.to ?? foreignKey.referencedColumn),
  };
}

function sameForeignKey(actual, expected) {
  const left = normalizeForeignKey(actual);
  const right = normalizeForeignKey(expected);
  return left.from === right.from && left.table === right.table && left.to === right.to;
}

function validateColumn(actualColumn, expectedColumn, tableName) {
  if (!actualColumn) return `Tabela ${tableName} nie ma kolumny ${expectedColumn.name}.`;
  if (hasOwn(expectedColumn, 'type') && expectedColumn.type != null && normalizeType(actualColumn.type) !== normalizeType(expectedColumn.type)) {
    return `Kolumna ${tableName}.${expectedColumn.name} ma typ ${actualColumn.type}, a oczekiwano ${expectedColumn.type}.`;
  }
  if (hasOwn(expectedColumn, 'primaryKey') && expectedColumn.primaryKey != null && Boolean(actualColumn.primaryKey ?? actualColumn.pk) !== Boolean(expectedColumn.primaryKey)) {
    return `Kolumna ${tableName}.${expectedColumn.name} ma niepoprawne ustawienie PRIMARY KEY.`;
  }
  const actualNotNull = Boolean(actualColumn.notNull)
    || (Boolean(actualColumn.primaryKey) && normalizeType(actualColumn.type) === 'INTEGER');
  if (hasOwn(expectedColumn, 'notNull') && expectedColumn.notNull != null && actualNotNull !== Boolean(expectedColumn.notNull)) {
    return `Kolumna ${tableName}.${expectedColumn.name} ma niepoprawne ustawienie NOT NULL.`;
  }
  if (hasOwn(expectedColumn, 'defaultValue') && expectedColumn.defaultValue !== undefined && normalizeDefault(actualColumn.defaultValue) !== normalizeDefault(expectedColumn.defaultValue)) {
    return `Kolumna ${tableName}.${expectedColumn.name} ma niepoprawną wartość DEFAULT.`;
  }
  return null;
}

export function validateSchema(actualSchema = [], expectedSchema = {}) {
  const actualTables = Array.isArray(actualSchema) ? actualSchema : [];
  const expectedTables = Array.isArray(expectedSchema.tables) ? expectedSchema.tables : [];

  if (expectedSchema.exactTables && actualTables.length !== expectedTables.length) {
    return { passed: false, message: 'Schemat ma inną liczbę tabel niż wymagana.', details: 'Sprawdź nazwy tabel i usuń niepotrzebne obiekty.' };
  }

  for (const expectedTable of expectedTables) {
    const actualTable = findTable(actualTables, expectedTable.name);
    if (!actualTable) {
      return { passed: false, message: `Brakuje tabeli ${expectedTable.name}.`, details: 'Utwórz tabelę o dokładnie podanej nazwie.' };
    }

    const expectedColumns = Array.isArray(expectedTable.columns) ? expectedTable.columns : [];
    if (expectedTable.exactColumns && actualTable.columns.length !== expectedColumns.length) {
      return { passed: false, message: `Tabela ${expectedTable.name} ma inną liczbę kolumn.`, details: 'Sprawdź nazwy i liczbę kolumn w definicji tabeli.' };
    }

    for (const expectedColumn of expectedColumns) {
      const columnError = validateColumn(findColumn(actualTable, expectedColumn.name), expectedColumn, expectedTable.name);
      if (columnError) return { passed: false, message: columnError, details: 'Sprawdź typ, klucz główny, NOT NULL i DEFAULT.' };
    }

    const actualForeignKeys = (actualTable.foreignKeys ?? []).map(normalizeForeignKey);
    for (const expectedForeignKey of expectedTable.foreignKeys ?? []) {
      if (!actualForeignKeys.some((foreignKey) => sameForeignKey(foreignKey, expectedForeignKey))) {
        return { passed: false, message: `Brakuje relacji w tabeli ${expectedTable.name}.`, details: `Oczekiwano ${expectedForeignKey.from} → ${expectedForeignKey.table}.${expectedForeignKey.to}.` };
      }
    }
  }

  return { passed: true, message: 'Schemat zgadza się z wymaganiami zadania.', details: 'Tabele, kolumny, ustawienia i relacje są poprawne.' };
}

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/u;
export const SUPPORTED_COLUMN_TYPES = ['INTEGER', 'TEXT', 'REAL', 'DATE'];

function assertIdentifier(value, label) {
  if (typeof value !== 'string' || !IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`${label} musi zaczynać się literą lub podkreśleniem i zawierać tylko znaki A-Z, 0-9 oraz _.`);
  }
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function buildCreateTableSql({ tableName, columns }) {
  assertIdentifier(tableName, 'Nazwa tabeli');
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('Dodaj co najmniej jedną kolumnę.');
  }

  const primaryKeyCount = columns.filter((column) => column.primaryKey).length;
  if (primaryKeyCount > 1) {
    throw new Error('W kreatorze wybierz najwyżej jeden klucz główny.');
  }

  const seenNames = new Set();
  const definitions = columns.map((column) => {
    assertIdentifier(column.name, 'Nazwa kolumny');
    if (seenNames.has(column.name)) throw new Error(`Kolumna ${column.name} występuje więcej niż raz.`);
    seenNames.add(column.name);
    if (!SUPPORTED_COLUMN_TYPES.includes(column.type)) {
      throw new Error(`Typ ${column.type} nie jest obsługiwany przez kreator.`);
    }
    const constraints = [column.type];
    if (column.primaryKey) constraints.push('PRIMARY KEY');
    if (column.notNull) constraints.push('NOT NULL');
    return `${quoteIdentifier(column.name)} ${constraints.join(' ')}`;
  });

  return `CREATE TABLE ${quoteIdentifier(tableName)} (${definitions.join(', ')});`;
}

export function normalizeTableDefinition({ tableName, columns }) {
  const sql = buildCreateTableSql({ tableName, columns });
  return {
    tableName,
    columns: columns.map(({ name, type, primaryKey = false, notNull = false }) => ({ name, type, primaryKey, notNull })),
    sql,
  };
}

const TABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_`]*$/u;
const DEFAULT_PREVIEW_LIMIT = 50;

function validateTableName(tableName) {
  const normalizedName = String(tableName ?? '').trim();
  if (!TABLE_NAME_PATTERN.test(normalizedName)) throw new Error('Niepoprawna nazwa tabeli do podglądu.');
  return normalizedName;
}

function validateLimit(limit) {
  const normalizedLimit = Number(limit);
  if (!Number.isInteger(normalizedLimit) || normalizedLimit < 1 || normalizedLimit > 100) {
    throw new Error('Limit podglądu musi być liczbą od 1 do 100.');
  }
  return normalizedLimit;
}

export function buildTablePreviewSql(tableName, limit = DEFAULT_PREVIEW_LIMIT) {
  const normalizedName = validateTableName(tableName);
  const normalizedLimit = validateLimit(limit);
  const identifier = `"${normalizedName.replaceAll('"', '""')}"`;
  return `SELECT * FROM ${identifier} LIMIT ${normalizedLimit};`;
}

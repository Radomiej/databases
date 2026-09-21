const READ_ONLY_STATEMENTS = new Set(['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN']);
const MUTATION_STATEMENTS = new Set(['INSERT', 'UPDATE', 'DELETE', 'REPLACE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME', 'GRANT', 'REVOKE', 'CALL', 'SET', 'USE']);
const DATA_MUTATION_STATEMENTS = new Set(['INSERT', 'UPDATE', 'DELETE', 'REPLACE']);

function stripSqlComments(sql = '') {
  return String(sql)
    .replace(/^\s*(?:--[^\n]*(?:\n|$)|#[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/\s*)*/u, '')
    .trim();
}

export function classifyMysqlStatement(sql) {
  const firstWord = stripSqlComments(sql).match(/^([a-z]+)/iu)?.[1]?.toUpperCase();
  if (firstWord === 'WITH') return 'WITH';
  if (MUTATION_STATEMENTS.has(firstWord)) return firstWord === 'CREATE' || firstWord === 'ALTER' || firstWord === 'DROP' || firstWord === 'TRUNCATE' ? 'DDL' : firstWord;
  return firstWord || 'UNKNOWN';
}

function hasMultipleStatements(sql) {
  const withoutTrailingSemicolon = String(sql).trim().replace(/;\s*$/u, '');
  return withoutTrailingSemicolon.includes(';');
}

export function isMysqlSchemaMutation(sql) {
  if (!String(sql ?? '').trim() || hasMultipleStatements(sql)) return false;
  const cleaned = stripSqlComments(sql);
  return /^(?:CREATE\s+TABLE|ALTER\s+TABLE)\b/iu.test(cleaned);
}

export function isMysqlDataMutation(sql) {
  if (!String(sql ?? '').trim() || hasMultipleStatements(sql)) return false;
  return DATA_MUTATION_STATEMENTS.has(classifyMysqlStatement(sql));
}

export function isMysqlReadOnly(sql) {
  if (!String(sql).trim() || hasMultipleStatements(sql)) return false;
  const statementType = classifyMysqlStatement(sql);
  if (READ_ONLY_STATEMENTS.has(statementType)) return true;
  if (statementType === 'WITH') {
    const cleaned = stripSqlComments(sql);
    return /\)\s*(SELECT|SHOW|DESCRIBE|EXPLAIN)\b/iu.test(cleaned) && !/\b(INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|TRUNCATE)\b/iu.test(cleaned);
  }
  return false;
}

export function createMysqlConfig(input = {}, env = process.env) {
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(input, key);
  const port = Number(hasOwn('port') ? input.port : env.MYSQL_PORT ?? 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port MySQL musi być liczbą od 1 do 65535.');

  return {
    host: String(hasOwn('host') ? input.host : env.MYSQL_HOST ?? '127.0.0.1').trim(),
    port,
    database: String(hasOwn('database') ? input.database : env.MYSQL_DATABASE ?? '').trim(),
    user: String(hasOwn('user') ? input.user : env.MYSQL_USER ?? 'root').trim(),
    password: String(hasOwn('password') ? input.password : env.MYSQL_PASSWORD ?? ''),
    allowMutations: String(env.MYSQL_ALLOW_MUTATIONS).toLowerCase() === 'true' && input.allowMutations === true,
    allowSchemaMutations: String(env.MYSQL_ALLOW_SCHEMA_MUTATIONS).toLowerCase() === 'true' && input.allowSchemaMutations === true,
  };
}

export function validateMysqlConfig(config) {
  if (!config.host) throw new Error('Podaj host MySQL.');
  if (!config.database) throw new Error('Podaj nazwę bazy MySQL.');
  if (!config.user) throw new Error('Podaj użytkownika MySQL.');
}

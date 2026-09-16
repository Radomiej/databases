async function postJson(url, payload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      ok: false,
      errorType: 'connection',
      message: 'Nie można połączyć się z backendem connectora.',
      hint: 'Uruchom npm run server i spróbuj ponownie.',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function getJson(url) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    return {
      ok: false,
      errorType: 'connection',
      message: 'Nie można połączyć się z backendem connectora.',
      hint: 'Uruchom npm run server i spróbuj ponownie.',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

export function getConnectorHealth() {
  return getJson('/api/health');
}

export function testConnection(connection) {
  return postJson('/api/mysql/test-connection', { connection });
}

export function runQuery(connection, sql, allowMutations = false) {
  return postJson('/api/mysql/query', { connection, sql, allowMutations });
}

export function listTables(connection) {
  return postJson('/api/mysql/tables', { connection });
}

export function describeTable(connection, tableName) {
  return postJson('/api/mysql/describe', { connection, tableName });
}

export function listRelations(connection) {
  return postJson('/api/mysql/relations', { connection });
}

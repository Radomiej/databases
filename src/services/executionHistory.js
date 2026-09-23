export const LEGACY_HISTORY_KEY = 'sql-lab.history';

const DATABASE_NAME = 'sql-learning-lab';
const DATABASE_VERSION = 1;
const STORE_NAME = 'executions';

function openDatabase(indexedDB = globalThis.indexedDB) {
  if (!indexedDB) return Promise.reject(new Error('Ta przeglądarka nie udostępnia IndexedDB.'));

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Nie udało się otworzyć historii zapytań.'));
    request.onblocked = () => reject(new Error('Historia zapytań jest zablokowana przez inną kartę aplikacji.'));
  });
}

function normalizeEntry(entry, index = 0) {
  const safeEntry = entry && typeof entry === 'object' ? entry : {};
  const timestamp = safeEntry.timestamp ?? new Date(0).toISOString();
  return {
    ...safeEntry,
    id: String(safeEntry.id ?? `legacy-${index}-${timestamp}`),
    sql: String(safeEntry.sql ?? ''),
    timestamp,
    databaseName: safeEntry.databaseName ?? safeEntry.datasetId ?? '',
    lessonTitle: safeEntry.lessonTitle ?? 'Historia sprzed aktualizacji',
    taskTitle: safeEntry.taskTitle ?? 'Zadanie nieopisane',
    ok: Boolean(safeEntry.ok),
    rowCount: Number(safeEntry.rowCount ?? safeEntry.changedRows ?? 0),
  };
}

function transact(database, mode, run) {
  return new Promise((resolve, reject) => {
    let transaction;
    let result;
    try {
      transaction = database.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error ?? new Error('Operacja na historii nie powiodła się.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Operacja na historii została przerwana.'));
      run(store, (request) => {
        request.onsuccess = () => { result = request.result; };
        request.onerror = () => reject(request.error ?? new Error('Nie udało się odczytać historii.'));
      });
    } catch (error) {
      transaction?.abort?.();
      reject(error);
    }
  });
}

function readLegacyHistory(storage) {
  if (!storage) return null;
  try {
    const serialized = storage.getItem(LEGACY_HISTORY_KEY);
    return serialized === null ? null : JSON.parse(serialized);
  } catch {
    return null;
  }
}

async function migrateLegacyHistory(database, storage) {
  const legacyEntries = readLegacyHistory(storage);
  if (!Array.isArray(legacyEntries)) return;
  if (legacyEntries.length === 0) {
    try { storage?.removeItem(LEGACY_HISTORY_KEY); } catch { /* storage is optional */ }
    return;
  }

  await transact(database, 'readwrite', (store) => {
    legacyEntries.forEach((entry, index) => store.put(normalizeEntry(entry, index)));
  });
  try {
    storage?.removeItem(LEGACY_HISTORY_KEY);
  } catch {
    // A later load can safely retry because IndexedDB uses each entry's stable id.
  }
}

function newestFirst(entries) {
  return entries.sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
}

export async function loadExecutionHistory({ indexedDB, storage = globalThis.localStorage } = {}) {
  const database = await openDatabase(indexedDB);
  try {
    await migrateLegacyHistory(database, storage);
    const entries = await transact(database, 'readonly', (store, capture) => capture(store.getAll()));
    return newestFirst((entries ?? []).map((entry, index) => normalizeEntry(entry, index)));
  } finally {
    database.close?.();
  }
}

export async function saveExecutionHistory(entry, { indexedDB } = {}) {
  const database = await openDatabase(indexedDB);
  const normalizedEntry = normalizeEntry(entry);
  try {
    await transact(database, 'readwrite', (store) => store.put(normalizedEntry));
    return normalizedEntry;
  } finally {
    database.close?.();
  }
}

export async function clearExecutionHistory({ indexedDB } = {}) {
  const database = await openDatabase(indexedDB);
  try {
    await transact(database, 'readwrite', (store) => store.clear());
  } finally {
    database.close?.();
  }
}

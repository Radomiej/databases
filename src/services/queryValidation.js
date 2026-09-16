function normalizeCell(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number(value.toFixed(6));
  }
  return String(value);
}

function normalizeRows(rows = []) {
  return rows.map((row) => row.map(normalizeCell));
}

function stableRowKey(row) {
  return JSON.stringify(row);
}

export function validateQueryResult(actual, expected) {
  if (!actual?.ok) {
    return {
      passed: false,
      message: `Najpierw popraw zapytanie. ${actual?.message ?? 'Wystąpił błąd wykonania.'}`,
      details: actual?.hint ?? 'Sprawdź składnię i nazwy tabel.',
    };
  }

  const actualColumns = (actual.columns ?? []).map(String);
  const expectedColumns = (expected.columns ?? []).map(String);
  if (JSON.stringify(actualColumns) !== JSON.stringify(expectedColumns)) {
    return {
      passed: false,
      message: 'Wynik ma inne kolumny niż wymagane zadanie.',
      details: `Oczekiwane: ${expectedColumns.join(', ')}. Otrzymane: ${actualColumns.join(', ')}.`,
    };
  }

  const actualRows = normalizeRows(actual.rows ?? []);
  const expectedRows = normalizeRows(expected.rows ?? []);
  const rowsToCompare = expected.strictOrder
    ? actualRows
    : [...actualRows].sort((left, right) => stableRowKey(left).localeCompare(stableRowKey(right)));
  const expectedRowsToCompare = expected.strictOrder
    ? expectedRows
    : [...expectedRows].sort((left, right) => stableRowKey(left).localeCompare(stableRowKey(right)));

  if (rowsToCompare.length !== expectedRowsToCompare.length) {
    return {
      passed: false,
      message: `Wynik ma ${rowsToCompare.length} wierszy, a powinien mieć ${expectedRowsToCompare.length}.`,
      details: 'Sprawdź warunek WHERE, GROUP BY lub JOIN.',
    };
  }

  if (JSON.stringify(rowsToCompare) !== JSON.stringify(expectedRowsToCompare)) {
    return {
      passed: false,
      message: 'Liczba wierszy jest poprawna, ale dane w wyniku się nie zgadzają.',
      details: 'Porównaj kolejność kolumn, warunki oraz sortowanie ORDER BY.',
    };
  }

  return {
    passed: true,
    message: 'Zadanie zaliczone.',
    details: 'Kolumny i rekordy zgadzają się z oczekiwanym wynikiem.',
  };
}

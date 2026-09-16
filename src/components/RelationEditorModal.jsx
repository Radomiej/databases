import { useEffect, useMemo, useState } from 'react';

function splitEndpoint(endpoint) {
  const [table = '', column = ''] = String(endpoint ?? '').split('.');
  return { table, column };
}

function isPrimaryKey(column) {
  return Boolean(column?.primaryKey || column?.pk);
}

function firstColumn(table, predicate = () => true) {
  return table?.columns?.find(predicate)?.name ?? '';
}

function createRelationRow(schema, relation = {}) {
  const parsedFrom = splitEndpoint(relation.from);
  const parsedTo = splitEndpoint(relation.to);
  const sourceTable = schema.find((table) => table.name === relation.fromTable) ?? schema.find((table) => table.name === parsedFrom.table) ?? schema[0];
  const targetTable = schema.find((table) => table.name === relation.toTable) ?? schema.find((table) => table.name === parsedTo.table) ?? schema.find((table) => table.columns?.some(isPrimaryKey)) ?? schema[0];
  return {
    id: `relation-${Math.random().toString(36).slice(2, 9)}`,
    fromTable: relation.fromTable ?? parsedFrom.table ?? sourceTable?.name ?? '',
    fromColumn: relation.fromColumn ?? parsedFrom.column ?? firstColumn(sourceTable),
    toTable: relation.toTable ?? parsedTo.table ?? targetTable?.name ?? '',
    toColumn: relation.toColumn ?? parsedTo.column ?? firstColumn(targetTable, isPrimaryKey),
  };
}

function normalizeRows(rows) {
  return rows.map((row) => ({ from: `${row.fromTable}.${row.fromColumn}`, to: `${row.toTable}.${row.toColumn}` }));
}

function validateRows(rows, schema) {
  const tableMap = new Map(schema.map((table) => [table.name, table]));
  const seen = new Set();
  for (const row of rows) {
    if (!row.fromTable || !row.fromColumn || !row.toTable || !row.toColumn) return 'Uzupełnij wszystkie pola relacji.';
    const sourceTable = tableMap.get(row.fromTable);
    const targetTable = tableMap.get(row.toTable);
    const sourceColumn = sourceTable?.columns?.find((column) => column.name === row.fromColumn);
    const targetColumn = targetTable?.columns?.find((column) => column.name === row.toColumn);
    if (!sourceColumn) return `Kolumna źródłowa ${row.fromTable}.${row.fromColumn} nie istnieje.`;
    if (!targetColumn) return `Kolumna docelowa ${row.toTable}.${row.toColumn} nie istnieje.`;
    if (!isPrimaryKey(targetColumn)) return `Kolumna docelowa ${row.toTable}.${row.toColumn} musi być kluczem głównym.`;
    const key = `${row.fromTable}.${row.fromColumn}->${row.toTable}.${row.toColumn}`;
    if (seen.has(key)) return `Relacja ${key} występuje więcej niż raz.`;
    seen.add(key);
  }
  return '';
}

function RelationEditorModal({ open, schema = [], relationships = [], onClose, onSave, onReset }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRows(relationships.map((relationship) => createRelationRow(schema, relationship)));
    setError('');
    setBusy(false);
  }, [open, relationships, schema]);

  const tableNames = useMemo(() => schema.map((table) => table.name), [schema]);

  if (!open) return null;

  const columnsFor = (tableName, onlyPrimaryKeys = false) => {
    const table = schema.find((item) => item.name === tableName);
    return (table?.columns ?? []).filter((column) => !onlyPrimaryKeys || isPrimaryKey(column));
  };

  const updateRow = (index, key, value) => {
    setRows((current) => current.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      if (key === 'fromTable') {
        const nextTable = schema.find((table) => table.name === value);
        return { ...row, fromTable: value, fromColumn: firstColumn(nextTable) };
      }
      if (key === 'toTable') {
        const nextTable = schema.find((table) => table.name === value);
        return { ...row, toTable: value, toColumn: firstColumn(nextTable, isPrimaryKey) };
      }
      return { ...row, [key]: value };
    }));
    setError('');
  };

  const handleSave = async () => {
    const validationMessage = validateRows(rows, schema);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await onSave?.(normalizeRows(rows));
      if (response?.ok === false) setError(response.message ?? 'Nie udało się zapisać relacji.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Przywrócić relacje startowe tej bazy? Dodatkowe relacje zostaną usunięte.')) return;
    setBusy(true);
    setError('');
    try {
      const response = await onReset?.();
      if (response?.ok === false) setError(response.message ?? 'Nie udało się zresetować relacji.');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : String(resetError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section className="relation-editor-modal" role="dialog" aria-modal="true" aria-labelledby="relation-editor-title">
        <div className="modal-header-custom">
          <div>
            <div className="modal-kicker">SQLite — struktura relacyjna</div>
            <h2 id="relation-editor-title">Edytuj relacje</h2>
            <p>Połącz kolumnę źródłową z kluczem głównym innej tabeli.</p>
          </div>
          <button type="button" className="modal-close-button" aria-label="Zamknij edytor relacji" onClick={onClose} disabled={busy}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body-custom relation-editor-body">
          <div className="relation-editor-toolbar">
            <div><strong>Relacje</strong><small>{rows.length} zapisanych połączeń</small></div>
            <button type="button" className="builder-add-column" onClick={() => { setRows((current) => [...current, createRelationRow(schema)]); setError(''); }} disabled={busy || !tableNames.length}>
              <i className="bi bi-plus-lg" aria-hidden="true" /> Dodaj relację
            </button>
          </div>

          {!rows.length && <div className="relation-editor-empty"><i className="bi bi-diagram-3" aria-hidden="true" /> Nie dodano jeszcze żadnej relacji.</div>}
          <div className="relation-editor-list">
            {rows.map((row, index) => {
              const sourceColumns = columnsFor(row.fromTable);
              const targetColumns = columnsFor(row.toTable, true);
              return (
                <div className="relation-editor-row" key={row.id}>
                  <div className="relation-editor-side">
                    <span className="relation-editor-side-label">Źródło</span>
                    <label htmlFor={`relation-source-table-${index + 1}`}>Tabela źródłowa {index + 1}</label>
                    <select id={`relation-source-table-${index + 1}`} value={row.fromTable} onChange={(event) => updateRow(index, 'fromTable', event.target.value)} disabled={busy}>
                      {tableNames.map((tableName) => <option value={tableName} key={tableName}>{tableName}</option>)}
                    </select>
                    <label htmlFor={`relation-source-column-${index + 1}`}>Kolumna źródłowa {index + 1}</label>
                    <select id={`relation-source-column-${index + 1}`} value={row.fromColumn} onChange={(event) => updateRow(index, 'fromColumn', event.target.value)} disabled={busy}>
                      {sourceColumns.map((column) => <option value={column.name} key={column.name}>{column.name} · {column.type}</option>)}
                    </select>
                  </div>
                  <div className="relation-editor-arrow"><i className="bi bi-arrow-right" aria-hidden="true" /></div>
                  <div className="relation-editor-side">
                    <span className="relation-editor-side-label">Cel</span>
                    <label htmlFor={`relation-target-table-${index + 1}`}>Tabela docelowa {index + 1}</label>
                    <select id={`relation-target-table-${index + 1}`} value={row.toTable} onChange={(event) => updateRow(index, 'toTable', event.target.value)} disabled={busy}>
                      {tableNames.map((tableName) => <option value={tableName} key={tableName}>{tableName}</option>)}
                    </select>
                    <label htmlFor={`relation-target-column-${index + 1}`}>Kolumna docelowa {index + 1}</label>
                    <select id={`relation-target-column-${index + 1}`} value={row.toColumn} onChange={(event) => updateRow(index, 'toColumn', event.target.value)} disabled={busy}>
                      {targetColumns.map((column) => <option value={column.name} key={column.name}>{column.name} · klucz główny</option>)}
                    </select>
                  </div>
                  <button type="button" className="relation-remove-button" aria-label={`Usuń relację ${index + 1}`} title="Usuń relację" onClick={() => { setRows((current) => current.filter((_, rowIndex) => rowIndex !== index)); setError(''); }} disabled={busy}>
                    <i className="bi bi-trash3" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
          {error && <div className="builder-error relation-editor-error" role="alert"><i className="bi bi-exclamation-circle" aria-hidden="true" /> {error}</div>}
        </div>

        <div className="modal-footer-custom relation-editor-footer">
          <button type="button" className="btn btn-modal-reset" onClick={handleReset} disabled={busy}><i className="bi bi-arrow-counterclockwise" aria-hidden="true" /> Resetuj relacje</button>
          <div className="modal-footer-actions">
            <button type="button" className="btn btn-modal-ghost" onClick={onClose} disabled={busy}>Anuluj</button>
            <button type="button" className="btn btn-modal-create" onClick={handleSave} disabled={busy}>{busy ? 'Zapisuję...' : <><i className="bi bi-check2" aria-hidden="true" /> Zapisz relacje</>}</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RelationEditorModal;

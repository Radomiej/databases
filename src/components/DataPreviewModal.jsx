function formatRowsCount(count) {
  if (count === 1) return '1 rekord';
  if (count >= 2 && count <= 4) return `${count} rekordy`;
  return `${count} rekordów`;
}

function formatCell(value) {
  if (value === null || value === undefined) return <span className="null-cell">NULL</span>;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function DataPreviewModal({
  open = false,
  table,
  databaseLabel,
  mode = 'sqlite',
  result,
  loading = false,
  onClose,
  onRefresh,
}) {
  if (!open || !table) return null;

  const columns = result?.ok && result.columns?.length ? result.columns : table.columns.map((column) => column.name);
  const rows = result?.ok ? result.rows ?? [] : [];
  const rowCount = result?.ok ? result.rowCount ?? rows.length : 0;

  return (
    <div className="modal-backdrop-custom data-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="data-preview-modal" role="dialog" aria-modal="true" aria-labelledby="data-preview-title">
        <header className="data-preview-header">
          <div className="data-preview-heading">
            <div className="data-preview-icon"><i className="bi bi-table" aria-hidden="true" /></div>
            <div>
              <div className="data-preview-kicker">{mode === 'mysql' ? 'MYSQL CONNECTOR' : 'SQLITE — LOKALNIE'} · {databaseLabel}</div>
              <h2 id="data-preview-title">Podgląd danych: {table.name}</h2>
              <p>Odczyt pierwszych 50 rekordów z aktualnej tabeli.</p>
            </div>
          </div>
          <button type="button" className="data-preview-close" aria-label="Zamknij podgląd" onClick={onClose}><i className="bi bi-x-lg" aria-hidden="true" /></button>
        </header>

        <div className="data-preview-meta" aria-live="polite">
          <span><i className="bi bi-database" aria-hidden="true" /> {databaseLabel}</span>
          <span><i className="bi bi-list-ol" aria-hidden="true" /> {loading ? 'Pobieranie…' : result?.ok ? formatRowsCount(rowCount) : 'Brak wyniku'}</span>
          {result?.ok && <span><i className="bi bi-stopwatch" aria-hidden="true" /> {Number(result.durationMs ?? 0).toFixed(2)} ms</span>}
        </div>

        <div className="data-preview-body">
          {loading && <div className="data-preview-state" role="status"><i className="bi bi-arrow-repeat spin" aria-hidden="true" /><strong>Pobieram dane tabeli…</strong><p>Wykonuję bezpieczne zapytanie SELECT z limitem 50 rekordów.</p></div>}
          {!loading && result?.ok === false && <div className="data-preview-error"><div className="error-badge"><i className="bi bi-x-lg" aria-hidden="true" /></div><div><strong>{result.message}</strong><p>{result.hint ?? 'Sprawdź połączenie i spróbuj ponownie.'}</p>{result.details && <small>{result.details}</small>}</div></div>}
          {!loading && result?.ok && columns.length > 0 && (
            <div className="data-preview-table-wrap">
              <table className="data-preview-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`preview-row-${rowIndex}`}>{row.map((value, cellIndex) => <td key={`preview-cell-${rowIndex}-${cellIndex}`}>{formatCell(value)}</td>)}</tr>)}</tbody></table>
              {!rows.length && <div className="data-preview-no-rows"><i className="bi bi-inbox" aria-hidden="true" />Tabela nie zawiera rekordów.</div>}
            </div>
          )}
          {!loading && result?.ok && !columns.length && <div className="data-preview-state"><i className="bi bi-inbox" aria-hidden="true" /><strong>Brak kolumn do pokazania</strong><p>Nie udało się odczytać struktury tabeli.</p></div>}
        </div>

        <footer className="data-preview-footer">
          <code>SELECT * FROM {mode === 'mysql' ? `\`${table.name}\`` : `"${table.name}"`} LIMIT 50;</code>
          <div className="data-preview-actions"><button type="button" className="btn btn-preview-ghost" onClick={onClose}>Zamknij</button><button type="button" className="btn btn-preview-refresh" onClick={onRefresh} disabled={loading}><i className="bi bi-arrow-clockwise" aria-hidden="true" /> Odśwież podgląd</button></div>
        </footer>
      </section>
    </div>
  );
}

export default DataPreviewModal;

import { useState } from 'react';
import HistoryPanel from './HistoryPanel.jsx';

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

function ResultsPanel({ result, history = [], onHistorySelect }) {
  const [activeTab, setActiveTab] = useState('result');

  const hasRows = Boolean(result?.ok && result.rows?.length);
  const isMutation = Boolean(result?.ok && !result.columns?.length && result.changedRows !== undefined && result.statementType !== 'SELECT');

  return (
    <section className="results-card" aria-live="polite">
      <div className="results-card-header">
        <div className="results-title-wrap">
          <div className={`results-icon ${result?.ok ? 'is-success' : result?.ok === false ? 'is-error' : ''}`}>
            <i className={`bi ${result?.ok ? 'bi-check2' : result?.ok === false ? 'bi-exclamation-triangle' : 'bi-table'}`} aria-hidden="true" />
          </div>
          <div>
            <h2>Wynik zapytania</h2>
            <span>{result?.ok ? (hasRows ? formatRowsCount(result.rowCount) : isMutation ? `${result.changedRows ?? 0} zmienionych rekordów` : 'Brak rekordów') : result?.ok === false ? 'Zapytanie wymaga poprawy' : 'Uruchom zapytanie, aby zobaczyć dane'}</span>
          </div>
        </div>
        {result?.ok && <div className="results-meta">{Number(result.durationMs ?? 0).toFixed(2)} ms</div>}
      </div>

      <div className="results-tabs" role="tablist" aria-label="Wynik i historia">
        <button type="button" className={`results-tab ${activeTab === 'result' ? 'is-active' : ''}`} role="tab" aria-selected={activeTab === 'result'} onClick={() => setActiveTab('result')}>Wynik</button>
        <button type="button" className={`results-tab ${activeTab === 'history' ? 'is-active' : ''}`} role="tab" aria-selected={activeTab === 'history'} onClick={() => setActiveTab('history')}>Historia <span>{history.length}</span></button>
      </div>

      {activeTab === 'history' ? (
        <HistoryPanel history={history} onHistorySelect={onHistorySelect} />
      ) : (
        <div className="results-body">
          {!result && <div className="results-empty"><div className="results-empty-icon"><i className="bi bi-table" aria-hidden="true" /></div><strong>Wyniki pojawią się tutaj</strong><p>Wykonaj zapytanie, aby zobaczyć tabelę danych.</p></div>}
          {result?.ok === false && <div className="results-error"><div className="error-badge"><i className="bi bi-x-lg" aria-hidden="true" /></div><div><strong>{result.message}</strong><p>{result.hint ?? 'Sprawdź składnię i spróbuj ponownie.'}</p><small>Typ błędu: {result.errorType ?? 'SQL'}</small></div></div>}
          {result?.ok && hasRows && <div className="results-table-wrap"><table className="results-table"><thead><tr>{result.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{result.rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`}>{row.map((value, cellIndex) => <td key={`cell-${rowIndex}-${cellIndex}`}>{formatCell(value)}</td>)}</tr>)}</tbody></table></div>}
          {result?.ok && !hasRows && !isMutation && <div className="results-no-rows"><i className="bi bi-inbox" aria-hidden="true" /><span>Zapytanie wykonało się poprawnie, ale nie zwróciło rekordów.</span></div>}
          {result?.ok && isMutation && <div className="results-mutation"><i className="bi bi-check-circle-fill" aria-hidden="true" /><div><strong>Operacja wykonana poprawnie.</strong><p>Zmieniono {formatRowsCount(result.changedRows ?? 0)}.</p></div></div>}
        </div>
      )}
    </section>
  );
}

export default ResultsPanel;

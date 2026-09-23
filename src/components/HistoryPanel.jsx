import { useEffect, useState } from 'react';
import { formatRelativeHistoryTime } from '../services/historyTime.js';
import { getDataset } from '../data/datasets.js';

export const HISTORY_PAGE_SIZE = 10;

function formatRecordCount(count) {
  if (count === 1) return '1 rekord';
  if (count >= 2 && count <= 4) return `${count} rekordy`;
  return `${count} rekordów`;
}

function formatExactTime(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Nieznany czas' : date.toLocaleString('pl-PL');
}

function HistoryPanel({ history, onHistorySelect }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [now, setNow] = useState(() => new Date());
  const totalPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleEntries = history.slice((safeCurrentPage - 1) * HISTORY_PAGE_SIZE, safeCurrentPage * HISTORY_PAGE_SIZE);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => { setCurrentPage(1); }, [history.length]);

  if (!history.length) {
    return <div className="history-empty"><i className="bi bi-clock-history" aria-hidden="true" /> Historia uruchomionych zapytań pojawi się tutaj.</div>;
  }

  return (
    <div className="history-browser">
      <div className="history-list">
        {visibleEntries.map((entry) => {
          const exactTime = formatExactTime(entry.timestamp);
          const databaseName = entry.databaseName || (entry.datasetId ? getDataset(entry.datasetId).name : 'Nieznana baza');
          const outcome = entry.ok ? 'Wykonano poprawnie' : 'Błąd zapytania';
          const resultCount = entry.statementType && entry.statementType !== 'SELECT'
            ? `${entry.rowCount ?? 0} zmienionych rekordów`
            : formatRecordCount(entry.rowCount ?? 0);

          return (
            <button type="button" className="history-item" key={entry.id} onClick={() => onHistorySelect(entry)}>
              <span className={`history-status ${entry.ok ? 'is-ok' : 'is-error'}`} aria-hidden="true"><i className={`bi ${entry.ok ? 'bi-check2' : 'bi-x'}`} /></span>
              <span className="history-copy">
                <code>{entry.sql}</code>
                <span className="history-context">{entry.mode === 'sqlite' ? 'SQLite' : 'MySQL'} · {databaseName}</span>
                <span className="history-context">Lekcja {entry.lessonOrder ?? '—'} · {entry.lessonTitle ?? 'Lekcja nieustalona'} · {entry.taskTitle ?? 'Zadanie nieopisane'}</span>
                <span className="history-context">{entry.action === 'check' ? 'Sprawdź' : 'Uruchom'} · {outcome} · {resultCount}</span>
                <span className="history-time"><time dateTime={entry.timestamp} title={exactTime}>{formatRelativeHistoryTime(entry.timestamp, now)}</time><span aria-hidden="true">·</span><span>{exactTime}</span></span>
              </span>
              <i className="bi bi-arrow-up-right history-open" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {totalPages > 1 && (
        <nav className="history-pagination" aria-label="Paginacja historii zapytań">
          <button type="button" className="history-page-button" aria-label="Poprzednia strona historii" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1}><i className="bi bi-chevron-left" aria-hidden="true" /></button>
          <span aria-live="polite">Strona {safeCurrentPage} z {totalPages}</span>
          <button type="button" className="history-page-button" aria-label="Następna strona historii" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage === totalPages}><i className="bi bi-chevron-right" aria-hidden="true" /></button>
        </nav>
      )}
    </div>
  );
}

export default HistoryPanel;

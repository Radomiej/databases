function HistoryPanel({ history, onHistorySelect }) {
  if (!history.length) {
    return <div className="history-empty"><i className="bi bi-clock-history" aria-hidden="true" /> Historia uruchomionych zapytań pojawi się tutaj.</div>;
  }

  return (
    <div className="history-list">
      {history.slice(0, 8).map((entry) => (
        <button type="button" className="history-item" key={entry.id} onClick={() => onHistorySelect(entry)}>
          <span className={`history-status ${entry.ok ? 'is-ok' : 'is-error'}`} aria-hidden="true"><i className={`bi ${entry.ok ? 'bi-check2' : 'bi-x'}`} /></span>
          <span className="history-copy"><code>{entry.sql}</code><small>{entry.mode === 'sqlite' ? 'SQLite' : 'MySQL'} · {entry.rowCount ?? 0} rekordów</small></span>
          <i className="bi bi-arrow-up-right history-open" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export default HistoryPanel;

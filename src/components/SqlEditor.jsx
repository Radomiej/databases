function SqlEditor({ value, onChange, onRun, onCheck, onReset, onShowSolution, disabled = false }) {
  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      onRun();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const start = event.currentTarget.selectionStart;
      const end = event.currentTarget.selectionEnd;
      const nextValue = `${value.slice(0, start)}  ${value.slice(end)}`;
      onChange(nextValue);
      requestAnimationFrame(() => {
        event.currentTarget.selectionStart = start + 2;
        event.currentTarget.selectionEnd = start + 2;
      });
    }
  };

  return (
    <section className="editor-card" aria-label="Edytor zapytania SQL">
      <div className="editor-card-header">
        <div className="editor-title-wrap">
          <div className="editor-icon"><i className="bi bi-terminal" aria-hidden="true" /></div>
          <div>
            <h2>Zapytanie SQL</h2>
            <span>Edytuj kod i uruchom go w wybranej bazie</span>
          </div>
        </div>
        <span className="editor-language">SQL</span>
      </div>
      <div className="sql-editor-wrap">
        <div className="line-number" aria-hidden="true">1</div>
        <label className="visually-hidden" htmlFor="sql-query">Zapytanie SQL</label>
        <textarea
          id="sql-query"
          className="sql-editor"
          aria-label="Zapytanie SQL"
          spellCheck="false"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="editor-toolbar">
        <div className="editor-actions-primary">
          <button type="button" className="btn btn-run" onClick={onRun} disabled={disabled}>
            <i className="bi bi-play-fill" aria-hidden="true" />
            Uruchom
            <span className="shortcut-hint">Ctrl ↵</span>
          </button>
          <button type="button" className="btn btn-editor-secondary" onClick={onCheck} disabled={disabled}>
            <i className="bi bi-check2" aria-hidden="true" />
            Sprawdź
          </button>
        </div>
        <div className="editor-actions-secondary">
          <button type="button" className="btn btn-editor-secondary" onClick={onReset} disabled={disabled}>
            <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
            Wyczyść
          </button>
          <button type="button" className="btn btn-editor-secondary" onClick={onShowSolution} disabled={disabled}>
            <i className="bi bi-file-earmark-code" aria-hidden="true" />
            Rozwiązanie
          </button>
        </div>
      </div>
    </section>
  );
}

export default SqlEditor;

function ModeSelector({ mode, onChange }) {
  return (
    <div className="mode-selector" role="group" aria-label="Tryb pracy">
      <button
        type="button"
        className={`mode-option ${mode === 'sqlite' ? 'is-active' : ''}`}
        aria-pressed={mode === 'sqlite'}
        onClick={() => onChange('sqlite')}
      >
        <i className="bi bi-database-fill me-2" aria-hidden="true" />
        SQLite — nauka
      </button>
      <button
        type="button"
        className={`mode-option ${mode === 'mysql' ? 'is-active' : ''}`}
        aria-pressed={mode === 'mysql'}
        onClick={() => onChange('mysql')}
      >
        <i className="bi bi-plug-fill me-2" aria-hidden="true" />
        MySQL — connector
      </button>
    </div>
  );
}

export default ModeSelector;

import { useEffect, useMemo, useRef, useState } from 'react';

function TableOptionsMenu({ tableName, onPreviewTable, previewDisabled }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="schema-table-options" ref={menuRef}>
      <button type="button" className="schema-more" aria-label={`Opcje tabeli ${tableName}`} aria-haspopup="menu" aria-expanded={open} title="Opcje tabeli" onClick={() => setOpen((current) => !current)}>
        <i className="bi bi-three-dots-vertical" aria-hidden="true" />
      </button>
      {open && (
        <div className="schema-table-menu" role="menu" aria-label={`Opcje tabeli ${tableName}`}>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onPreviewTable?.(tableName); }} disabled={previewDisabled}>
            <i className="bi bi-eye" aria-hidden="true" /> Podgląd danych
          </button>
        </div>
      )}
    </div>
  );
}

function SchemaPanel({ schema = [], dataset, relationships = [], mode = 'sqlite', databaseLabel, onAddTable, onPreviewTable, previewDisabled = false, onEditRelationships, relationshipsReadOnly = false }) {
  const [activeTab, setActiveTab] = useState('tables');
  const [search, setSearch] = useState('');
  const availableTables = schema.length > 0 ? schema : mode === 'sqlite' ? dataset.tables : [];
  const visibleTables = useMemo(() => availableTables.filter((table) => table.name.toLowerCase().includes(search.trim().toLowerCase())), [availableTables, search]);
  const relationList = Array.isArray(relationships) ? relationships : [];

  return (
    <div className="inspector-content">
      <div className="inspector-heading">
        <div className="inspector-heading-icon"><i className="bi bi-database-fill" aria-hidden="true" /></div>
        <div>
          <h2>Schemat bazy</h2>
          <p>{databaseLabel ?? dataset.name} · {schema.length || (mode === 'sqlite' ? dataset.tables.length : 0)} tabel</p>
        </div>
      </div>
      <div className="inspector-tabs" role="tablist" aria-label="Widoki schematu">
        <button type="button" className={`inspector-tab ${activeTab === 'tables' ? 'is-active' : ''}`} role="tab" aria-selected={activeTab === 'tables'} onClick={() => setActiveTab('tables')}>Tabele</button>
        <button type="button" className={`inspector-tab ${activeTab === 'relations' ? 'is-active' : ''}`} role="tab" aria-selected={activeTab === 'relations'} onClick={() => setActiveTab('relations')}>Relacje</button>
      </div>

      {activeTab === 'tables' && (
        <>
          <div className="schema-search-row">
            <div className="schema-search-wrap">
              <i className="bi bi-search" aria-hidden="true" />
              <label className="visually-hidden" htmlFor="schema-search">Szukaj tabeli</label>
              <input id="schema-search" className="schema-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Szukaj tabeli..." />
            </div>
            {mode === 'sqlite' && <button type="button" className="schema-add-button" onClick={onAddTable} title="Dodaj własną tabelę"><i className="bi bi-plus-lg" aria-hidden="true" /></button>}
          </div>
          <div className="schema-table-list">
            {visibleTables.map((tableItem) => (
              <div className="schema-table-card" key={tableItem.name}>
                <div className="schema-table-heading">
                  <span className="schema-table-icon"><i className="bi bi-table" aria-hidden="true" /></span>
                  <strong>{tableItem.name}</strong>
                  <TableOptionsMenu tableName={tableItem.name} onPreviewTable={onPreviewTable} previewDisabled={previewDisabled} />
                </div>
                <div className="schema-column-count">{tableItem.columns.length} kolumn</div>
                <div className="schema-columns">
                  {tableItem.columns.slice(0, 6).map((column) => {
                    const hasForeignKey = Boolean(column.foreignKey || column.foreignKeys?.length || tableItem.foreignKeys?.some((foreignKey) => foreignKey.from === column.name));
                    return (
                      <div className="schema-column" key={column.name}>
                        <i className={`bi ${column.primaryKey || column.pk ? 'bi-key-fill schema-key' : 'bi-grip-vertical schema-column-mark'}`} aria-hidden="true" />
                        <span>{column.name}</span>
                        {hasForeignKey && <small>FK</small>}
                        <em>{column.type}</em>
                      </div>
                    );
                  })}
                  {tableItem.columns.length > 6 && <div className="schema-more-columns">+ {tableItem.columns.length - 6} więcej</div>}
                </div>
              </div>
            ))}
            {!visibleTables.length && <div className="schema-no-match">{mode === 'mysql' ? 'Połącz connector, aby pobrać tabele.' : `Nie znaleziono tabeli dla „${search}”.`}</div>}
          </div>
        </>
      )}

      {activeTab === 'relations' && (
        <div className="relations-panel">
          <div className="relations-toolbar">
            <div><strong>Relacje tabel</strong><small>{relationList.length} połączeń</small></div>
            {relationshipsReadOnly ? <span className="relations-readonly"><i className="bi bi-lock" aria-hidden="true" /> Tylko odczyt</span> : onEditRelationships && <button type="button" className="relations-edit-button" onClick={onEditRelationships}><i className="bi bi-pencil-square" aria-hidden="true" /> Edytuj relacje</button>}
          </div>
          <div className="relations-list">
            {relationList.map((relationship) => (
              <div className="relation-row" key={`${relationship.from}-${relationship.to}`}>
                <span>{relationship.from}</span><i className="bi bi-arrow-right" aria-hidden="true" /><span>{relationship.to}</span>
              </div>
            ))}
            {!relationList.length && <div className="relations-empty"><i className="bi bi-diagram-3" aria-hidden="true" /> Ta baza nie ma jeszcze relacji.</div>}
          </div>
        </div>
      )}

      <div className="inspector-hint">
        <div className="hint-icon"><i className="bi bi-info-circle-fill" aria-hidden="true" /></div>
        <div><strong>Wskazówka</strong><p>Kliknij nazwę tabeli w zapytaniu lub użyj schematu, aby nie zgadywać nazw kolumn.</p></div>
      </div>
    </div>
  );
}

export default SchemaPanel;

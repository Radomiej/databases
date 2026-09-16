import { useMemo, useState } from 'react';

function SchemaPanel({ schema = [], dataset, relationships = [], mode = 'sqlite', onAddTable }) {
  const [activeTab, setActiveTab] = useState('tables');
  const [search, setSearch] = useState('');
  const availableTables = schema.length ? schema : dataset.tables;
  const visibleTables = useMemo(() => availableTables.filter((table) => table.name.toLowerCase().includes(search.trim().toLowerCase())), [availableTables, search]);

  return (
    <div className="inspector-content">
      <div className="inspector-heading">
        <div className="inspector-heading-icon"><i className="bi bi-database-fill" aria-hidden="true" /></div>
        <div>
          <h2>Schemat bazy</h2>
          <p>{dataset.name} · {schema.length || dataset.tables.length} tabel</p>
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
                  <button type="button" className="schema-more" aria-label={`Opcje tabeli ${tableItem.name}`}><i className="bi bi-three-dots-vertical" aria-hidden="true" /></button>
                </div>
                <div className="schema-column-count">{tableItem.columns.length} kolumn</div>
                <div className="schema-columns">
                  {tableItem.columns.slice(0, 6).map((column) => (
                    <div className="schema-column" key={column.name}>
                      <i className={`bi ${column.primaryKey || column.pk ? 'bi-key-fill schema-key' : 'bi-grip-vertical schema-column-mark'}`} aria-hidden="true" />
                      <span>{column.name}</span>
                      {(column.foreignKey || column.foreignKeys?.length) && <small>FK</small>}
                      <em>{column.type}</em>
                    </div>
                  ))}
                  {tableItem.columns.length > 6 && <div className="schema-more-columns">+ {tableItem.columns.length - 6} więcej</div>}
                </div>
              </div>
            ))}
            {!visibleTables.length && <div className="schema-no-match">Nie znaleziono tabeli dla „{search}”.</div>}
          </div>
        </>
      )}

      {activeTab === 'relations' && (
        <div className="relations-list">
          {(relationships.length ? relationships : dataset.relationships).map((relationship) => (
            <div className="relation-row" key={`${relationship.from}-${relationship.to}`}>
              <span>{relationship.from}</span><i className="bi bi-arrow-right" aria-hidden="true" /><span>{relationship.to}</span>
            </div>
          ))}
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

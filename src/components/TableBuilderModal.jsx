import { useEffect, useState } from 'react';
import { normalizeTableDefinition, SUPPORTED_COLUMN_TYPES } from '../services/schemaBuilder.js';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

const blankColumn = (index) => ({ name: `kolumna_${index}`, type: 'TEXT', primaryKey: false, notNull: false });

function TableBuilderModal({ open, onClose, onCreate, existingNames = [] }) {
  const [tableName, setTableName] = useState('notatki');
  const [columns, setColumns] = useState([
    { name: 'id', type: 'INTEGER', primaryKey: true, notNull: true },
    { name: 'tresc', type: 'TEXT', primaryKey: false, notNull: false },
  ]);
  const [previewSql, setPreviewSql] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setPreviewSql('');
    }
  }, [open]);

  useBodyScrollLock(open);

  if (!open) return null;

  const updateColumn = (index, key, value) => {
    setColumns((current) => current.map((column, columnIndex) => columnIndex === index ? { ...column, [key]: value } : column));
    setError('');
    setPreviewSql('');
  };

  const handlePreview = () => {
    try {
      const definition = normalizeTableDefinition({ tableName: tableName.trim(), columns });
      if (existingNames.includes(definition.tableName)) throw new Error(`Tabela ${definition.tableName} już istnieje.`);
      setPreviewSql(definition.sql);
      setError('');
    } catch (validationError) {
      setPreviewSql('');
      setError(validationError.message);
    }
  };

  const handleCreate = () => {
    try {
      const definition = normalizeTableDefinition({ tableName: tableName.trim(), columns });
      if (existingNames.includes(definition.tableName)) throw new Error(`Tabela ${definition.tableName} już istnieje.`);
      onCreate(definition);
      setPreviewSql('');
      setError('');
    } catch (validationError) {
      setError(validationError.message);
    }
  };

  return (
    <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="table-builder-modal" role="dialog" aria-modal="true" aria-labelledby="table-builder-title">
        <div className="modal-header-custom">
          <div><div className="modal-kicker">SQLite — własna struktura</div><h2 id="table-builder-title">Utwórz tabelę</h2><p>Zdefiniuj kolumny i zobacz SQL przed wykonaniem.</p></div>
          <button type="button" className="modal-close-button" aria-label="Zamknij kreator" onClick={onClose}><i className="bi bi-x-lg" aria-hidden="true" /></button>
        </div>
        <div className="modal-body-custom">
          <div className="builder-field">
            <label htmlFor="builder-table-name">Nazwa tabeli</label>
            <input id="builder-table-name" value={tableName} onChange={(event) => { setTableName(event.target.value); setPreviewSql(''); setError(''); }} placeholder="np. notatki" />
            <small>Używaj liter, cyfr i podkreśleń. Nazwa nie może zaczynać się cyfrą.</small>
          </div>
          <div className="builder-columns-heading"><span>Kolumny</span><button type="button" className="builder-add-column" onClick={() => setColumns((current) => [...current, blankColumn(current.length + 1)])}><i className="bi bi-plus-lg" aria-hidden="true" /> Dodaj kolumnę</button></div>
          <div className="builder-column-list">
            {columns.map((column, index) => (
              <div className="builder-column-row" key={`column-${index}`}>
                <input aria-label={`Nazwa kolumny ${index + 1}`} value={column.name} onChange={(event) => updateColumn(index, 'name', event.target.value)} />
                <select aria-label={`Typ kolumny ${index + 1}`} value={column.type} onChange={(event) => updateColumn(index, 'type', event.target.value)}>{SUPPORTED_COLUMN_TYPES.map((type) => <option value={type} key={type}>{type}</option>)}</select>
                <label className="builder-check"><input type="checkbox" checked={column.primaryKey} onChange={(event) => setColumns((current) => current.map((item, itemIndex) => ({ ...item, primaryKey: itemIndex === index ? event.target.checked : event.target.checked ? false : item.primaryKey })))} /> PK</label>
                <label className="builder-check"><input type="checkbox" checked={column.notNull} onChange={(event) => updateColumn(index, 'notNull', event.target.checked)} /> NN</label>
                <button type="button" className="builder-remove-column" aria-label={`Usuń kolumnę ${index + 1}`} disabled={columns.length === 1} onClick={() => setColumns((current) => current.filter((_, itemIndex) => itemIndex !== index))}><i className="bi bi-trash3" aria-hidden="true" /></button>
              </div>
            ))}
          </div>
          {error && <div className="builder-error" role="alert"><i className="bi bi-exclamation-circle" aria-hidden="true" /> {error}</div>}
          {previewSql && <div className="builder-preview"><div className="builder-preview-label">Wygenerowany SQL</div><code>{previewSql}</code></div>}
        </div>
        <div className="modal-footer-custom">
          <button type="button" className="btn btn-modal-ghost" onClick={onClose}>Anuluj</button>
          <div className="modal-footer-actions"><button type="button" className="btn btn-modal-preview" onClick={handlePreview}><i className="bi bi-eye" aria-hidden="true" /> Podgląd SQL</button><button type="button" className="btn btn-modal-create" onClick={handleCreate}><i className="bi bi-plus-lg" aria-hidden="true" /> Utwórz tabelę</button></div>
        </div>
      </section>
    </div>
  );
}

export default TableBuilderModal;

import { useEffect, useRef, useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

function MysqlExportModal({ open = false, databaseName, sourceLabel, script = '', fileName = 'eksport.sql', tableCount = 0, rowCount = 0, onClose }) {
  const [copyState, setCopyState] = useState('idle');
  const scriptRef = useRef(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (open) setCopyState('idle');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  const copyScript = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(script);
      } else {
        scriptRef.current?.select();
        document.execCommand('copy');
      }
      setCopyState('copied');
    } catch {
      scriptRef.current?.select();
      setCopyState('error');
    }
  };

  const downloadScript = () => {
    const blob = new Blob([script], { type: 'application/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section className="export-mysql-modal" role="dialog" aria-modal="true" aria-labelledby="export-mysql-title">
        <header className="modal-header-custom">
          <div>
            <div className="modal-kicker">MySQL / MariaDB</div>
            <h2 id="export-mysql-title">Eksport bazy do phpMyAdmin</h2>
            <p>{sourceLabel} → {databaseName} · {tableCount} tabel · {rowCount} rekordów</p>
          </div>
          <button type="button" className="modal-close-button" aria-label="Zamknij eksport" onClick={onClose}><i className="bi bi-x-lg" aria-hidden="true" /></button>
        </header>
        <div className="modal-body-custom export-mysql-body">
          <ol className="help-steps export-steps">
            <li><strong>Pobierz plik albo skopiuj skrypt.</strong><p>Skrypt zawiera schemat, relacje i wszystkie rekordy aktualnej bazy — także własne tabele i zmiany z ćwiczeń.</p></li>
            <li><strong>Otwórz phpMyAdmin.</strong><p>W XAMPP uruchom Apache i MySQL, potem wejdź na <code>http://localhost/phpmyadmin</code>.</p></li>
            <li><strong>Wklej albo zaimportuj.</strong><p>Wklej skrypt w zakładce <b>SQL</b> albo użyj zakładki <b>Import</b> i wskaż pobrany plik. Skrypt sam utworzy bazę i przełączy się na nią.</p></li>
          </ol>
          <label className="export-script-label" htmlFor="export-script">Skrypt SQL</label>
          <textarea id="export-script" ref={scriptRef} className="export-script" readOnly value={script} spellCheck="false" onFocus={(event) => event.target.select()} />
        </div>
        <footer className="modal-footer-custom">
          <div className="modal-footer-actions">
            <button type="button" className="btn btn-modal-ghost" onClick={onClose}>Zamknij</button>
            <button type="button" className="btn btn-modal-preview" onClick={copyScript}>
              <i className={`bi ${copyState === 'copied' ? 'bi-check2' : 'bi-clipboard'}`} aria-hidden="true" /> {copyState === 'copied' ? 'Skopiowano' : copyState === 'error' ? 'Zaznacz i Ctrl+C' : 'Kopiuj skrypt'}
            </button>
            <button type="button" className="btn btn-modal-create" onClick={downloadScript}><i className="bi bi-download" aria-hidden="true" /> Pobierz plik .sql</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default MysqlExportModal;

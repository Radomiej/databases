import { useEffect, useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

function SettingsModal({ open = false, version, mode = 'sqlite', datasetLabel, onClose, onResetDatabase, onFactoryReset }) {
  const [pendingAction, setPendingAction] = useState('');
  const [notice, setNotice] = useState('');

  useBodyScrollLock(open);

  useEffect(() => {
    if (open) {
      setPendingAction('');
      setNotice('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  const resetDatabase = () => {
    onResetDatabase?.();
    setPendingAction('');
    setNotice(`Przywrócono dane startowe bazy „${datasetLabel}”. Historia i postęp pozostały bez zmian.`);
  };

  const resetFactorySettings = async () => {
    try {
      const result = await onFactoryReset?.();
      setPendingAction('');
      setNotice(result?.historyCleared === false
        ? 'Przywrócono ustawienia aplikacji i nie zmieniono danych MySQL. Nie udało się usunąć historii z IndexedDB.'
        : 'Przywrócono ustawienia fabryczne aplikacji. Dane na serwerze MySQL nie zostały zmienione.');
    } catch (error) {
      setPendingAction('');
      setNotice(error instanceof Error ? error.message : 'Nie udało się wyczyścić wszystkich lokalnych danych.');
    }
  };

  return (
    <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <header className="modal-header-custom">
          <div><div className="modal-kicker">Aplikacja</div><h2 id="settings-modal-title">Ustawienia</h2><p>Wersja, dane lokalne i ustawienia kursu.</p></div>
          <button type="button" className="modal-close-button" aria-label="Zamknij ustawienia" onClick={onClose}><i className="bi bi-x-lg" aria-hidden="true" /></button>
        </header>
        <div className="modal-body-custom settings-modal-body">
          <div className="settings-version-row"><span><i className="bi bi-info-circle" aria-hidden="true" /> Wersja aplikacji</span><code>{version}</code></div>
          <section className="settings-action-card">
            <div><h3>Reset lokalnej bazy SQLite</h3><p>Aktywny zestaw: <strong>{datasetLabel}</strong>. Przywróci dane startowe, usunie własne tabele i przywróci domyślne relacje.</p><small>Nie usunie historii zapytań, szkiców ani postępu kursu.</small></div>
            {mode === 'sqlite' ? <button type="button" className="btn btn-settings-reset" onClick={() => { setNotice(''); setPendingAction('database'); }}>Resetuj lokalną bazę</button> : <button type="button" className="btn btn-settings-reset" disabled title="Przełącz się na SQLite, aby zresetować lokalną bazę">Resetuj lokalną bazę</button>}
            {pendingAction === 'database' && <div className="settings-confirmation" role="alert"><p>Przywrócić dane startowe bazy „{datasetLabel}”? Własne tabele tej bazy zostaną usunięte.</p><div><button type="button" className="btn btn-settings-ghost" onClick={() => setPendingAction('')}>Anuluj</button><button type="button" className="btn btn-settings-confirm" onClick={resetDatabase}>Potwierdź reset lokalnej bazy</button></div></div>}
          </section>
          <section className="settings-action-card is-danger">
            <div><h3>Ustawienia fabryczne</h3><p>Wyczyści lokalne szkice, własne tabele, relacje, historię, zapisane ustawienia połączenia i postęp kursu.</p><small>Ta operacja nie zmienia danych na serwerze MySQL.</small></div>
            <button type="button" className="btn btn-settings-reset" onClick={() => { setNotice(''); setPendingAction('factory'); }}>Przywróć ustawienia fabryczne</button>
            {pendingAction === 'factory' && <div className="settings-confirmation" role="alert"><p>Usunąć wszystkie wymienione dane lokalne i wrócić do domyślnego trybu, bazy oraz lekcji?</p><div><button type="button" className="btn btn-settings-ghost" onClick={() => setPendingAction('')}>Anuluj</button><button type="button" className="btn btn-settings-confirm" onClick={resetFactorySettings}>Potwierdź przywrócenie ustawień fabrycznych</button></div></div>}
          </section>
          {mode === 'mysql' && <div className="settings-info" role="note"><i className="bi bi-shield-lock" aria-hidden="true" /> Reset fabryczny czyści tylko dane aplikacji w tej przeglądarce — nie wysyła poleceń do MySQL.</div>}
          {notice && <div className="settings-notice" role="status">{notice}</div>}
        </div>
        <footer className="modal-footer-custom"><span>SQL Learning Lab · INF.03</span><button type="button" className="btn btn-modal-ghost" onClick={onClose}>Zamknij</button></footer>
      </section>
    </div>
  );
}

export default SettingsModal;

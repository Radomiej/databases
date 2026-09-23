import { useEffect } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

function HelpModal({ open = false, onClose }) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
        <header className="modal-header-custom">
          <div>
            <div className="modal-kicker">Krótki przewodnik</div>
            <h2 id="help-modal-title">Jak korzystać z SQL Learning Lab</h2>
            <p>Od wyboru bazy do samodzielnego rozwiązania zadania.</p>
          </div>
          <button type="button" className="modal-close-button" aria-label="Zamknij pomoc" onClick={onClose}><i className="bi bi-x-lg" aria-hidden="true" /></button>
        </header>
        <div className="modal-body-custom help-modal-body">
          <ol className="help-steps">
            <li><strong>Wybierz tryb pracy.</strong><p><b>SQLite — nauka</b> działa lokalnie i pozwala sprawdzać zadania. <b>MySQL — connector</b> łączy się z wybranym serwerem po skonfigurowaniu połączenia.</p></li>
            <li><strong>Wybierz bazę i lekcję.</strong><p>Każda baza zawiera własne tabele i dane. Treść lekcji pokazuje aktualny zakres materiału.</p></li>
            <li><strong>Zacznij od zadania pokazowego.</strong><p><b>Zadanie pokazowe</b> ma rozwiązanie wczytane do edytora. Następne zadania rozwiązujesz samodzielnie; możesz skorzystać z podpowiedzi.</p></li>
            <li><strong>Uruchom albo sprawdź zapytanie.</strong><p><b>Uruchom</b> pokazuje wynik SQL (skrót: Ctrl+Enter). <b>Sprawdź</b> ocenia odpowiedź w trybie SQLite i zalicza zadanie, jeśli wynik spełnia warunki.</p></li>
            <li><strong>Korzystaj ze schematu.</strong><p>Panel po prawej pokazuje tabele, kolumny, typy i relacje. Menu tabeli otwiera podgląd jej danych.</p></li>
            <li><strong>Pracuj z MySQL ostrożnie.</strong><p>Najpierw uzupełnij dane połączenia i przetestuj connector. Ocena zadań jest dostępna w trybie SQLite; MySQL służy do ćwiczeń na wybranej bazie.</p></li>
          </ol>
          <div className="help-note"><i className="bi bi-info-circle-fill" aria-hidden="true" /><span>Twoje niewykonane szkice SQL zapisują się osobno dla każdego zadania. Historia obejmuje tylko zapytania, które uruchomisz lub sprawdzisz.</span></div>
        </div>
        <footer className="modal-footer-custom help-modal-footer">
          <span>Powodzenia w ćwiczeniach!</span>
          <button type="button" className="btn btn-modal-create" onClick={onClose}>Rozumiem</button>
        </footer>
      </section>
    </div>
  );
}

export default HelpModal;

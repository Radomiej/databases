import { useEffect, useRef, useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';
import { generateTraining, TRAINING_LESSONS, TRAINING_THEMES } from '../services/trainingGenerator.js';

const defaults = { start: 1, end: 5, count: 5, difficulty: 'standard', theme: 'shop', rows: 24, hints: true, seed: '' };

export default function TrainingWizardModal({ open, onClose, onGenerate, generate = generateTraining }) {
  const [options, setOptions] = useState(defaults);
  const [scope, setScope] = useState('range');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  const dialog = useRef(null);
  useBodyScrollLock(open);
  useEffect(() => {
    request.current += 1;
    setBusy(false);
    setError('');
    if (!open) return undefined;
    setOptions((current) => ({ ...current, seed: '' }));
    const previous = document.activeElement;
    dialog.current?.querySelector('button, input, select')?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape') { request.current += 1; closeCallback.current(); }
      if (event.key === 'Tab') {
        const controls = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled)')];
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { request.current += 1; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [open]);

  if (!open) return null;
  const change = (field, value) => setOptions((current) => ({ ...current, [field]: value }));
  const close = () => { request.current += 1; onClose(); };
  const submit = async (event) => {
    event.preventDefault();
    const token = ++request.current;
    setBusy(true); setError('');
    try {
      const session = await generate({ ...options, end: scope === 'single' ? options.start : options.end });
      if (token === request.current) onGenerate(session);
    } catch (failure) { if (token === request.current) setError(failure.message ?? 'Nie udało się wygenerować zestawu.'); }
    finally { if (token === request.current) setBusy(false); }
  };
  const lessonOptions = TRAINING_LESSONS.map((lesson) => <option key={lesson.id} value={lesson.order}>{String(lesson.order).padStart(2, '0')} · {lesson.title}</option>);
  const selectedCount = scope === 'single' ? 1 : Number(options.end) - Number(options.start) + 1;
  return (
    <div className="modal-backdrop-custom" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="settings-modal training-wizard" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="training-wizard-title">
        <header className="modal-header-custom"><div><div className="modal-kicker">Samodzielna praktyka</div><h2 id="training-wizard-title">Twój trening SQL</h2><p>Nowa baza, nowe dane i zadania dopasowane do materiału.</p></div><button type="button" className="modal-close-button" onClick={close} aria-label="Zamknij kreator"><i className="bi bi-x-lg" /></button></header>
        <form onSubmit={submit} className="training-wizard-form">
          <div className="modal-body-custom settings-modal-body">
            <div className="training-info"><i className="bi bi-shield-check" /> Oddzielny sandbox SQLite. Bazy kursu i MySQL pozostaną bez zmian. Zadania są samodzielne — bez gotowych rozwiązań.</div>
            <fieldset disabled={busy}>
              <legend>1. Wybierz materiał</legend>
              <div className="training-scope"><label><input type="radio" name="training-scope" checked={scope === 'single'} onChange={() => setScope('single')} /> Jedna lekcja</label><label><input type="radio" name="training-scope" checked={scope === 'range'} onChange={() => { setScope('range'); if (options.end - options.start + 1 > 5) change('count', 10); }} /> Zakres lekcji</label></div>
              <div className="training-fields"><label htmlFor="training-start">{scope === 'single' ? 'Lekcja' : 'Od lekcji'}<select id="training-start" className="form-select" value={options.start} onChange={(event) => { const start = Number(event.target.value); setOptions((current) => ({ ...current, start, end: Math.max(start, current.end), count: current.end - start + 1 > 5 ? 10 : current.count })); }}>{lessonOptions}</select></label>{scope === 'range' && <label htmlFor="training-end">Do lekcji<select id="training-end" className="form-select" value={options.end} onChange={(event) => { const end = Number(event.target.value); setOptions((current) => ({ ...current, end, start: Math.min(end, current.start), count: end - current.start + 1 > 5 ? 10 : current.count })); }}>{lessonOptions}</select></label>}</div>
              <p className="training-caption">Dostępne: lekcje 1–8. Zadania utrwalają wybrany materiał i mogą korzystać z wiedzy z wcześniejszych lekcji.</p>
              <h3 className="training-section-title">2. Dopasuj zestaw</h3>
              <div className="training-fields">
                <label htmlFor="training-difficulty">Trudność<select id="training-difficulty" className="form-select" value={options.difficulty} onChange={(event) => change('difficulty', event.target.value)}><option value="easy">Podstawowy · proste polecenia</option><option value="standard">Standardowy · łączenie umiejętności</option><option value="challenge">Wyzwanie · więcej warunków i obliczeń</option></select></label>
                <label htmlFor="training-count">Liczba zadań<select id="training-count" className="form-select" value={options.count} onChange={(event) => change('count', Number(event.target.value))}><option value="5" disabled={selectedCount > 5}>5 zadań</option><option value="10">10 zadań</option></select></label>
                <label htmlFor="training-theme">Temat bazy<select id="training-theme" className="form-select" value={options.theme} onChange={(event) => change('theme', event.target.value)}>{TRAINING_THEMES.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label>
                <label htmlFor="training-rows">Wiersze w każdej tabeli<select id="training-rows" className="form-select" value={options.rows} onChange={(event) => change('rows', Number(event.target.value))}>{[12, 24, 48].map((rows) => <option key={rows} value={rows}>{rows} wierszy</option>)}</select></label>
              </div>
              <label className="training-check"><input type="checkbox" checked={options.hints} onChange={(event) => change('hints', event.target.checked)} /> Dostępne podpowiedzi (bez rozwiązania)</label>
              <h3 className="training-section-title">3. Opcjonalnie: wspólny zestaw dla klasy</h3>
              <label htmlFor="training-seed">Kod zestawu<input id="training-seed" className="form-control" value={options.seed} maxLength={80} placeholder="Puste pole = nowy losowy kod" onChange={(event) => change('seed', event.target.value)} /></label>
              <p className="training-caption">Ten sam kod i parametry odtwarzają identyczne dane i zadania. Postęp i kod zapisujemy w sesji tej karty, także po odświeżeniu.</p>
            </fieldset>
            {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
          </div>
          <footer className="modal-footer-custom"><button type="button" className="btn btn-modal-ghost" onClick={close}>Anuluj</button><button className="btn btn-run" type="submit" disabled={busy}>{busy ? 'Przygotowuję bazę…' : 'Utwórz sandbox'}</button></footer>
        </form>
      </section>
    </div>
  );
}

import { useState } from 'react';
import { getSqlQuickCheck } from '../data/sqlQuickChecks.js';

export default function LessonQuickCheck({ lessonId }) {
  const check = getSqlQuickCheck(lessonId);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  if (!check) return null;

  const correct = selected === check.correctIndex;
  return (
    <section className="sql-quick-check" aria-label="Krótka próba">
      <p className="sql-flow-eyebrow">02 · Sprawdź, czy rozumiesz</p>
      <fieldset>
        <legend>{check.question}</legend>
        {check.options.map((option, index) => (
          <label className={`sql-quick-option${checked && index === check.correctIndex ? ' is-correct' : ''}${checked && index === selected && !correct ? ' is-wrong' : ''}`} key={option}>
            <input type="radio" name={`sql-check-${lessonId}`} checked={selected === index} onChange={() => { setSelected(index); setChecked(false); }} />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <button type="button" className="sql-quick-check-button" disabled={selected === null} onClick={() => setChecked(true)}>Sprawdź odpowiedź</button>
      {checked && <p className={`sql-quick-feedback ${correct ? 'is-correct' : 'is-wrong'}`} role="status" aria-live="polite">
        {correct ? 'Dobrze. ' : 'Jeszcze nie. '}{check.options[check.correctIndex]}
      </p>}
      <button type="button" className="sql-quick-continue" onClick={() => document.getElementById('lesson-task-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Przejdź do zadań ↓</button>
    </section>
  );
}

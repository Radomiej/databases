import { useId, useState } from 'react';

function LessonWalkthrough({ walkthrough }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  if (!walkthrough?.steps?.length) return null;

  return (
    <section className="lesson-walkthrough" aria-label="Przykład krok po kroku">
      <button type="button" className="lesson-walkthrough-toggle" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded((value) => !value)}>
        <i className="bi bi-lightbulb" aria-hidden="true" /> Zobacz krok po kroku
        <i className={`bi bi-chevron-${expanded ? 'up' : 'down'}`} aria-hidden="true" />
      </button>
      {expanded && (
        <div id={contentId} className="lesson-walkthrough-content">
          <p className="lesson-walkthrough-question"><strong>Pytanie:</strong> {walkthrough.question}</p>
          {walkthrough.steps.map((step, index) => (
            <article className="lesson-walkthrough-step" key={`${index}-${step.title}`}>
              <h3>{index + 1}. {step.title}</h3>
              <p>{step.explanation}</p>
              <pre><code>{step.sql}</code></pre>
              <div className="lesson-walkthrough-result" role="region" aria-label={`Wynik kroku ${index + 1}`} tabIndex={0}>
                {step.expected.rows.length === 0 ? <p>Brak wierszy</p> : (
                  <table>
                    <thead><tr>{step.expected.columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
                    <tbody>{step.expected.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell === null ? <em>NULL</em> : String(cell)}</td>)}</tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            </article>
          ))}
          <p className="lesson-walkthrough-takeaway"><strong>Zapamiętaj:</strong> {walkthrough.takeaway}</p>
          <p className="lesson-walkthrough-pitfall"><strong>Uważaj:</strong> {walkthrough.pitfall}</p>
        </div>
      )}
    </section>
  );
}

export default LessonWalkthrough;

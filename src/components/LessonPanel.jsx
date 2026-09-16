function LessonPanel({ lesson, dataset, databaseStatus }) {
  return (
    <section className="lesson-overview">
      <div className="breadcrumb-line">
        <span>Bazy danych</span>
        <i className="bi bi-chevron-right" aria-hidden="true" />
        <span>{dataset.name}</span>
        <i className="bi bi-chevron-right" aria-hidden="true" />
        <span>Lekcje</span>
        <i className="bi bi-chevron-right" aria-hidden="true" />
        <strong>{String(lesson.order).padStart(2, '0')} / {lesson.title}</strong>
      </div>

      <div className="lesson-heading-row">
        <div>
          <div className="lesson-heading-meta">
            Lekcja {lesson.order} <span className="meta-divider">/</span> {lesson.difficulty}
          </div>
          <h1>{lesson.title}</h1>
          <p className="lesson-lead">{lesson.theory}</p>
        </div>
        <div className={`database-status ${databaseStatus === 'ready' ? 'is-ready' : ''}`}>
          <span className="status-pulse" aria-hidden="true" />
          {databaseStatus === 'ready' ? 'SQLite gotowe' : 'Przygotowuję SQLite'}
        </div>
      </div>

      <div className="task-callout">
        <div className="task-icon"><i className="bi bi-journal-code" aria-hidden="true" /></div>
        <div>
          <div className="task-label">Zadanie</div>
          <p>{lesson.task}</p>
        </div>
      </div>
    </section>
  );
}

export default LessonPanel;

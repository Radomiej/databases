import { getTaskProgressKey } from '../data/lessonTasks.js';

function LessonPanel({ lesson, dataset, databaseStatus, mode = 'sqlite', activeTaskId, taskProgress = {}, onTaskChange }) {
  const isReady = mode === 'mysql' ? databaseStatus === 'connected' : databaseStatus === 'ready';
  const statusLabel = mode === 'mysql' ? (isReady ? 'MySQL połączony' : 'MySQL connector') : (isReady ? 'SQLite gotowe' : 'Przygotowuję SQLite');
  const tasks = lesson.tasks?.length ? lesson.tasks : [{ id: `${lesson.id}-guided`, title: 'Zadanie', prompt: lesson.task }];
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? tasks[0];
  const completedCount = tasks.filter((task) => taskProgress[getTaskProgressKey(lesson.id, task.id)]).length;

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
        <div className={`database-status ${isReady ? 'is-ready' : ''}`}>
          <span className="status-pulse" aria-hidden="true" />
          {statusLabel}
        </div>
      </div>

      <section className="task-callout" aria-labelledby="lesson-task-title">
        <div className="task-callout-header">
          <div className="task-icon"><i className="bi bi-filetype-html" aria-hidden="true" /></div>
          <div className="task-callout-heading">
            <div className="task-label">Praktyka SQL</div>
            <h2 id="lesson-task-title">Zadanie do wykonania</h2>
            <p>{completedCount}/{tasks.length} zadań zaliczonych w tej sesji</p>
          </div>
          <span className="task-session-badge"><i className="bi bi-lightning-charge-fill" aria-hidden="true" /> Sesja</span>
        </div>

        <div className="task-checklist" role="list" aria-label="Zadania lekcji">
          {tasks.map((task, index) => {
            const isActive = task.id === activeTask?.id;
            const isCompleted = Boolean(taskProgress[getTaskProgressKey(lesson.id, task.id)]);
            return (
              <button type="button" className={`lesson-task-item ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`} aria-pressed={isActive} onClick={() => onTaskChange?.(task.id)} key={task.id}>
                <span className="lesson-task-check" aria-hidden="true">{isCompleted ? <i className="bi bi-check2" /> : index + 1}</span>
                <span className="lesson-task-copy">
                  <span className="lesson-task-meta">{index === 0 ? 'Prowadzone' : 'Samodzielne'} · Zadanie {index + 1}</span>
                  <strong>{task.title}</strong>
                  <span className="lesson-task-prompt">{task.prompt}</span>
                </span>
                <i className="bi bi-arrow-right-short lesson-task-arrow" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <div className="task-callout-note">
          <i className="bi bi-info-circle-fill" aria-hidden="true" />
          <span>{activeTask?.id === tasks[0]?.id ? 'Pierwsze zadanie jest prowadzone — przykład jest już w edytorze SQL.' : 'To zadanie rozwiązujesz samodzielnie. Napisz zapytanie i kliknij „Sprawdź”.'}</span>
        </div>
      </section>
    </section>
  );
}

export default LessonPanel;

import { useState } from 'react';
import { getTaskProgressKey } from '../data/lessonTasks.js';
import LessonWalkthrough from './LessonWalkthrough.jsx';

function describeColumn(column) {
  const parts = [column.name, column.type, column.primaryKey && 'PRIMARY KEY', column.notNull && !column.primaryKey && 'NOT NULL'];
  if (column.defaultValue !== undefined) {
    parts.push(`DEFAULT ${typeof column.defaultValue === 'string' ? `„${column.defaultValue}”` : column.defaultValue}`);
  }
  return parts.filter(Boolean).join(' ');
}

function TaskDetails({ task }) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="lesson-task-details">
      <p className="lesson-task-prompt">{task.prompt}</p>
      {task.expected?.columns?.length > 0 && (
        <div className="lesson-task-requirements">
          <span>Kolumny wyniku (w tej kolejności)</span>
          <code>{task.expected.columns.join(', ')}</code>
        </div>
      )}
      {task.expectedSchema?.tables?.map((table) => (
        <div className="lesson-task-requirements" key={table.name}>
          <span>Tabela: {table.name}</span>
          <ul>
            {table.columns?.map((column) => <li key={column.name}><code>{describeColumn(column)}</code></li>)}
            {table.foreignKeys?.map((key) => <li key={`${key.from}-${key.table}`}><code>{key.from} → {key.table}.{key.to}</code></li>)}
          </ul>
          {table.exactColumns && <small>Nie dodawaj innych kolumn.</small>}
        </div>
      ))}
      {task.hint && (
        <>
          <button type="button" className="lesson-task-hint-toggle" aria-expanded={showHint} onClick={() => setShowHint((value) => !value)}>
            <i className="bi bi-lightbulb" aria-hidden="true" /> {showHint ? 'Ukryj podpowiedź' : 'Pokaż podpowiedź'}
          </button>
          {showHint && <p className="lesson-task-hint">{task.hint}</p>}
        </>
      )}
    </div>
  );
}

function LessonPanel({ lesson, dataset, databaseStatus, mode = 'sqlite', activeTaskId, taskProgress = {}, onTaskChange }) {
  const [collapsedTaskId, setCollapsedTaskId] = useState(null);
  const isReady = mode === 'mysql' ? databaseStatus === 'connected' : databaseStatus === 'ready';
  const statusLabel = mode === 'mysql' ? (isReady ? 'MySQL połączony' : 'MySQL connector') : (isReady ? 'SQLite gotowe' : 'Przygotowuję SQLite');
  const tasks = lesson.tasks?.length ? lesson.tasks : [{ id: `${lesson.id}-guided`, title: 'Zadanie', prompt: lesson.task }];
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? tasks[0];
  const completedCount = tasks.filter((task) => taskProgress[getTaskProgressKey(lesson.id, task.id)]).length;

  return (
    <section className="lesson-overview">
      <div className="breadcrumb-line">
        <span>Bazy danych · {dataset.name} · Lekcja {lesson.order}</span>
      </div>

      <div className="lesson-heading-row">
        <div>
          <h1><i className="bi bi-journal-code" aria-hidden="true" /> {lesson.title}</h1>
          <p className="lesson-lead">{lesson.theory}</p>
        </div>
        <div className={`database-status ${isReady ? 'is-ready' : ''}`}>
          <span className="status-pulse" aria-hidden="true" />
          {statusLabel}
        </div>
      </div>

      <LessonWalkthrough walkthrough={lesson.walkthrough} />

      <section className="task-callout" aria-labelledby="lesson-task-title">
        <div className="task-callout-header">
          <div className="task-icon"><i className="bi bi-list-check" aria-hidden="true" /></div>
          <div className="task-callout-heading">
            <h2 id="lesson-task-title">Zadanie do wykonania</h2>
            <p>{completedCount}/{tasks.length} zadań zaliczonych w tej sesji</p>
          </div>
        </div>

        <div className="task-checklist" role="list" aria-label="Zadania lekcji">
          {tasks.map((task, index) => {
            const isActive = task.id === activeTask?.id;
            const isExpanded = isActive && collapsedTaskId !== task.id;
            const isCompleted = Boolean(taskProgress[getTaskProgressKey(lesson.id, task.id)]);
            return (
              <div className="lesson-task-entry" role="listitem" key={task.id}>
                <button type="button" className={`lesson-task-item ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`} aria-expanded={isExpanded} aria-controls={`task-details-${task.id}`} onClick={() => {
                  setCollapsedTaskId((current) => isActive ? (current === task.id ? null : task.id) : null);
                  if (!isActive) onTaskChange?.(task.id);
                }}>
                  <span className="lesson-task-check" aria-hidden="true">{isCompleted ? <i className="bi bi-check2" /> : index + 1}</span>
                  <span className="lesson-task-copy">
                    <span className="lesson-task-meta">{index === 0 ? 'Pokazowe' : 'Samodzielne'} · Zadanie {index + 1}</span>
                    <strong>{task.title}</strong>
                  </span>
                  <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} lesson-task-arrow`} aria-hidden="true" />
                </button>
                {isExpanded && <div id={`task-details-${task.id}`}><TaskDetails key={task.id} task={task} /></div>}
              </div>
            );
          })}
        </div>

        <div className="task-callout-note">
          <i className="bi bi-info-circle-fill" aria-hidden="true" />
          <span>{activeTask?.id === tasks[0]?.id ? 'Pierwsze zadanie jest pokazowe — przykład znajdziesz już w edytorze SQL.' : 'To zadanie rozwiązujesz samodzielnie. Napisz zapytanie, a następnie kliknij „Sprawdź”.'}</span>
        </div>
      </section>
    </section>
  );
}

export default LessonPanel;

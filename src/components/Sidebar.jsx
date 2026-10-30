import StudentIdentity from './StudentIdentity.jsx';

function Sidebar({
  telemetry,
  datasets,
  selectedDatasetId,
  onDatasetChange,
  lessons,
  selectedLessonId,
  onLessonChange,
  progress,
  onOpenSettings,
  onOpenHelp,
  onNavigate,
}) {
  const selectedDataset = datasets.find((dataset) => dataset.id === selectedDatasetId);
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId);
  const completedCount = Object.values(progress ?? {}).filter(Boolean).length;
  const generatorLevel = { Podstawowy: 'easy', Średni: 'standard', Rozszerzony: 'challenge' }[selectedLesson?.difficulty] ?? 'standard';

  return (
    <div className="sidebar-content">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true"><i className="bi bi-database-fill" /></div>
        <div>
          <div className="brand-name">SQL Learning Lab</div>
          <div className="brand-subtitle" title={telemetry?.machineId}>ID: {telemetry?.machineId?.slice(-6)||'—'}</div>
          <div className="brand-subtitle">{telemetry?.studentName||'Bez nazwy'}</div>
        </div>
      </div>

      <StudentIdentity telemetry={telemetry}/>
      <div className="sidebar-section">
        <div className="sidebar-section-heading">
          <span className="sidebar-section-label mb-0">Bazy danych</span>
          <span className="sidebar-count">{datasets.length}</span>
        </div>
        <div className="dataset-list" aria-label="Wybór bazy danych">
          {datasets.map((dataset) => (
            <button
              type="button"
              key={dataset.id}
              className={`dataset-item ${selectedDatasetId === dataset.id ? 'is-active' : ''}`}
              onClick={() => onDatasetChange(dataset.id)}
            >
              <span className="dataset-icon"><i className="bi bi-server" aria-hidden="true" /></span>
              <span className="dataset-copy">
                <span className="dataset-name">{dataset.name}</span>
                <span className="dataset-level">{dataset.level}</span>
              </span>
              {selectedDatasetId === dataset.id && <i className="bi bi-check2 ms-auto" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section lessons-section">
        <div className="sidebar-section-heading">
          <span className="sidebar-section-label mb-0">Lekcje</span>
          <span className="progress-count">{completedCount}/{lessons.length}</span>
        </div>
        <div className="lesson-list" aria-label="Lista lekcji">
          {lessons.map((lesson) => {
            const isActive = selectedLessonId === lesson.id;
            const isCompleted = Boolean(progress?.[lesson.id]);
            return (
              <button
                type="button"
                key={lesson.id}
                className={`lesson-nav-item ${isActive ? 'is-active' : ''}`}
                onClick={() => onLessonChange(lesson.id)}
              >
                <span className={`lesson-status-dot ${isCompleted ? 'is-completed' : ''}`} aria-hidden="true" />
                <span className="lesson-nav-copy">
                  <span className="lesson-nav-number">{String(lesson.order).padStart(2, '0')}</span>
                  <span className="lesson-nav-title">{lesson.title}</span>
                </span>
                {isCompleted && <i className="bi bi-check-circle-fill lesson-check" aria-label="Zaliczone" />}
              </button>
            );
          })}
        </div>
      </div>

      <a className="sidebar-generator" href={`#zadania?lekcja=${encodeURIComponent(selectedLessonId)}&poziom=${generatorLevel}`} onClick={onNavigate}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h4m3 1v6m-3-3h6"/></svg>Generator zadań</a>

      <div className="sidebar-footer">
        <div className="sidebar-footnote">
          <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
          <span><strong>{selectedDataset?.name ?? 'Baza'}</strong><br />gotowa do ćwiczeń</span>
        </div>
        <div className="sidebar-footer-links">
          <button type="button" className="sidebar-utility" onClick={onOpenSettings}><i className="bi bi-sliders2" aria-hidden="true" /> Ustawienia</button>
          <button type="button" className="sidebar-utility" onClick={onOpenHelp}><i className="bi bi-question-circle" aria-hidden="true" /> Pomoc</button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

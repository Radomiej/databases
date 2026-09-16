import ModeSelector from './ModeSelector.jsx';

function Sidebar({
  mode,
  onModeChange,
  datasets,
  selectedDatasetId,
  onDatasetChange,
  lessons,
  selectedLessonId,
  onLessonChange,
  progress,
}) {
  const selectedDataset = datasets.find((dataset) => dataset.id === selectedDatasetId);
  const completedCount = Object.values(progress ?? {}).filter(Boolean).length;

  return (
    <div className="sidebar-content">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true"><i className="bi bi-database-fill" /></div>
        <div>
          <div className="brand-name">SQL Learning Lab</div>
          <div className="brand-subtitle">INF.03 — praktyka czynna mistrza</div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Środowisko</div>
        <ModeSelector mode={mode} onChange={onModeChange} />
      </div>

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

      <div className="sidebar-footer">
        <div className="sidebar-footnote">
          <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
          <span><strong>{selectedDataset?.name ?? 'Baza'}</strong><br />gotowa do ćwiczeń</span>
        </div>
        <div className="sidebar-footer-links">
          <button type="button" className="sidebar-utility"><i className="bi bi-sliders2" aria-hidden="true" /> Ustawienia</button>
          <button type="button" className="sidebar-utility"><i className="bi bi-question-circle" aria-hidden="true" /> Pomoc</button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

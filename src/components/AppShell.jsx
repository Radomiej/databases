function AppShell({ children, sidebar, inspector, sidebarOpen, onSidebarClose }) {
  return (
    <div className="app-shell">
      <div className={`sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`} onClick={onSidebarClose} aria-hidden="true" />
      <aside className={`app-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Nawigacja aplikacji">
        <div className="sidebar-mobile-close">
          <button type="button" className="btn-close btn-close-white" aria-label="Zamknij menu" onClick={onSidebarClose} />
        </div>
        {sidebar}
      </aside>
      <div className="app-frame">
        <header className="mobile-header">
          <button type="button" className="mobile-menu-button" onClick={() => onSidebarClose(true)} aria-label="Otwórz menu">
            <i className="bi bi-list" aria-hidden="true" />
          </button>
          <span className="mobile-header-title">SQL Learning Lab</span>
          <span className="mobile-status-dot" aria-label="SQLite gotowe" />
        </header>
        <div className="app-content-grid">
          <main className="app-main-content">{children}</main>
          <aside className="app-inspector">{inspector}</aside>
        </div>
      </div>
    </div>
  );
}

export default AppShell;

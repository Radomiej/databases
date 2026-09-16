function App() {
  return (
    <main className="app-surface d-flex align-items-center justify-content-center min-vh-100 p-4">
      <section className="text-center">
        <p className="app-kicker mb-2">Laboratorium SQL</p>
        <h1 className="h2 mb-3">SQL Learning Lab</h1>
        <p className="text-secondary mb-4">Przygotowujemy środowisko do nauki zapytań.</p>
        <button type="button" className="btn btn-primary">
          <i className="bi bi-play-fill me-2" aria-hidden="true" />
          Uruchom
        </button>
      </section>
    </main>
  );
}

export default App;

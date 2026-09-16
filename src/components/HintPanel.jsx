function HintPanel({ hint, open, onToggle }) {
  return (
    <section className={`hint-panel ${open ? 'is-open' : ''}`}>
      <button type="button" className="hint-toggle" aria-expanded={open} onClick={onToggle}>
        <span className="hint-toggle-left"><i className="bi bi-lightbulb" aria-hidden="true" /> Podpowiedź</span>
        <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true" />
      </button>
      {open && <div className="hint-body"><i className="bi bi-arrow-return-right" aria-hidden="true" /><span>{hint}</span></div>}
    </section>
  );
}

export default HintPanel;

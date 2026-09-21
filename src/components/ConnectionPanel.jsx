function ConnectionPanel({
  connection,
  onChange,
  onTest,
  status = 'idle',
  statusMessage = '',
  serverVersion = '',
  rememberConnection,
  onRememberChange,
  allowMutations = false,
  mutationsAvailable = false,
  onAllowMutationsChange,
  allowSchemaMutations = false,
  schemaMutationsAvailable = false,
  onAllowSchemaMutationsChange,
}) {
  const update = (key, value) => onChange({ ...connection, [key]: key === 'port' ? Number(value) || '' : value });
  const statusLabel = status === 'loading' ? 'Sprawdzam...' : status === 'connected' ? 'Połączono' : status === 'error' ? 'Błąd połączenia' : 'Nie sprawdzono';

  return (
    <section className="connection-card" aria-labelledby="mysql-connection-title">
      <div className="connection-card-header">
        <div className="connection-heading">
          <div className="connection-icon"><i className="bi bi-plug" aria-hidden="true" /></div>
          <div><div className="connection-kicker">Node connector · mysql2</div><h2 id="mysql-connection-title">Połączenie z MySQL</h2><p>Połącz lokalną aplikację z bazą uruchomioną przez XAMPP lub inny serwer.</p></div>
        </div>
        <span className={`connection-status connection-status-${status}`}><span />{statusLabel}</span>
      </div>
      <div className="connection-fields">
        <div className="connection-field connection-field-host"><label htmlFor="mysql-host">Host</label><input id="mysql-host" value={connection.host} onChange={(event) => update('host', event.target.value)} placeholder="127.0.0.1" /></div>
        <div className="connection-field connection-field-port"><label htmlFor="mysql-port">Port</label><input id="mysql-port" type="number" min="1" max="65535" value={connection.port} onChange={(event) => update('port', event.target.value)} placeholder="3306" /></div>
        <div className="connection-field"><label htmlFor="mysql-database">Baza danych</label><input id="mysql-database" value={connection.database} onChange={(event) => update('database', event.target.value)} placeholder="inf03_lab" /></div>
        <div className="connection-field"><label htmlFor="mysql-user">Użytkownik</label><input id="mysql-user" value={connection.user} onChange={(event) => update('user', event.target.value)} placeholder="root" /></div>
        <div className="connection-field"><label htmlFor="mysql-password">Hasło</label><input id="mysql-password" type="password" value={connection.password} onChange={(event) => update('password', event.target.value)} placeholder="••••••••" autoComplete="off" /></div>
        <div className="connection-action"><button type="button" className="btn btn-connection-test" onClick={onTest} disabled={status === 'loading'}><i className="bi bi-arrow-repeat" aria-hidden="true" /> {status === 'loading' ? 'Sprawdzam' : 'Sprawdź połączenie'}</button></div>
      </div>
      <div className="connection-options">
        <label className="connection-checkbox"><input type="checkbox" checked={rememberConnection} onChange={(event) => onRememberChange(event.target.checked)} /> Zapamiętaj pozostałe pola <span>(bez hasła)</span></label>
        <label className={`connection-checkbox connection-write-option ${mutationsAvailable ? '' : 'is-disabled'}`} title={mutationsAvailable ? 'Włączaj tylko dla lokalnej bazy ćwiczeniowej.' : 'Ustaw MYSQL_ALLOW_MUTATIONS=true w server/.env.'}><input type="checkbox" checked={allowMutations} disabled={!mutationsAvailable} onChange={(event) => onAllowMutationsChange(event.target.checked)} /> Zezwól na zapis danych</label>
        <label className={`connection-checkbox connection-write-option ${schemaMutationsAvailable ? '' : 'is-disabled'}`} title={schemaMutationsAvailable ? 'Pozwala wykonywać CREATE TABLE i ALTER TABLE na wybranej bazie.' : 'Ustaw MYSQL_ALLOW_SCHEMA_MUTATIONS=true w server/.env.'}><input type="checkbox" checked={allowSchemaMutations} disabled={!schemaMutationsAvailable} onChange={(event) => onAllowSchemaMutationsChange(event.target.checked)} /> Zezwól na zmiany struktury</label>
      </div>
      {(statusMessage || serverVersion) && <div className={`connection-message ${status === 'connected' ? 'is-success' : status === 'error' ? 'is-error' : ''}`} role="status"><i className={`bi ${status === 'connected' ? 'bi-check-circle' : status === 'error' ? 'bi-exclamation-circle' : 'bi-info-circle'}`} aria-hidden="true" /><span>{statusMessage}{serverVersion && <> · MySQL {serverVersion}</>}</span></div>}
    </section>
  );
}

export default ConnectionPanel;

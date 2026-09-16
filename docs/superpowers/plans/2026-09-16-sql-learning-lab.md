# SQL Learning Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować lokalną aplikację React do nauki SQL z trybem SQLite, ocenianymi lekcjami, kreatorem tabel i opcjonalnym connector-em MySQL przez Node/Express.

**Architecture:** Frontend React/Vite uruchamia `sql.js` w przeglądarce dla szybkiej, powtarzalnej nauki. Osobny lokalny serwer Express udostępnia tylko API do MySQL przez `mysql2/promise`; frontend komunikuje się z nim przez `/api/mysql/*`. Dane lekcji, datasetów, wyników i stanu są rozdzielone od komponentów UI.

**Tech Stack:** React 18+, Vite, czysty JavaScript/JSX, Bootstrap 5, Bootstrap Icons, sql.js, Node.js, Express, mysql2/promise, Vitest, jsdom, React Testing Library, Concurrently.

**Spec:** `docs/superpowers/specs/2026-09-16-sql-learning-lab-design.md`

## Global Constraints

- Aplikacja ma być napisana w React + Vite + czystym JavaScript.
- Interfejs ma używać Bootstrap 5 i Bootstrap Icons.
- Tryb SQLite ma działać bez połączenia z MySQL i bez PHP.
- Connector MySQL ma działać przez lokalny backend Node/Express z `mysql2/promise`.
- Hasło MySQL nie może być zapisywane do pliku ani logowane.
- Mutacje MySQL są wyłączone domyślnie przez `MYSQL_ALLOW_MUTATIONS=false`.
- Pierwsza wersja ma mieć cztery datasety i dwanaście lekcji w języku polskim.
- `GROUP BY`, `HAVING`, `INNER JOIN` i `LEFT JOIN` muszą mieć działające ćwiczenia.
- Układ ma działać na desktopie, tablecie i mobile.
- Każdy etap kończy się sprawdzeniem i osobnym commitem.

---

### Task 1: Scaffold aplikacji i systemu uruchamiania

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles/app.css`
- Test: `src/App.test.jsx`

**Interfaces:**
- Produces `npm run dev`, `npm run server`, `npm run dev:all`, `npm run build` i `npm test`.
- Produces React root z komponentem `App` i ładowaniem Bootstrap CSS/JS oraz Bootstrap Icons.

- [ ] **Step 1: Napisz test smoke dla korzenia aplikacji**

```jsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SQL Learning Lab shell', () => {
  render(<App />);
  expect(screen.getByText('SQL Learning Lab')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /uruchom/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Uruchom test, aby potwierdzić kontrolowaną porażkę**

Run: `npm test -- --run src/App.test.jsx`  
Expected: FAIL, ponieważ projekt i komponent `App` jeszcze nie istnieją.

- [ ] **Step 3: Utwórz minimalny scaffold**

`package.json` ma zawierać skrypty:

```json
{
  "scripts": {
    "dev": "vite",
    "server": "node --watch server/index.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run server\"",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

`src/main.jsx` zaimportuje `bootstrap/dist/css/bootstrap.min.css`, `bootstrap`, `bootstrap-icons/font/bootstrap-icons.css` i zamontuje `<App />`.

`src/App.jsx` zwróci shell z nazwą aplikacji, podstawowym przyciskiem `Uruchom` i komunikatem inicjalizacji.

`vite.config.js` ustawi plugin React, alias `@` do `src` i proxy `/api` na `http://localhost:3001`.

- [ ] **Step 4: Uruchom test i build**

Run: `npm test -- --run src/App.test.jsx`  
Expected: PASS.  
Run: `npm run build`  
Expected: Vite tworzy katalog `dist` bez błędów.

- [ ] **Step 5: Zapisz etap**

```bash
git add package.json vite.config.js index.html .gitignore src
git commit -m "feat: scaffold SQL Learning Lab"
```

### Task 2: Model datasetów i silnik SQLite

**Files:**
- Create: `src/data/datasets.js`
- Create: `src/services/sqliteEngine.js`
- Create: `src/services/sqliteEngine.test.js`
- Create: `src/hooks/useSqliteDatabase.js`

**Interfaces:**
- `DATASETS`: tablica obiektów `{ id, name, level, summary, tables, relationships, seedSql }`.
- `createSqliteDatabase(dataset, initSqlJs)`: `Promise<{ db, destroy }>`.
- `executeSqliteQuery(db, sql)`: `{ ok, columns, rows, rowCount, durationMs, statementType, changedRows }`.
- `getSqliteSchema(db)`: `Array<{ name, columns, foreignKeys }>`.
- `useSqliteDatabase(datasetId)`: `{ status, error, execute, reset, schema }`.

- [ ] **Step 1: Napisz testy kontraktu silnika**

```js
import { describe, expect, it } from 'vitest';
import { normalizeSqliteRows, classifyStatement } from './sqliteEngine';

describe('sqlite engine helpers', () => {
  it('normalizes result columns and rows', () => {
    expect(normalizeSqliteRows({ columns: ['id'], values: [[1], [2]] })).toEqual({
      columns: ['id'],
      rows: [[1], [2]],
      rowCount: 2,
    });
  });

  it('classifies SQL statements without changing their contents', () => {
    expect(classifyStatement(' select * from ksiazki ')).toBe('SELECT');
    expect(classifyStatement('WITH x AS (SELECT 1) SELECT * FROM x')).toBe('WITH');
    expect(classifyStatement('insert into autorzy values (1, \'Jan\', \'Kowalski\', \'PL\')')).toBe('INSERT');
  });
});
```

- [ ] **Step 2: Uruchom testy helperów**

Run: `npm test -- --run src/services/sqliteEngine.test.js`  
Expected: FAIL, ponieważ helpery jeszcze nie istnieją.

- [ ] **Step 3: Dodaj cztery definicje baz i implementację silnika**

Każdy dataset musi generować poprawny skrypt `CREATE TABLE` i `INSERT` dla tabel:

```js
{
  id: 'sklep',
  name: 'Sklep internetowy',
  level: 'Średni',
  tables: [
    { name: 'klienci', columns: [{ name: 'id', type: 'INTEGER', pk: true }, ...] },
    { name: 'produkty', columns: [...] },
    { name: 'zamowienia', columns: [...] },
    { name: 'pozycje_zamowien', columns: [...] }
  ],
  relationships: [{ from: 'zamowienia.klient_id', to: 'klienci.id' }],
  seedSql: 'CREATE TABLE ...; INSERT INTO ...;'
}
```

Zdefiniuj `biblioteka` z 3 tabelami, `sklep` z 4, `szkola` z 5 i `kino` z 6 zgodnie ze specyfikacją. `executeSqliteQuery` ma mierzyć czas przez `performance.now()`, zwracać wynik `db.exec`, a dla `INSERT/UPDATE/DELETE/CREATE` zwracać pustą tabelę i `changedRows`.

`getSqliteSchema` wykona zapytania do `sqlite_master` oraz `PRAGMA table_info` i `PRAGMA foreign_key_list`.

- [ ] **Step 4: Dodaj test integracyjny datasetu sklepu**

```js
it('executes GROUP BY and LEFT JOIN against the seeded shop dataset', async () => {
  const { db, destroy } = await createSqliteDatabase(DATASETS.find((item) => item.id === 'sklep'), initSqlJsForTest);
  const grouped = executeSqliteQuery(db, 'SELECT k.miasto, COUNT(*) AS liczba FROM klienci k GROUP BY k.miasto ORDER BY k.miasto');
  const joined = executeSqliteQuery(db, 'SELECT p.nazwa, z.id FROM produkty p LEFT JOIN pozycje_zamowien z ON z.produkt_id = p.id ORDER BY p.id');
  expect(grouped.ok).toBe(true);
  expect(grouped.columns).toEqual(['miasto', 'liczba']);
  expect(joined.ok).toBe(true);
  expect(joined.columns).toEqual(['nazwa', 'id']);
  destroy();
});
```

`initSqlJsForTest` ma ładować `sql-wasm.wasm` przez ścieżkę pakietu `sql.js/dist/sql-wasm.wasm`, a nie przez sieć.

- [ ] **Step 5: Uruchom testy silnika i build**

Run: `npm test -- --run src/services/sqliteEngine.test.js`  
Expected: PASS.  
Run: `npm run build`  
Expected: PASS.

- [ ] **Step 6: Zapisz etap**

```bash
git add src/data/datasets.js src/services/sqliteEngine.js src/services/sqliteEngine.test.js src/hooks/useSqliteDatabase.js
git commit -m "feat: add seeded SQLite learning databases"
```

### Task 3: Lekcje, walidacja i postęp

**Files:**
- Create: `src/data/lessons.js`
- Create: `src/services/queryValidation.js`
- Create: `src/services/queryValidation.test.js`
- Create: `src/hooks/useLocalStorage.js`

**Interfaces:**
- `LESSONS`: 12 obiektów `{ id, order, title, datasetId, difficulty, theory, syntax, example, task, hint, solution, expected }`.
- `validateQueryResult(actual, expected)`: `{ passed, message, details }`.
- `useLocalStorage(key, initialValue)`: `[value, setValue]`.

- [ ] **Step 1: Napisz testy walidacji**

```js
import { describe, expect, it } from 'vitest';
import { validateQueryResult } from './queryValidation';

describe('query validation', () => {
  it('accepts the expected columns and rows', () => {
    expect(validateQueryResult(
      { ok: true, columns: ['miasto', 'liczba'], rows: [['Gdańsk', 2], ['Kraków', 1]] },
      { columns: ['miasto', 'liczba'], rows: [['Gdańsk', 2], ['Kraków', 1]], strictOrder: true },
    ).passed).toBe(true);
  });

  it('rejects a missing condition and explains the mismatch', () => {
    const result = validateQueryResult(
      { ok: true, columns: ['nazwa'], rows: [['Laptop'], ['Mysz']] },
      { columns: ['nazwa'], rows: [['Laptop']], strictOrder: true },
    );
    expect(result.passed).toBe(false);
    expect(result.message).toMatch(/wiersz|wynik/i);
  });
});
```

- [ ] **Step 2: Uruchom test i potwierdź porażkę**

Run: `npm test -- --run src/services/queryValidation.test.js`  
Expected: FAIL, ponieważ validator nie istnieje.

- [ ] **Step 3: Dodaj pełny program dwunastu lekcji**

Lekcje muszą pokrywać dokładnie: `SELECT/LIMIT`, `WHERE`, `ORDER BY`, `LIKE/IN/BETWEEN/IS NULL`, agregacje, `GROUP BY`, `HAVING`, `INNER JOIN`, `LEFT JOIN`, wielokrotne `JOIN` i aliasy, podzapytania/`WITH`, projekt INF.03. Każda lekcja dostaje działające zapytanie `solution` i oczekiwany wynik dla przypisanego datasetu.

Walidator ma porównywać nazwy kolumn oraz wartości znormalizowane do JSON. Przy `strictOrder: false` sortuje kopie wierszy przed porównaniem; przy `true` zachowuje kolejność.

- [ ] **Step 4: Uruchom testy i sprawdź kompletność treści**

Run: `npm test -- --run src/services/queryValidation.test.js`  
Expected: PASS.  
Run: `node -e \"const fs=require('fs'); const text=fs.readFileSync('src/data/lessons.js','utf8'); if ((text.match(/id:/g)||[]).length !== 12) process.exit(1)\"`  
Expected: exit code 0.

- [ ] **Step 5: Zapisz etap**

```bash
git add src/data/lessons.js src/services/queryValidation.js src/services/queryValidation.test.js src/hooks/useLocalStorage.js
git commit -m "feat: add INF03 SQL lessons and validation"
```

### Task 4: Shell UI, nawigacja i edytor SQL

**Files:**
- Create: `src/components/AppShell.jsx`
- Create: `src/components/Sidebar.jsx`
- Create: `src/components/ModeSelector.jsx`
- Create: `src/components/LessonPanel.jsx`
- Create: `src/components/SqlEditor.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles/app.css`
- Test: `src/components/SqlEditor.test.jsx`

**Interfaces:**
- `AppShell({ children, sidebar, inspector })` renders the three-region layout.
- `Sidebar({ mode, onModeChange, datasets, selectedDatasetId, onDatasetChange, lessons, selectedLessonId, onLessonChange, progress })` renders navigation.
- `SqlEditor({ value, onChange, onRun, onCheck, onReset, onShowSolution, disabled })` emits editor actions.

- [ ] **Step 1: Napisz test interakcji edytora**

```jsx
import { fireEvent, render, screen } from '@testing-library/react';
import SqlEditor from './SqlEditor';

test('emits edited SQL and run action', () => {
  const onChange = vi.fn();
  const onRun = vi.fn();
  render(<SqlEditor value="SELECT 1" onChange={onChange} onRun={onRun} onCheck={vi.fn()} onReset={vi.fn()} onShowSolution={vi.fn()} />);
  fireEvent.change(screen.getByRole('textbox', { name: /zapytanie sql/i }), { target: { value: 'SELECT 2' } });
  fireEvent.click(screen.getByRole('button', { name: /uruchom/i }));
  expect(onChange).toHaveBeenCalledWith('SELECT 2');
  expect(onRun).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Uruchom test**

Run: `npm test -- --run src/components/SqlEditor.test.jsx`  
Expected: FAIL, ponieważ komponent nie istnieje.

- [ ] **Step 3: Zaimplementuj layout i stany nawigacji**

`App` ma zarządzać `mode`, `datasetId`, `lessonId`, `sqlText`, `result`, `lastError`, `isHintOpen`, `isSolutionVisible` i historią zapytań. Domyślnie wybiera lekcję 1 oraz dataset `biblioteka`.

Sidebar używa semantycznych przycisków, pokazuje numer lekcji, aktywny stan i liczbę zaliczonych lekcji. `ModeSelector` ma dwa stany: `SQLite — nauka` i `MySQL — connector`.

`SqlEditor` używa dostępnego `<label>` i `<textarea>` z `aria-label="Zapytanie SQL"`, przycisków `Uruchom`, `Sprawdź`, `Wyczyść`, `Pokaż rozwiązanie`. Przyciski mają Bootstrap Icons, ale zachowują tekst.

- [ ] **Step 4: Dodaj style systemowe**

W `src/styles/app.css` zdefiniuj tokeny: granat raila, turkus aktywnego stanu, neutralne tło, białe powierzchnie, monospace edytora, promień `0.75rem`, cień panelu i breakpoint poniżej `992px`. Nie dodawaj dekoracyjnych gradientów ani atrap metryk.

- [ ] **Step 5: Uruchom test, build i ręcznie sprawdź układ**

Run: `npm test -- --run src/components/SqlEditor.test.jsx`  
Expected: PASS.  
Run: `npm run build`  
Expected: PASS.

- [ ] **Step 6: Zapisz etap**

```bash
git add src/App.jsx src/components src/styles/app.css
git commit -m "feat: add learning shell and SQL editor"
```

### Task 5: Wyniki, podpowiedzi, historia i ocenianie

**Files:**
- Create: `src/components/ResultsPanel.jsx`
- Create: `src/components/FeedbackAlert.jsx`
- Create: `src/components/HintPanel.jsx`
- Create: `src/components/HistoryPanel.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles/app.css`
- Test: `src/components/ResultsPanel.test.jsx`

**Interfaces:**
- `ResultsPanel({ result, history, onHistorySelect })` displays loading, error, empty, tabular and mutation states.
- `FeedbackAlert({ feedback })` displays success, info, warning or danger.
- `HintPanel({ hint, open, onToggle })` displays lesson hint without changing SQL.

- [ ] **Step 1: Napisz testy stanów wyników**

```jsx
import { render, screen } from '@testing-library/react';
import ResultsPanel from './ResultsPanel';

test('renders tabular query result with row count', () => {
  render(<ResultsPanel result={{ ok: true, columns: ['id'], rows: [[1], [2]], rowCount: 2, durationMs: 3 }} history={[]} onHistorySelect={vi.fn()} />);
  expect(screen.getByText('2 rekordy')).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: '1' })).toBeInTheDocument();
});

test('renders an educational error state', () => {
  render(<ResultsPanel result={{ ok: false, errorType: 'syntax', message: 'Nieznana kolumna' }} history={[]} onHistorySelect={vi.fn()} />);
  expect(screen.getByText('Nieznana kolumna')).toBeInTheDocument();
});
```

- [ ] **Step 2: Uruchom testy i potwierdź porażkę**

Run: `npm test -- --run src/components/ResultsPanel.test.jsx`  
Expected: FAIL, ponieważ panel nie istnieje.

- [ ] **Step 3: Zaimplementuj tabelę wyników i stany**

Tabela renderuje nagłówki z `columns`, komórki z `rows`, sticky header na desktopie, poziomy scroll na mobile, liczbę rekordów i czas. Brak wierszy otrzymuje komunikat `Zapytanie wykonało się poprawnie, ale nie zwróciło rekordów.`. Mutacje pokazują `changedRows` zamiast pustej tabeli.

Error state mapuje typy `syntax`, `unknown-column`, `connection`, `policy`, `timeout` na krótką wskazówkę.

- [ ] **Step 4: Podłącz ocenianie, postęp i historię**

`Uruchom` zapisuje wpis historii `{ id, sql, timestamp, datasetId, mode, resultSummary }` w `localStorage`. `Sprawdź` uruchamia bieżące zapytanie i w SQLite przekazuje wynik do `validateQueryResult`. Udane sprawdzenie zapisuje `progress[lessonId] = true` i pokazuje `Zaliczone`. Historia nie zapisuje haseł connectora.

- [ ] **Step 5: Uruchom testy i build**

Run: `npm test -- --run src/components/ResultsPanel.test.jsx`  
Expected: PASS.  
Run: `npm run build`  
Expected: PASS.

- [ ] **Step 6: Zapisz etap**

```bash
git add src/App.jsx src/components/ResultsPanel.jsx src/components/FeedbackAlert.jsx src/components/HintPanel.jsx src/components/HistoryPanel.jsx src/styles/app.css
git commit -m "feat: add SQL results feedback and progress"
```

### Task 6: Panel schematu i kreator tabel

**Files:**
- Create: `src/components/SchemaPanel.jsx`
- Create: `src/components/TableBuilderModal.jsx`
- Create: `src/services/schemaBuilder.js`
- Create: `src/services/schemaBuilder.test.js`
- Modify: `src/App.jsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- `buildCreateTableSql({ tableName, columns })`: returns a validated `CREATE TABLE` string.
- `SchemaPanel({ schema, relationships, selectedTable, onTableSelect })` renders table/column/foreign-key information.
- `TableBuilderModal({ open, onClose, onCreate })` calls `onCreate({ tableName, columns })`.

- [ ] **Step 1: Napisz testy buildera SQL**

```js
import { describe, expect, it } from 'vitest';
import { buildCreateTableSql } from './schemaBuilder';

describe('schema builder', () => {
  it('builds a safe CREATE TABLE statement', () => {
    expect(buildCreateTableSql({
      tableName: 'notatki',
      columns: [
        { name: 'id', type: 'INTEGER', primaryKey: true, notNull: true },
        { name: 'tresc', type: 'TEXT', primaryKey: false, notNull: false },
      ],
    })).toBe('CREATE TABLE "notatki" ("id" INTEGER PRIMARY KEY NOT NULL, "tresc" TEXT);');
  });

  it('rejects identifiers outside the supported SQL name format', () => {
    expect(() => buildCreateTableSql({ tableName: 'notatki; DROP TABLE x', columns: [] })).toThrow(/nazwa/i);
  });
});
```

- [ ] **Step 2: Uruchom testy**

Run: `npm test -- --run src/services/schemaBuilder.test.js`  
Expected: FAIL, ponieważ builder nie istnieje.

- [ ] **Step 3: Zaimplementuj walidację i generator**

Akceptuj tylko identyfikatory `/^[A-Za-z_][A-Za-z0-9_]*$/`, typy `INTEGER`, `TEXT`, `REAL`, `DATE`, co najmniej jedną kolumnę i najwyżej jeden klucz główny. Nazwy cytuj podwójnymi cudzysłowami po walidacji. Nie przyjmuj surowych fragmentów SQL z formularza.

- [ ] **Step 4: Zbuduj panel schematu i modal**

Panel pokazuje tabele, kolumny, typy, `PK`, `NOT NULL` i relacje `from → to`. Modal pozwala dodać/usunąć wiersze kolumn, wybierać typ, zaznaczyć klucz i wyświetlać wygenerowany SQL przed zatwierdzeniem. Po utworzeniu tabela jest wykonywana tylko w SQLite i odświeża schemat.

- [ ] **Step 5: Uruchom testy i build**

Run: `npm test -- --run src/services/schemaBuilder.test.js`  
Expected: PASS.  
Run: `npm run build`  
Expected: PASS.

- [ ] **Step 6: Zapisz etap**

```bash
git add src/components/SchemaPanel.jsx src/components/TableBuilderModal.jsx src/services/schemaBuilder.js src/services/schemaBuilder.test.js src/App.jsx src/styles/app.css
git commit -m "feat: add schema explorer and table builder"
```

### Task 7: Backend Express i polityka connectora MySQL

**Files:**
- Create: `server/index.js`
- Create: `server/mysqlClient.js`
- Create: `server/queryPolicy.js`
- Create: `server/queryPolicy.test.js`
- Create: `server/.env.example`
- Modify: `package.json`

**Interfaces:**
- `classifyMysqlStatement(sql)`: returns `SELECT | SHOW | DESCRIBE | EXPLAIN | WITH | INSERT | UPDATE | DELETE | DDL | UNKNOWN`.
- `isMysqlReadOnly(sql)`: boolean.
- `createMysqlConfig(input, env)`: `{ host, port, database, user, password, allowMutations }`.
- `executeMysqlQuery(config, sql)`: Promise of the shared result format.

- [ ] **Step 1: Napisz testy polityki zapytań**

```js
import { describe, expect, it } from 'vitest';
import { classifyMysqlStatement, isMysqlReadOnly } from './queryPolicy';

describe('MySQL query policy', () => {
  it('allows read statements', () => {
    expect(classifyMysqlStatement('SELECT * FROM klienci')).toBe('SELECT');
    expect(isMysqlReadOnly('SHOW TABLES')).toBe(true);
    expect(isMysqlReadOnly('WITH x AS (SELECT 1) SELECT * FROM x')).toBe(true);
  });

  it('blocks mutations by default', () => {
    expect(isMysqlReadOnly('DROP TABLE klienci')).toBe(false);
    expect(isMysqlReadOnly('UPDATE klienci SET miasto = \'Gdańsk\'')).toBe(false);
  });
});
```

- [ ] **Step 2: Uruchom test polityki**

Run: `npm test -- --run server/queryPolicy.test.js`  
Expected: FAIL, ponieważ backend nie istnieje.

- [ ] **Step 3: Zaimplementuj bezpieczny klient MySQL**

`server/mysqlClient.js` użyje `mysql2/promise` i `connection.execute(sql)`. Przed zapytaniem sprawdzi `isMysqlReadOnly(sql)`. Przy `allowMutations !== true` oraz `MYSQL_ALLOW_MUTATIONS !== 'true'` zwróci błąd `policy`. Po wykonaniu zmapuje obiekty MySQL do stabilnego `columns` i `rows`, a dla `ResultSetHeader` zwróci `changedRows`.

Nie używaj `console.log` dla body żądania, haseł ani pełnych zapytań. Po każdym request-cyklu zamknij połączenie lub zwolnij connection z poola. Ustaw timeout połączenia i zapytania na 5000 ms.

- [ ] **Step 4: Dodaj endpointy Express**

`server/index.js` uruchomi port `3001` i doda JSON limit `64kb` oraz endpointy:

```text
GET  /api/health
POST /api/mysql/test-connection
POST /api/mysql/query
POST /api/mysql/tables
POST /api/mysql/describe
```

Każdy endpoint waliduje wymagane pola, nie zwraca haseł, mapuje wyjątki na `ok: false`, a `/api/mysql/tables` wykonuje `SHOW TABLES`, zaś `/api/mysql/describe` bezpiecznie cytuje nazwę tabeli po walidacji identyfikatora.

- [ ] **Step 5: Dodaj `.env.example` i uruchom testy**

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=inf03_lab
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_ALLOW_MUTATIONS=false
PORT=3001
```

Run: `npm test -- --run server/queryPolicy.test.js`  
Expected: PASS.  
Run: `node server/index.js`  
Expected: serwer nasłuchuje na `http://localhost:3001`; zakończ po sprawdzeniu endpointu `/api/health`.

- [ ] **Step 6: Zapisz etap**

```bash
git add server package.json
git commit -m "feat: add local MySQL connector API"
```

### Task 8: UI connectora MySQL i przełączanie trybów

**Files:**
- Create: `src/components/ConnectionPanel.jsx`
- Create: `src/services/mysqlApi.js`
- Create: `src/services/mysqlApi.test.js`
- Modify: `src/App.jsx`
- Modify: `src/components/Sidebar.jsx`
- Modify: `src/components/SchemaPanel.jsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- `mysqlApi.testConnection(connection)`: Promise of `{ ok, message, serverVersion }`.
- `mysqlApi.runQuery(connection, sql, allowMutations)`: Promise of shared result format.
- `mysqlApi.listTables(connection)`: Promise of schema table names.
- `mysqlApi.describeTable(connection, tableName)`: Promise of schema columns.
- `ConnectionPanel({ connection, onChange, onTest, status, allowMutations, onAllowMutationsChange })` renders the connector form.

- [ ] **Step 1: Napisz test klienta API**

```js
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testConnection } from './mysqlApi';

describe('mysql api client', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));

  it('posts connection fields without storing them', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true, serverVersion: '8.0' }) });
    await testConnection({ host: '127.0.0.1', port: 3306, database: 'inf03_lab', user: 'root', password: 'secret' });
    expect(fetch).toHaveBeenCalledWith('/api/mysql/test-connection', expect.objectContaining({ method: 'POST' }));
    expect(JSON.stringify(fetch.mock.calls[0])).not.toContain('localStorage');
  });
});
```

- [ ] **Step 2: Uruchom test**

Run: `npm test -- --run src/services/mysqlApi.test.js`  
Expected: FAIL, ponieważ klient API nie istnieje.

- [ ] **Step 3: Zaimplementuj klienta i panel connectora**

Connection state ma kształt `{ host, port, database, user, password }`. Poza hasłem pozostałe wartości mogą być zapisane w `localStorage` tylko po zaznaczeniu opcji zapamiętywania. Hasło pozostaje w React state i jest czyszczone przy przełączeniu na SQLite.

Panel pokazuje status `Połączono`, `Niepołączono` lub `Błąd połączenia`. Przy `MYSQL_ALLOW_MUTATIONS=false` przełącznik zapisu jest disabled z wyjaśnieniem, a przy włączonej fladze pokazuje ostrzeżenie Bootstrap.

- [ ] **Step 4: Podepnij MySQL do wspólnego przepływu**

W trybie MySQL `Uruchom` używa `mysqlApi.runQuery`, `SchemaPanel` pobiera listę tabel przez API, a `Sprawdź` wykonuje zapytanie i pokazuje informację, że ocena jest dostępna tylko w trybie SQLite. Po błędzie connectora formularz pozostaje otwarty z bezpiecznym komunikatem.

- [ ] **Step 5: Uruchom testy i build**

Run: `npm test -- --run src/services/mysqlApi.test.js`  
Expected: PASS.  
Run: `npm run build`  
Expected: PASS.

- [ ] **Step 6: Zapisz etap**

```bash
git add src/components/ConnectionPanel.jsx src/services/mysqlApi.js src/services/mysqlApi.test.js src/App.jsx src/components/Sidebar.jsx src/components/SchemaPanel.jsx src/styles/app.css
git commit -m "feat: connect UI to MySQL mode"
```

### Task 9: Dokumentacja, skrypt MySQL i polish interfejsu

**Files:**
- Create: `README.md`
- Create: `docs/lesson-plan.md`
- Create: `docs/sql/mysql-setup.sql`
- Modify: `src/data/lessons.js`
- Modify: `src/styles/app.css`

**Interfaces:**
- Dokumentacja musi umożliwić uruchomienie SQLite bez MySQL oraz skonfigurowanie MySQL przez XAMPP lub inny lokalny serwer.
- `docs/sql/mysql-setup.sql` ma utworzyć bazę `inf03_lab`, tabele `kino` i przykładowe rekordy kompatybilne z lekcjami.

- [ ] **Step 1: Dodaj skrypt inicjalizujący MySQL**

Skrypt ma zawierać `CREATE DATABASE IF NOT EXISTS inf03_lab`, `USE inf03_lab`, `DROP TABLE IF EXISTS` w kolejności zależnej od kluczy obcych, `CREATE TABLE` z `ENGINE=InnoDB`, kluczami i indeksami oraz inserty dla datasetu `kino`.

- [ ] **Step 2: Napisz instrukcję uruchomienia**

README ma zawierać dokładnie:

```text
npm install
npm run dev
npm run server
```

oraz sposób skopiowania `server/.env.example` do `server/.env`, importu `docs/sql/mysql-setup.sql`, adres aplikacji, wymaganie Node 18+ i ostrzeżenie, że connector jest lokalny i nie powinien być wystawiany publicznie.

- [ ] **Step 3: Dodaj osobny plan lekcji dla użytkownika**

`docs/lesson-plan.md` opisze cel każdej z 12 lekcji, wymagane pojęcia, kolejność ćwiczeń i checklistę INF.03 do samodzielnego powtórzenia.

- [ ] **Step 4: Przejrzyj polish UI**

Sprawdź focus ring, kontrast, etykiety formularzy, `aria-live` na wynikach, `aria-expanded` na podpowiedzi, mobile offcanvas, overflow tabeli, sticky toolbar i `prefers-reduced-motion`.

- [ ] **Step 5: Uruchom build i testy**

Run: `npm test`  
Expected: wszystkie testy PASS.  
Run: `npm run build`  
Expected: PASS.

- [ ] **Step 6: Zapisz etap**

```bash
git add README.md docs/lesson-plan.md docs/sql/mysql-setup.sql src/data/lessons.js src/styles/app.css
git commit -m "docs: document SQL lessons and MySQL setup"
```

### Task 10: Weryfikacja przeglądarkowa i finalny przegląd

**Files:**
- Create during QA: `docs/qa/fidelity-ledger.md`
- Modify: any implementation files that fail the checks

**Interfaces:**
- Final app must pass functional smoke flow in SQLite and connector smoke flow without requiring a live MySQL server for the SQLite path.

- [ ] **Step 1: Uruchom frontend i backend**

Run: `npm run dev:all`  
Expected: Vite on `http://localhost:5173`, Express on `http://localhost:3001`.

- [ ] **Step 2: Sprawdź podstawowy przepływ SQLite w przeglądarce**

Wykonaj kolejno: wybierz `biblioteka` → lekcja 1 → uruchom `SELECT tytul FROM ksiazki LIMIT 3;` → sprawdź wynik i czas → otwórz podpowiedź → pokaż rozwiązanie → resetuj bazę.

- [ ] **Step 3: Sprawdź lekcje relacyjne**

Wykonaj działające przykłady dla `GROUP BY`, `HAVING`, `INNER JOIN` i `LEFT JOIN` na odpowiednich datasetach. Zaliczenie ma zmieniać stan postępu, a błędne zapytanie ma pokazać edukacyjny komunikat.

- [ ] **Step 4: Sprawdź kreator tabel**

Utwórz tabelę `notatki` z `id INTEGER PRIMARY KEY` i `tresc TEXT`, zatwierdź, sprawdź ją w panelu schematu, wykonaj `INSERT` i `SELECT`, a następnie odśwież stronę i sprawdź odtworzenie definicji.

- [ ] **Step 5: Sprawdź connector bez ujawniania danych**

Przełącz na MySQL, wprowadź konfigurację, kliknij `Sprawdź połączenie`, uruchom `SHOW TABLES`, wykonaj `SELECT`, sprawdź brak backendu i błędne dane. Potwierdź, że hasło nie trafia do historii/localStorage ani komunikatu błędu.

- [ ] **Step 6: Sprawdź viewporty i dostępność**

Zweryfikuj desktop, szerokość tabletu i mobile. Sprawdź klawiaturą przejście do textarea, uruchomienie przycisku, otwarcie podpowiedzi i odczyt wyniku przez `aria-live`.

- [ ] **Step 7: Zapisz fidelity ledger**

W `docs/qa/fidelity-ledger.md` zapisz co najmniej pięć punktów porównania: copy, layout, typografia, paleta, spacing/container, tabela wyników, responsive. Każdy punkt ma mieć stan `pass` albo konkretną poprawkę.

- [ ] **Step 8: Uruchom finalną weryfikację**

Run: `npm test`  
Expected: PASS.  
Run: `npm run build`  
Expected: PASS.  
Sprawdź `git status --short`, aby nie pozostawić tymczasowych artefaktów QA poza ledgerem.

- [ ] **Step 9: Zapisz etap**

```bash
git add docs/qa/fidelity-ledger.md src server README.md docs
git commit -m "test: verify SQL Learning Lab workflow"
```

## Self-Review Checklist

- Spec coverage: Task 1 obejmuje scaffold, Task 2 SQLite i datasety, Task 3 lekcje, Task 4–6 UI, Task 7–8 MySQL, Task 9 dokumentację, Task 10 weryfikację.
- Placeholder scan: plan nie zawiera pustych znaczników ani instrukcji bez konkretnej ścieżki testu.
- Type/interface consistency: `executeSqliteQuery`, `validateQueryResult`, `buildCreateTableSql`, `mysqlApi.runQuery` i wspólny format wyniku są nazwane tak samo we wszystkich zadaniach.
- Scope: backend PHP, phpMyAdmin jako API, logowanie, chmura i zdalny hosting pozostają wyłączone zgodnie ze specyfikacją.

# HAVING and JOIN Course Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the SQL course from 16 to 19 lessons with stepwise HAVING/JOIN explanations and remove the solution-reveal button from independent tasks while retaining answer checking.

**Architecture:** Keep lessons and grading in the existing React/JavaScript data flow. Derive displayed lesson numbers from the ordered lesson array; add three query lessons and a reusable, data-driven walkthrough component for lessons 7–12. Guard the editor's solution control using the active task's position, without changing the checker or saved progress keys.

**Tech Stack:** React 18, JavaScript, Bootstrap 5, sql.js, Vitest, Testing Library, Vite.

**Spec:** `docs/superpowers/specs/2026-09-24-having-joins-course-design.md`

## Global Constraints

- Keep existing lesson IDs and task IDs unchanged; saved drafts and progress are keyed by them.
- No Remotion, new datasets, backend routes, or MySQL schema changes in this implementation.
- Every new lesson has exactly one guided and two independent tasks; every required output alias must appear in its prompt.
- Examples and solutions may use only the current or earlier SQL topics, per `AGENT.md`.
- Preserve the existing uncommitted changes to task wording and expandable task cards.
- `Sprawdź` stays available for every task; only `Rozwiązanie` is hidden on non-guided tasks.

## Review Focus

1. Existing progress/drafts after renumbering: Task 1 test pins old IDs and ordered numbering; Task 6 App test switches and reloads with a saved independent draft.
2. Empty or absent walkthrough data: Task 2 component test confirms the panel is omitted for old lessons and handles a zero-row result.
3. One-to-many joins: Task 4 seed-backed tests assert Anna appears twice and Marek not at all in `INNER JOIN`.
4. Missing right-side rows: Task 5 seed-backed tests assert `LEFT JOIN` retains „W drodze” with `NULL` while `INNER JOIN` omits it.
5. Accidental solution reveal: Task 6 tests button visibility after task switches/reload and checks that grading still works.

---

## File map and contracts

- `src/data/lessons.js`: lesson definitions, ordered `LESSONS`, stable `LESSON_MAP`; each explanatory lesson receives `walkthrough`.
- `src/data/lessonTasks.js`: two independent tasks for each new lesson; existing `task()` and `buildLessonTasks()` remain.
- `src/data/lessonCurriculum.js`: topic order for all 15 query lessons.
- `src/components/LessonWalkthrough.jsx`: presentation-only component consuming `{ question, steps, takeaway, pitfall }`; each step has `{ title, explanation, sql, expected: { columns, rows } }`.
- `src/components/LessonPanel.jsx`: renders the optional walkthrough before the task checklist.
- `src/components/SqlEditor.jsx`: new boolean `showSolution` prop (default `true` for existing standalone usage).
- `src/App.jsx`: passes `showSolution={activeTask?.id === lessonTasks[0]?.id}`.
- `docs/lesson-plan.md`, `README.md`, `src/components/HelpModal.jsx`: course map and guided/independent behavior.

### Task 1: Insert the WHERE/HAVING consolidation lesson and derive numbering

**Files:** Modify `src/data/lessons.js`, `src/data/lessonTasks.js`, `src/data/lessonCurriculum.js`, `src/data/lessons.test.js`, `src/data/structureLessons.js`.

**Interfaces:** Consumes existing `buildLessonTasks(lesson)` and `validateQueryResult(result, expected)`. Produces `getLesson('where-having')` with three tasks; `LESSONS[i].order === i + 1`; old IDs unchanged.

- [ ] **Step 1: Write failing data tests.** In `lessons.test.js`, change expected totals to 17/13 and assert the relevant IDs and old stable keys:

```js
expect(LESSONS.map((lesson) => lesson.order)).toEqual(LESSONS.map((_, index) => index + 1));
expect(LESSONS.slice(6, 9).map((lesson) => lesson.id)).toEqual(['having', 'where-having', 'inner-join']);
expect(getLesson('having').tasks.map((task) => task.id)).toContain('popular-products');
expect(getLesson('where-having').tasks).toHaveLength(3);
```

- [ ] **Step 2: Run `npm test -- src/data/lessons.test.js`; expect RED** because `where-having` does not exist and totals are still 16/12.
- [ ] **Step 3: Add `where-having` immediately after `having`, with this guided solution and expected output:**

```js
{
  id: 'where-having',
  title: 'WHERE i HAVING razem',
  datasetId: 'sklep',
  difficulty: 'Średni',
  theory: 'WHERE usuwa pojedyncze zamówienia przed grupowaniem. GROUP BY tworzy grupy z pozostałych wierszy, a HAVING sprawdza wynik COUNT dla każdej grupy. Dzięki temu możesz pytać np. o klientów z więcej niż jednym zrealizowanym zamówieniem.',
  syntax: ["WHERE status = 'zrealizowane' GROUP BY klient_id HAVING COUNT(*) > 1;"],
  example: "SELECT klient_id, COUNT(*) AS liczba FROM zamowienia WHERE status = 'zrealizowane' GROUP BY klient_id HAVING COUNT(*) > 1 ORDER BY klient_id;",
  task: 'Pokaż klient_id oraz liczbę zrealizowanych zamówień jako liczba, ale tylko dla klientów mających więcej niż jedno takie zamówienie. Posortuj po klient_id rosnąco.',
  hint: "Najpierw WHERE status = 'zrealizowane', potem GROUP BY klient_id, na końcu HAVING COUNT(*) > 1.",
  solution: "SELECT klient_id, COUNT(*) AS liczba FROM zamowienia WHERE status = 'zrealizowane' GROUP BY klient_id HAVING COUNT(*) > 1 ORDER BY klient_id;",
  successMessage: 'Dobrze rozdzielasz filtrowanie wierszy od filtrowania grup.',
  expected: { columns: ['klient_id', 'liczba'], rows: [[1, 2]], strictOrder: true },
}
```

Add these two independent entries under `ADDITIONAL_LESSON_TASKS['where-having']`, each with prompt naming the exact alias and order:

```js
task('where-having-products', 'Pozycje w większej ilości', 'Z pozycji o ilosc >= 2 pokaż produkt_id i sumę ilości jako sztuk tylko dla grup z SUM(ilosc) >= 2. Posortuj po produkt_id.', 'WHERE wybiera pozycje przed sumowaniem; HAVING sprawdza sumę grupy.', 'SELECT produkt_id, SUM(ilosc) AS sztuk FROM pozycje_zamowien WHERE ilosc >= 2 GROUP BY produkt_id HAVING SUM(ilosc) >= 2 ORDER BY produkt_id;', { columns: ['produkt_id', 'sztuk'], rows: [[1, 2], [2, 2], [5, 2]], strictOrder: true }),
task('where-having-cities', 'Miasta z kilkoma klientami', 'Uwzględnij klientów z Gdańska, Krakowa lub Wrocławia. Pokaż miasto i liczbę klientów jako liczba tylko dla miast z co najmniej dwiema osobami. Posortuj alfabetycznie.', 'WHERE z IN wybiera trzy miasta przed liczeniem; HAVING COUNT(*) >= 2 wybiera grupy.', "SELECT miasto, COUNT(*) AS liczba FROM klienci WHERE miasto IN ('Gdańsk', 'Kraków', 'Wrocław') GROUP BY miasto HAVING COUNT(*) >= 2 ORDER BY miasto;", { columns: ['miasto', 'liczba'], rows: [['Gdańsk', 2], ['Kraków', 2]], strictOrder: true }),
```

Insert `{ lessonId: 'where-having', introduces: [] }` after `having` in `LESSON_TOPIC_PLAN`. Remove unused source-level `order` fields from the 12 core and 4 structure definitions, and derive order in `lessons.js`:

```js
const CORE_LESSONS = LESSON_DEFINITIONS.map((lesson) => ({ ...lesson, tasks: buildLessonTasks(lesson) }));
export const LESSONS = [...CORE_LESSONS, ...STRUCTURE_LESSONS]
  .map((lesson, index) => ({ ...lesson, order: index + 1 }));
```

- [ ] **Step 4: Run `npm test -- src/data/lessons.test.js src/data/structureLessons.test.js`; expect GREEN** for totals 17/13, existing schema tasks, and the three new query solutions.
- [ ] **Step 5: Commit only Task 1 files** with `git add` listing those files and `git commit -m "feat: add WHERE and HAVING lesson"`.

### Task 2: Render optional step-by-step explanations

**Files:** Create `src/components/LessonWalkthrough.jsx`, `src/components/LessonWalkthrough.test.jsx`; modify `src/components/LessonPanel.jsx`, `src/components/LessonPanel.test.jsx`, `src/styles/app.css`.

**Interfaces:** Consumes `lesson.walkthrough` with `question`, `steps`, `takeaway`, `pitfall`; each `step.expected` contains `columns` and `rows`. Produces an accessible expandable teaching block; no SQL execution in the component.

- [ ] **Step 1: Write failing component tests.** Render a fixture with one step, one `NULL` cell and an empty-row step. Assert `Zobacz krok po kroku` is closed initially, opening exposes `Pytanie`, SQL, table headers, literal `NULL` and `Brak wierszy`, closing hides them. In `LessonPanel.test.jsx`, assert a lesson without `walkthrough` has no walkthrough button.

```jsx
const walkthrough = {
  question: 'Który film nie ma seansu?',
  steps: [
    { title: 'Połącz', explanation: 'Brak seansu daje NULL.', sql: 'SELECT 1;', expected: { columns: ['seans_id'], rows: [[null]] } },
    { title: 'Pusty wynik', explanation: 'Brak dopasowań.', sql: 'SELECT 1 WHERE 0;', expected: { columns: ['id'], rows: [] } },
  ],
  takeaway: 'Lewa tabela pozostaje.',
  pitfall: 'Nie używaj = NULL.',
};
```

- [ ] **Step 2: Run `npm test -- src/components/LessonWalkthrough.test.jsx src/components/LessonPanel.test.jsx`; expect RED** because the component/button is missing.
- [ ] **Step 3: Implement the display-only component.** Use `useState(false)`, a button with `aria-expanded`/`aria-controls`, a `<section>` containing a `<pre><code>` query and semantic `<table>` for each step. Map `null` to a visible `<em>NULL</em>`, render `Brak wierszy` when rows are empty, and return `null` for missing/empty steps. Render `<LessonWalkthrough walkthrough={lesson.walkthrough} />` between the heading and task callout. Style tables with horizontal overflow at narrow widths and visible focus states.

```jsx
{step.expected.rows.length === 0
  ? <p>Brak wierszy</p>
  : <table><thead><tr>{step.expected.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{step.expected.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell === null ? <em>NULL</em> : String(cell)}</td>)}</tr>)}</tbody></table>}
```

- [ ] **Step 4: Rerun targeted tests; expect GREEN.** Also run `npm run build` to catch JSX/CSS integration errors.
- [ ] **Step 5: Commit Task 2 files** with `git commit -m "feat: show stepwise SQL lesson examples"`.

### Task 3: Expand the two HAVING explanations with seed-backed examples

**Files:** Modify `src/data/lessons.js`, `src/data/lessons.test.js`.

**Interfaces:** Adds `walkthrough` to `having` and `where-having` using Task 2's exact shape. Produces complete, runnable `step.sql` and exact `step.expected`.

- [ ] **Step 1: Write a failing seed-backed walkthrough test** in `lessons.test.js` for every lesson with `walkthrough`:

```js
it.each(QUERY_LESSONS.filter((lesson) => lesson.walkthrough))('walkthrough for $id matches its seed', async (lesson) => {
  const { db, destroy } = await createSqliteDatabase(DATASET_MAP[lesson.datasetId], initSqlJsForTest, () => wasmPath);
  for (const step of lesson.walkthrough.steps) {
    const result = executeSqliteQuery(db, step.sql);
    expect(result.ok, `${lesson.id}/${step.title}: ${result.message}`).toBe(true);
    expect(result.columns).toEqual(step.expected.columns);
    expect(result.rows).toEqual(step.expected.rows);
  }
  destroy();
});
```

Require both lesson IDs to have `walkthrough` before the parameterized test, so the test is red. Extend the progression test to inspect each walkthrough SQL and task hint via `getSqlTopics()` against allowed topics. The existing aggregates guided hint mentions the future `GROUP BY`; replace it with `Użyj COUNT(*) oraz ROUND(AVG(cena), 2) dla całej tabeli produkty.` before rerunning the progression test.
- [ ] **Step 2: Run `npm test -- src/data/lessons.test.js`; expect RED** because the two walkthroughs are missing.
- [ ] **Step 3: Add Polish question, explanation, takeaway, pitfall and these ordered query/result steps:**

| Lesson | Step | Query | Exact rows |
| --- | --- | --- | --- |
| `having` | Wiersze | `SELECT klient_id FROM zamowienia ORDER BY klient_id;` | `[[1],[1],[2],[3],[4],[5]]` |
| `having` | Grupy | `SELECT klient_id, COUNT(*) AS liczba FROM zamowienia GROUP BY klient_id ORDER BY klient_id;` | `[[1,2],[2,1],[3,1],[4,1],[5,1]]` |
| `having` | Wybrane grupy | `SELECT klient_id, COUNT(*) AS liczba FROM zamowienia GROUP BY klient_id HAVING COUNT(*) > 1 ORDER BY klient_id;` | `[[1,2]]` |
| `where-having` | Najpierw WHERE | `SELECT klient_id, status FROM zamowienia WHERE status = 'zrealizowane' ORDER BY id;` | `[[1,'zrealizowane'],[1,'zrealizowane'],[4,'zrealizowane']]` |
| `where-having` | Potem grupy | `SELECT klient_id, COUNT(*) AS liczba FROM zamowienia WHERE status = 'zrealizowane' GROUP BY klient_id ORDER BY klient_id;` | `[[1,2],[4,1]]` |
| `where-having` | Na końcu HAVING | Guided solution from Task 1 | `[[1,2]]` |

`having` teaches `WHERE` filters source rows and `HAVING` filters counted groups; `where-having` shows both in one query. Explicitly label the illustrative logical sequence, not a guaranteed physical engine plan. Use `expected.columns` from each SELECT list (`klient_id`, `status`, `liczba`).

Use this copy for the explanatory framing (step titles match the table above): `having.question` = `Którzy klienci złożyli więcej niż jedno zamówienie?`, `having.takeaway` = `GROUP BY tworzy grupy, a HAVING wybiera grupy po policzeniu zamówień.`, `having.pitfall` = `WHERE COUNT(*) > 1 nie działa: WHERE nie filtruje gotowych grup.`; `where-having.question` = `Którzy klienci mają więcej niż jedno zrealizowane zamówienie?`, `where-having.takeaway` = `WHERE wybiera zamówienia, zanim je policzymy; HAVING wybiera grupy po liczeniu.`, `where-having.pitfall` = `Jeśli pominiesz WHERE, policzysz również zamówienia o innym statusie.` Każde objaśnienie kroku ma wskazać konkretną liczbę: klient 1 występuje dwa razy, a po `WHERE` klient 4 występuje raz.
- [ ] **Step 4: Rerun `npm test -- src/data/lessons.test.js`; expect GREEN** for all six sample steps and topic progression.
- [ ] **Step 5: Commit Task 3 files** with `git commit -m "docs: explain HAVING through real query results"`.

### Task 4: Add the one-to-many INNER JOIN lesson

**Files:** Modify `src/data/lessons.js`, `src/data/lessonTasks.js`, `src/data/lessonCurriculum.js`, `src/data/lessons.test.js`.

**Interfaces:** Produces `getLesson('inner-join-matches')` after `inner-join` with three tasks and two `walkthrough` values, for existing `inner-join` and new lesson.

- [ ] **Step 1: Write failing tests** for 18/14 lessons, order `['inner-join', 'inner-join-matches', 'left-join']`, three new tasks, and exact seed-backed duplicate/missing-row behavior:

```js
expect(getLesson('inner-join-matches').tasks).toHaveLength(3);
expect(getLesson('inner-join-matches').walkthrough.steps.at(-1).expected.rows).toEqual([['Anna', 'Nowak', 1], ['Anna', 'Nowak', 3]]);
expect(getLesson('inner-join-matches').walkthrough.steps.at(-1).expected.rows.some((row) => row.includes('Marek'))).toBe(false);
```

- [ ] **Step 2: Run `npm test -- src/data/lessons.test.js`; expect RED.**
- [ ] **Step 3: Insert the new definition, task entries and curriculum entry.** Use dataset `sklep`, title `INNER JOIN — wiele dopasowań`, difficulty `Średni`. Theory: `INNER JOIN tworzy jeden wiersz wyniku dla każdej pasującej pary. Jeśli Anna ma dwa zamówienia, pojawi się dwa razy. Klient bez zamówienia, taki jak Marek, nie pojawi się wcale. Warunek ON wskazuje, które wartości kluczy mają się zgadzać.` Syntax: `FROM klienci k INNER JOIN zamowienia z ON z.klient_id = k.id`. Example: `SELECT k.imie, z.id AS zamowienie_id FROM klienci k INNER JOIN zamowienia z ON z.klient_id = k.id;`. Guided prompt: `Dla klientów o id 1 lub 6 pokaż imie, nazwisko oraz identyfikator każdego dopasowanego zamówienia jako zamowienie_id. Posortuj po id zamówienia. Klient bez zamówienia nie powinien się pojawić.` Hint: `Zacznij od klienci, połącz zamowienia przez ON, ogranicz klientów przez IN i posortuj po z.id.` Success message: `Rozumiesz, dlaczego jedna osoba może dać kilka wierszy, a inna zniknąć z INNER JOIN.` Guided SQL and independent tasks are:

```sql
SELECT k.imie, k.nazwisko, z.id AS zamowienie_id FROM klienci k INNER JOIN zamowienia z ON z.klient_id = k.id WHERE k.id IN (1, 6) ORDER BY z.id;
SELECT k.imie, z.status FROM klienci k INNER JOIN zamowienia z ON z.klient_id = k.id WHERE k.miasto = 'Gdańsk' ORDER BY z.id;
SELECT k.imie, COUNT(z.id) AS liczba_zamowien FROM klienci k INNER JOIN zamowienia z ON z.klient_id = k.id GROUP BY k.id, k.imie HAVING COUNT(z.id) > 1 ORDER BY k.id;
```

Expected columns/rows respectively: `['imie','nazwisko','zamowienie_id']` → `[['Anna','Nowak',1],['Anna','Nowak',3]]`; `['imie','status']` → `[['Anna','zrealizowane'],['Anna','zrealizowane'],['Maria','nowe']]`; `['imie','liczba_zamowien']` → `[['Anna',2]]`. All require strict order. Independent prompts must state these output columns (including alias) and conditions; hints describe `ON`, `WHERE`, `GROUP BY` without pasting the full query. Add `{ lessonId: 'inner-join-matches', introduces: [] }` immediately after `inner-join`.

Independent prompt 1: `Pokaż imie klienta i status każdego zamówienia klientów z Gdańska. Posortuj po id zamówienia; jedna osoba może wystąpić kilka razy.` Independent prompt 2: `Pokaż imie klienta i liczbę jego zamówień jako liczba_zamowien tylko dla klientów z więcej niż jednym zamówieniem. Posortuj po id klienta.` Use titles `Zamówienia klientów z Gdańska` and `Klienci z wieloma zamówieniami`.

Add `walkthrough` to both INNER lessons. Use these complete steps, each with a Polish `title` and one-sentence `explanation`; the generic seed test from Task 3 checks every `expected`:

| Lesson | Query | Exact rows |
| --- | --- | --- |
| `inner-join` | `SELECT id, klient_id FROM zamowienia WHERE id IN (1, 2) ORDER BY id;` | `[[1,1],[2,2]]` |
| `inner-join` | `SELECT id, imie FROM klienci WHERE id IN (1, 2) ORDER BY id;` | `[[1,'Anna'],[2,'Piotr']]` |
| `inner-join` | `SELECT z.id, k.imie, z.status FROM zamowienia z INNER JOIN klienci k ON k.id = z.klient_id WHERE z.id IN (1, 2) ORDER BY z.id;` | `[[1,'Anna','zrealizowane'],[2,'Piotr','wysłane']]` |
| `inner-join-matches` | `SELECT id, imie, nazwisko FROM klienci WHERE id IN (1, 6) ORDER BY id;` | `[[1,'Anna','Nowak'],[6,'Marek','Lewandowski']]` |
| `inner-join-matches` | `SELECT id, klient_id FROM zamowienia WHERE klient_id IN (1, 6) ORDER BY id;` | `[[1,1],[3,1]]` |
| `inner-join-matches` | Guided solution above | `[['Anna','Nowak',1],['Anna','Nowak',3]]` |

The first lesson's takeaway: `ON` pairs `zamowienia.klient_id` with `klienci.id`. The second: each matching order creates a result row; Marek has no match and disappears. Do not deduplicate Anna.
Use questions `Który klient złożył każde zamówienie?` and `Dlaczego Anna pojawia się dwa razy, a Marek wcale?` respectively. Pitfalls: `Samo FROM obu tabel bez ON tworzy błędne pary.` and `INNER JOIN nie zachowuje klienta, który nie ma zamówienia.`
- [ ] **Step 4: Run `npm test -- src/data/lessons.test.js`; expect GREEN** for all new tasks, walkthoughs, counts and topic progression.
- [ ] **Step 5: Commit Task 4 files** with `git commit -m "feat: teach one-to-many INNER JOIN"`.

### Task 5: Add a same-data INNER/LEFT comparison lesson

**Files:** Modify `src/data/lessons.js`, `src/data/lessonTasks.js`, `src/data/lessonCurriculum.js`, `src/data/lessons.test.js`.

**Interfaces:** Produces `getLesson('join-comparison')` after `left-join`, with three tasks; adds `walkthrough` to both `left-join` and `join-comparison`. Final totals: 19 lessons, 15 query lessons, 4 structure lessons.

- [ ] **Step 1: Write failing tests** for final order, totals and distinction between the same SQL with `INNER` vs `LEFT`:

```js
expect(LESSONS).toHaveLength(19);
expect(QUERY_LESSONS).toHaveLength(15);
expect(LESSONS.slice(8, 12).map((lesson) => lesson.id)).toEqual(['inner-join', 'inner-join-matches', 'left-join', 'join-comparison']);
expect(getLesson('join-comparison').walkthrough.steps[0].expected.rows).toEqual([['Cicha rzeka', 1], ['Cicha rzeka', 5]]);
expect(getLesson('join-comparison').walkthrough.steps[1].expected.rows).toEqual([['Cicha rzeka', 1], ['Cicha rzeka', 5], ['W drodze', null]]);
```

- [ ] **Step 2: Run `npm test -- src/data/lessons.test.js`; expect RED.**
- [ ] **Step 3: Add `join-comparison` on `kino`, with title `INNER JOIN kontra LEFT JOIN` and difficulty `Rozszerzony`.** Theory: `Na tych samych tabelach INNER JOIN usuwa film bez seansu, a LEFT JOIN zachowuje go z NULL po stronie seansu. Typ połączenia wybierasz według pytania: tylko dopasowane rekordy czy również rekordy bez pary?`. Syntax: `FROM filmy f INNER JOIN seanse s ON s.film_id = f.id` and `FROM filmy f LEFT JOIN seanse s ON s.film_id = f.id`. Example: the first query in the comparison block below. Guided prompt: `Dla filmów o id 1 i 5 pokaż tytul oraz identyfikator seansu jako seans_id. Zachowaj film bez seansu i posortuj po id filmu, potem po id seansu.` Hint: `Zacznij od filmy i użyj LEFT JOIN; brak seansu pojawi się jako NULL.` Success message: `Potrafisz dobrać JOIN do pytania o rekordy bez pary.` Independent tasks and known outputs:

```sql
SELECT f.tytul, s.id AS seans_id FROM filmy f LEFT JOIN seanse s ON s.film_id = f.id WHERE f.id IN (1, 5) ORDER BY f.id, s.id;
SELECT f.tytul, COUNT(s.id) AS liczba_seansow FROM filmy f LEFT JOIN seanse s ON s.film_id = f.id GROUP BY f.id, f.tytul HAVING COUNT(s.id) = 0 ORDER BY f.id;
SELECT k.imie, COUNT(b.id) AS liczba_biletow FROM klienci k LEFT JOIN bilety b ON b.klient_id = k.id GROUP BY k.id, k.imie HAVING COUNT(b.id) = 0 ORDER BY k.id;
```

Expected respectively: `['tytul','seans_id']` → `[['Cicha rzeka',1],['Cicha rzeka',5],['W drodze',null]]`; `['tytul','liczba_seansow']` → `[['W drodze',0]]`; `['imie','liczba_biletow']` → `[['Paweł',0]]`. Prompts must name these exact aliases and conditions. Add `{ lessonId: 'join-comparison', introduces: [] }` after `left-join`.

Independent prompt 1: `Pokaż tytul filmu bez seansu i liczbę jego seansów jako liczba_seansow (zero). Uporządkuj po id filmu.` Independent prompt 2: `Pokaż imie klienta bez biletu i liczbę jego biletów jako liczba_biletow (zero). Uporządkuj po id klienta.` Titles: `Film bez seansu` and `Klient bez biletu`.

Add `walkthrough` to existing `left-join` with three steps:

| Query | Exact rows |
| --- | --- |
| `SELECT id, tytul FROM filmy WHERE id IN (1, 5) ORDER BY id;` | `[[1,'Cicha rzeka'],[5,'W drodze']]` |
| `SELECT id, film_id FROM seanse WHERE film_id IN (1, 5) ORDER BY id;` | `[[1,1],[5,1]]` |
| Guided `LEFT JOIN` comparison query below | `[['Cicha rzeka',1],['Cicha rzeka',5],['W drodze',null]]` |

For `join-comparison`, use exactly these two full queries as consecutive steps, with identical `SELECT`, `FROM`, `ON`, `WHERE` and `ORDER BY`, differing only in `INNER` vs `LEFT`:

```sql
SELECT f.tytul, s.id AS seans_id FROM filmy f INNER JOIN seanse s ON s.film_id = f.id WHERE f.id IN (1, 5) ORDER BY f.id, s.id;
SELECT f.tytul, s.id AS seans_id FROM filmy f LEFT JOIN seanse s ON s.film_id = f.id WHERE f.id IN (1, 5) ORDER BY f.id, s.id;
```

The final explanatory step is `SELECT f.tytul, s.id AS seans_id FROM filmy f LEFT JOIN seanse s ON s.film_id = f.id WHERE f.id IN (1, 5) AND s.id IS NULL ORDER BY f.id, s.id;`; it returns `[['W drodze', null]]` and stays within already taught `IS NULL` and `LEFT JOIN` topics. The takeaway says `INNER` removes the film without a match; `LEFT` retains it with a null right-side ID. The pitfall says `COUNT(*)` on a left join does not mean the number of matched seanse; use `COUNT(s.id)`.
Use questions `Jak pokazać film, który nie ma seansu?` for the existing LEFT lesson and `Czym różni się wynik INNER JOIN od LEFT JOIN dla tych samych filmów?` for the new comparison lesson. Give each step a title explaining which table or result it shows.
- [ ] **Step 4: Run `npm test -- src/data/lessons.test.js src/data/structureLessons.test.js`; expect GREEN** for all 19 lessons and seed-backed walkthroughs.
- [ ] **Step 5: Commit Task 5 files** with `git commit -m "feat: compare INNER and LEFT JOIN on the same data"`.

### Task 6: Hide solutions for independent tasks, retain checking

**Files:** Modify `src/components/SqlEditor.jsx`, `src/components/SqlEditor.test.jsx`, `src/App.jsx`, `src/App.test.jsx`.

**Interfaces:** `SqlEditor({ value, onChange, onRun, onCheck, onReset, onShowSolution, showSolution = true, disabled = false })`; `App` passes `showSolution={activeTask?.id === lessonTasks[0]?.id}`.

- [ ] **Step 1: Write failing tests.** In `SqlEditor.test.jsx`, render with `showSolution={false}` and assert `queryByRole('button', {name:'Rozwiązanie'})` is null while `getByRole('button', {name:'Sprawdź'})` exists. Render with `showSolution={true}` and assert the reveal button exists. In `App.test.jsx`, select a second task, verify no reveal button, enter its correct SQL, click `Sprawdź`, verify the task is marked complete; switch back to guided task and verify reveal button returns. Reload/remount with a saved independent draft and assert it remains independent and the solution control stays absent after reselecting that task.
- [ ] **Step 2: Run `npm test -- src/components/SqlEditor.test.jsx src/App.test.jsx`; expect RED** because the button is always rendered.
- [ ] **Step 3: Implement the flag and App binding.** Preserve all existing actions; wrap only the reveal control:

```jsx
{showSolution && (
  <button type="button" className="btn btn-editor-secondary" onClick={onShowSolution} disabled={disabled}>
    <i className="bi bi-file-earmark-code" aria-hidden="true" />Rozwiązanie
  </button>
)}
```

In `App.jsx`, pass `showSolution={activeTask?.id === lessonTasks[0]?.id}`. Keep `onCheck={handleCheck}` unchanged and do not expose `activeTask.solution` elsewhere in independent-task UI.
- [ ] **Step 4: Rerun targeted tests; expect GREEN.** Verify existing saved-draft tests still pass.
- [ ] **Step 5: Commit Task 6 files** with `git commit -m "feat: keep independent task answers hidden"`.

### Task 7: Synchronize course documentation and run end-to-end verification

**Files:** Modify `docs/lesson-plan.md`, `README.md`, `src/components/HelpModal.jsx`; test `src/data/lessons.test.js`, `src/App.test.jsx` (only if a documentation assertion needs adjustment).

**Interfaces:** No new runtime API. Documentation must match the 19-lesson `LESSONS` export and solution-button policy.

- [ ] **Step 1: Add failing documentation assertions.** In `lessons.test.js`, read `docs/lesson-plan.md`, extract `## N. Title` headings and assert 19 sequential numbers and that positions 7–12 match the lesson titles. In `App.test.jsx` or a focused HelpModal test, assert help explains that guided tasks offer a solution while independent tasks keep only checking.
- [ ] **Step 2: Run targeted tests; expect RED** because the outline still has 16 headings and help does not describe the new policy.
- [ ] **Step 3: Rewrite headings 7–19 in `docs/lesson-plan.md` with new goals and practice topics; fix the old note suggesting aliases in lesson 1 and three-table JOIN in the introductory INNER lesson.** Use this exact heading sequence:

```text
## 7. HAVING krok po kroku
## 8. WHERE i HAVING razem
## 9. INNER JOIN — dopasowanie po kluczach
## 10. INNER JOIN — wiele dopasowań
## 11. LEFT JOIN — rekordy bez pary
## 12. INNER JOIN kontra LEFT JOIN
## 13. Wielokrotne JOIN i aliasy
## 14. Podzapytania i WITH
## 15. Projekt INF.03
## 16. CREATE TABLE
## 17. Kolumny i ograniczenia
## 18. ALTER TABLE
## 19. Relacje i inspekcja schematu
```

For each new heading, state the one-sentence goal from the spec's course-order table and one practice topic (`HAVING COUNT`, `WHERE` then `HAVING`, `ON` key match, one-to-many duplicates, `LEFT` and `NULL`, or same-data comparison). Update README's 12+4 statement to 15+4 and describe the walkthrough. Add this exact sentence to HelpModal: `W zadaniu pokazowym możesz zobaczyć rozwiązanie; w samodzielnym przycisk „Rozwiązanie” jest ukryty, ale „Sprawdź” nadal ocenia Twoje zapytanie.` Keep wording natural Polish and the INF.03 context; do not claim MySQL writes or Remotion media exist.
- [ ] **Step 4: Run `npm test`, `npm run build`, and `git diff --check`; expect all passing.** In the browser at `http://127.0.0.1:5173/`, inspect lessons 7–12 at desktop and narrow widths, open/close a walkthrough, switch guided/independent tasks, verify `Sprawdź` still grades, and verify `Rozwiązanie` is absent only for independent tasks.
- [ ] **Step 5: Commit documentation and any final focused corrections** with `git commit -m "docs: update 19-lesson INF.03 course map"`. Report final test counts and any untested MySQL behavior; do not push without a request.

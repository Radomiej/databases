import { COURSE_LESSONS } from '../data/lessons.js';
import { createSqliteDatabase, executeSqliteQuery, getSqliteSchema, classifyStatement } from './sqliteEngine.js';
import { validateQueryResult } from './queryValidation.js';

export const TRAINING_LESSONS = COURSE_LESSONS.filter((lesson) => lesson.order <= 8);
export const TRAINING_THEMES = [
  { id: 'shop', name: 'Sklep', tables: ['produkty', 'klienci'], categories: ['Dom', 'Biuro', 'Ogród'], items: ['Lampa', 'Krzesło', 'Stolik', 'Regał'] },
  { id: 'sport', name: 'Klub sportowy', tables: ['sprzet', 'zawodnicy'], categories: ['Fitness', 'Bieganie', 'Pływanie'], items: ['Zestaw', 'Torba', 'Mata', 'Akcesoria'] },
  { id: 'rental', name: 'Wypożyczalnia', tables: ['wyposazenie', 'wypozyczajacy'], categories: ['Turystyka', 'Sport', 'Narzędzia'], items: ['Pakiet', 'Zestaw', 'Model', 'Komplet'] },
];

function randomFromSeed(seed) {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const literal = (value) => value === null ? 'NULL' : typeof value === 'number' ? String(value) : `'${value.replaceAll("'", "''")}'`;

function normalizeOptions(input) {
  const options = { start: 1, end: 5, count: 5, difficulty: 'standard', theme: 'shop', rows: 24, hints: true, ...input };
  for (const field of ['start', 'end', 'count', 'rows']) options[field] = Number(options[field]);
  if (!Number.isInteger(options.start) || !Number.isInteger(options.end) || options.start < 1 || options.end > 8 || options.start > options.end) throw new Error('Wybierz lekcje od 1 do 8.');
  if (![5, 10].includes(options.count) || options.count < options.end - options.start + 1) throw new Error('Wybierz 10 zadań, aby objąć wszystkie lekcje w tym zakresie.');
  if (![12, 24, 48].includes(options.rows) || !['easy', 'standard', 'challenge'].includes(options.difficulty) || !TRAINING_THEMES.some((theme) => theme.id === options.theme)) throw new Error('Nieprawidłowe parametry zestawu.');
  options.seed = String(options.seed ?? '').trim() || `SQL-${globalThis.crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  if (options.seed.length > 80) throw new Error('Kod zestawu może mieć maksymalnie 80 znaków.');
  return options;
}

function buildTask(order, index, options, theme, random) {
  const table = theme.tables[index % 2];
  const items = theme.tables[0];
  const people = theme.tables[1];
  const threshold = 20 + Math.floor(random() * 24) * 10;
  const limit = 2 + (index % 4);
  const advanced = options.difficulty !== 'easy';
  const challenge = options.difficulty === 'challenge';
  let sql, prompt, hint, strictOrder = false, subsetSql;
  if (order === 1) {
    const projection = index % 3 === 0 ? '*' : table === items ? (index % 3 === 1 ? 'nazwa, cena' : 'id, kategoria') : (index % 3 === 1 ? 'imie, miasto' : 'id, status');
    const capped = index % 3 !== 2;
    sql = `SELECT ${projection} FROM ${table}${capped ? ` LIMIT ${limit}` : ''};`;
    prompt = `Z tabeli ${table} pobierz ${projection === '*' ? 'wszystkie kolumny' : `kolumny ${projection}`}${capped ? ` i ogranicz wynik do ${limit} wierszy. Dowolne ${limit} wierszy z tej tabeli są poprawne; kolejność nie ma znaczenia.` : ' dla wszystkich wierszy. Kolejność nie ma znaczenia.'}`;
    hint = `SELECT wybiera kolumny, FROM wskazuje tabelę.${capped ? ` LIMIT ${limit} ogranicza liczbę wierszy.` : ' Gwiazdka oznacza wszystkie kolumny.'}`;
    if (capped) subsetSql = `SELECT ${projection} FROM ${table};`;
  } else if (order === 2) {
    sql = `SELECT nazwa, cena FROM ${items} WHERE cena >= ${threshold}${advanced ? ' AND ilosc >= 2' : ''};`;
    prompt = `Z tabeli ${items} wybierz nazwy i ceny pozycji, których cena wynosi co najmniej ${threshold}${advanced ? ' i ilość wynosi co najmniej 2' : ''}.`;
    hint = `Użyj WHERE i porównania >=.${advanced ? ' Oba warunki połącz operatorem AND.' : ''}`;
  } else if (order === 3) {
    const sort = ['cena', 'ilosc', 'nazwa'][index % 3];
    const descending = index % 2 !== 0;
    sql = `SELECT id, nazwa, cena FROM ${items} ORDER BY ${sort} ${descending ? 'DESC' : 'ASC'}, id ASC LIMIT ${limit};`;
    prompt = `Z tabeli ${items} wybierz id, nazwa, cena. Posortuj według ${sort} ${descending ? 'malejąco' : 'rosnąco'}, a przy tej samej wartości ${sort} według id rosnąco. Zwróć pierwsze ${limit} wierszy.`;
    hint = 'ORDER BY określa kolejność. Podaj dwa klucze sortowania oddzielone przecinkiem, a na końcu LIMIT.';
    strictOrder = true;
  } else if (order === 4) {
    if (index % 2) {
      const prefix = ['A', 'E', 'J', 'M', 'An', 'Ad', 'Al', 'Ma'][Math.floor(random() * 8)];
      const projection = index % 3 ? 'id, imie, miasto' : 'id, imie, status';
      sql = `SELECT ${projection} FROM ${people} WHERE imie LIKE '${prefix}%'${challenge ? " AND status IN ('aktywny', 'nowy')" : ''};`;
      prompt = `Z tabeli ${people} wybierz ${projection} dla osób, których imię zaczyna się od „${prefix}”${challenge ? ' i status to aktywny lub nowy' : ''}.`;
      hint = `LIKE '${prefix}%' oznacza tekst zaczynający się od „${prefix}”.${challenge ? ' IN pozwala podać listę dopuszczalnych statusów.' : ''}`;
    } else {
      const present = index % 4 === 0;
      const projection = index % 8 === 0 ? 'id, nazwa, cena, opis' : 'id, nazwa, opis';
      sql = `SELECT ${projection} FROM ${items} WHERE opis IS ${present ? 'NOT ' : ''}NULL${challenge ? ` AND cena BETWEEN 20 AND 240` : ''};`;
      prompt = `Z tabeli ${items} pobierz ${projection} dla pozycji ${present ? 'z uzupełnionym opisem' : 'bez opisu'}${challenge ? ', z ceną od 20 do 240 włącznie' : ''}.`;
      hint = `Brak wartości sprawdzaj przez IS NULL, a obecność przez IS NOT NULL.${challenge ? ' BETWEEN obejmuje obie granice przedziału.' : ''}`;
    }
  } else if (order === 5) {
    sql = `SELECT COUNT(*) AS liczba${advanced ? ', SUM(ilosc) AS laczna_ilosc' : ''} FROM ${items} WHERE cena >= ${threshold};`;
    prompt = `W tabeli ${items} policz pozycje o cenie co najmniej ${threshold}. Wynik COUNT(*) nazwij liczba${advanced ? '; sumę wartości ilosc dla tych pozycji nazwij laczna_ilosc' : ''}. Zwróć jeden wiersz.`;
    hint = `COUNT(*) liczy wiersze. AS nadaje wymaganą nazwę kolumnie.${advanced ? ' SUM(ilosc) sumuje ilości, a nie liczbę wierszy.' : ''}`;
  } else if (order === 6) {
    const group = ['kategoria', 'ilosc', 'cena'][index % 3];
    const metric = ['COUNT(*)', 'SUM(ilosc)', 'MAX(cena)', 'MIN(cena)'][Math.floor(random() * 4)];
    const alias = metric === 'COUNT(*)' ? 'liczba' : metric === 'SUM(ilosc)' ? 'laczna_ilosc' : metric === 'MAX(cena)' ? 'najwyzsza_cena' : 'najnizsza_cena';
    sql = `SELECT ${group}, ${metric} AS ${alias} FROM ${items} GROUP BY ${group};`;
    prompt = `Pogrupuj pozycje z tabeli ${items} według kolumny ${group}. Dla każdej grupy oblicz ${metric} i nazwij wynik ${alias}. Zwróć ${group} oraz ${alias}. Jeden wiersz wyniku ma odpowiadać jednej grupie.`;
    hint = `GROUP BY ${group} tworzy grupy o tej samej wartości tej kolumny. ${metric} obliczane jest osobno w każdej grupie.`;
  } else if (order === 7) {
    const metric = index % 2 ? 'SUM(ilosc)' : 'COUNT(*)';
    const minimum = metric === 'COUNT(*)' ? 1 + Math.floor(random() * (options.rows / 2)) : 1 + Math.floor(random() * options.rows * 2);
    const alias = metric === 'COUNT(*)' ? 'liczba' : 'laczna_ilosc';
    sql = `SELECT kategoria, ${metric} AS ${alias} FROM ${items} GROUP BY kategoria HAVING ${metric} >= ${minimum};`;
    prompt = `Pogrupuj pozycje z ${items} według kategoria. Oblicz ${metric} dla każdej kategorii i nazwij wynik ${alias}. Pokaż wyłącznie kategorie, dla których ${metric} wynosi co najmniej ${minimum}. Zwróć kategoria oraz ${alias}.`;
    hint = `GROUP BY tworzy grupy, a HAVING sprawdza wynik ${metric} dla całej grupy. AS nadaje wynikowi wymaganą nazwę.`;
  } else {
    const minimum = 2 + Math.floor(random() * (options.rows / 3));
    sql = `SELECT kategoria, COUNT(*) AS liczba FROM ${items} WHERE cena >= ${threshold}${advanced ? ' AND ilosc >= 2' : ''} GROUP BY kategoria HAVING COUNT(*) >= ${minimum};`;
    prompt = `W tabeli ${items} najpierw pozostaw pozycje z ceną co najmniej ${threshold}${advanced ? ' i ilosc co najmniej 2' : ''}. Następnie pogrupuj je według kategoria i pokaż tylko grupy mające co najmniej ${minimum} takie pozycje. Zwróć kategoria i COUNT(*) pod nazwą liczba.`;
    hint = 'WHERE filtruje pojedyncze wiersze przed grupowaniem. HAVING filtruje grupy po obliczeniu COUNT(*).';
  }
  const lesson = TRAINING_LESSONS.find((entry) => entry.order === order);
  return { id: `training-${index + 1}`, lessonOrder: order, lessonId: lesson.id, lessonTitle: lesson.title, table: order === 1 ? table : order === 4 && index % 2 ? people : items, title: `Zadanie ${index + 1}`, prompt, hint, solution: sql, strictOrder, subsetSql };
}

export async function generateTraining(input, initializer, locateFile) {
  const options = normalizeOptions(input);
  const random = randomFromSeed(options.seed);
  const theme = TRAINING_THEMES.find((entry) => entry.id === options.theme);
  const [items, people] = theme.tables;
  const itemRows = [], personRows = [];
  const names = ['Anna', 'Adam', 'Ewa', 'Jan', 'Alicja', 'Maria'];
  const cities = ['Kraków', 'Gdańsk', 'Poznań'];
  for (let i = 0; i < options.rows; i += 1) {
    itemRows.push([i + 1, `${theme.items[i % 4]} ${Math.floor(random() * 900) + 100}`, theme.categories[i % 6 < 3 ? 0 : i % 6 < 5 ? 1 : 2], i === options.rows - 1 ? 320 : 20 + Math.floor(random() * 30) * 10, 1 + (i % 6), i % 4 === 0 ? null : `Seria ${1 + Math.floor(random() * 5)}`]);
    personRows.push([i + 1, names[i % 6], cities[Math.floor(random() * 3)], ['aktywny', 'nowy', 'nieaktywny'][i % 3]]);
  }
  const dataset = { id: `training-${options.seed}`, name: `${theme.name} · trening`, tables: [], relationships: [], seedSql: `CREATE TABLE ${items} (id INTEGER PRIMARY KEY, nazwa TEXT NOT NULL, kategoria TEXT NOT NULL, cena REAL NOT NULL, ilosc INTEGER NOT NULL DEFAULT 0, opis TEXT);
CREATE TABLE ${people} (id INTEGER PRIMARY KEY, imie TEXT NOT NULL, miasto TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'nowy');
INSERT INTO ${items} VALUES ${itemRows.map((row) => `(${row.map(literal).join(',')})`).join(',')};
INSERT INTO ${people} VALUES ${personRows.map((row) => `(${row.map(literal).join(',')})`).join(',')};` };
  const { db, destroy } = await createSqliteDatabase(dataset, initializer, locateFile);
  try {
    dataset.tables = getSqliteSchema(db);
    const used = new Set();
    const tasks = Array.from({ length: options.count }, (_, index) => {
      const order = options.start + (index % (options.end - options.start + 1));
      let task, result;
      for (let attempt = 0; attempt < 1000; attempt += 1) {
        task = buildTask(order, attempt === 0 ? index : Math.floor(random() * 1000), options, theme, random);
        result = executeSqliteQuery(db, task.solution);
        const withoutHaving = order >= 7 ? executeSqliteQuery(db, task.solution.replace(/ HAVING[\s\S]*;/, ';')) : null;
        if (result.ok && result.rows.length && !used.has(task.solution) && (!withoutHaving || withoutHaving.rows.length > result.rows.length)) break;
        result = null;
      }
      if (!result) throw new Error('Nie udało się przygotować pełnego zestawu. Spróbuj innego kodu lub większej liczby wierszy.');
      used.add(task.solution);
      task.expected = { columns: result.columns, rows: result.rows, strictOrder: task.strictOrder };
      task.prompt += ` Kolumny wyniku (w tej kolejności): ${result.columns.join(', ')}.${task.strictOrder ? '' : ' Kolejność wierszy nie jest oceniana.'}`;
      if (task.subsetSql) task.subsetRows = executeSqliteQuery(db, task.subsetSql).rows;
      return task;
    });
    // Reproducible shuffle, with IDs/titles renumbered in the displayed order.
    for (let i = tasks.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
    }
    tasks.forEach((task, index) => { task.id = `training-${index + 1}`; task.title = `Zadanie ${index + 1}`; });
    return { version: 1, options, dataset, tasks };
  } finally { destroy(); }
}

export function runTrainingQuery(db, sql) {
  const blocked = { ok: false, message: 'W treningu wykonaj jedno zapytanie SELECT. Dane i schemat pozostają niezmienne.', errorType: 'training' };
  if (classifyStatement(sql) !== 'SELECT') return blocked;
  try {
    // SQLite's parser handles semicolons inside strings/comments correctly.
    const iterator = db.iterateStatements(sql);
    let count = 0;
    try { for (const statement of iterator) { count += 1; statement.free(); } }
    finally { iterator.getRemainingSQL(); }
    if (count !== 1) return blocked;
    return executeSqliteQuery(db, sql);
  } catch (error) { return { ok: false, errorType: 'SQL', message: error.message }; }
}

export function validateTrainingResult(actual, task) {
  if (task.subsetRows && actual?.ok && JSON.stringify(actual.columns) === JSON.stringify(task.expected.columns)) {
    const available = new Map();
    for (const row of task.subsetRows) { const key = JSON.stringify(row); available.set(key, (available.get(key) ?? 0) + 1); }
    const valid = actual.rows.length === task.expected.rows.length && actual.rows.every((row) => {
      const key = JSON.stringify(row), remaining = available.get(key) ?? 0;
      available.set(key, remaining - 1);
      return remaining > 0;
    });
    return { passed: valid, message: valid ? 'Zadanie zaliczone.' : 'Sprawdź liczbę wierszy i to, czy pochodzą z wymaganej tabeli.' };
  }
  const validation = validateQueryResult(actual, task.expected);
  return { ...validation, details: validation.passed ? validation.details : 'Porównaj wynik z treścią zadania: nazwy i kolejność kolumn, warunki oraz wymaganą liczbę wierszy.' };
}

import { createSqliteDatabase, executeSqliteQuery, getSqliteSchema } from './sqliteEngine.js';

export const EXAM_SETS = [{
  id: 'inf03-2024-06-03',
  title: 'INF.03-03-24.06-SG · Stany rzek',
  sourceUrl: 'https://egzamin-informatyk.pl/arkusz-praktyczny-inf03-2024-06-03/',
  description: 'Cztery kwerendy na podstawie arkusza z czerwca 2024. Własne dane ćwiczeniowe i schemat dostosowany do SQLite; nie jest to oryginalny import egzaminacyjny.',
  tasks: [
    { id: 'rzeki-1', title: 'Kwerenda 1 · Wodowskazy', lessonOrder: 1, lessonTitle: 'SELECT', prompt: 'Z wodowskazy pobierz nazwa, rzeka oraz stanAlarmowy.', hint: 'Wymień trzy kolumny po SELECT i wskaż tabelę przez FROM.', solution: 'SELECT nazwa, rzeka, stanAlarmowy FROM wodowskazy;' },
    { id: 'rzeki-2', title: 'Kwerenda 2 · Pomiary z wybranego dnia', lessonOrder: 9, lessonTitle: 'INNER JOIN i WHERE', prompt: 'Połącz wodowskazy z pomiary przez wodowskazy.id i pomiary.wodowskazy_id. Dla dnia 2022-05-05 zwróć nazwa, rzeka, stanOstrzegawczy, stanAlarmowy i stanWody. Datę przechowuje dataPomiaru.', hint: 'Użyj INNER JOIN z warunkiem ON, a dzień wybierz w WHERE.', solution: "SELECT nazwa, rzeka, stanOstrzegawczy, stanAlarmowy, stanWody FROM wodowskazy JOIN pomiary ON wodowskazy.id = pomiary.wodowskazy_id WHERE dataPomiaru = '2022-05-05';" },
    { id: 'rzeki-3', title: 'Kwerenda 3 · Przekroczony stan ostrzegawczy', lessonOrder: 9, lessonTitle: 'JOIN i porównanie kolumn', prompt: 'Dla pomiarów z 2022-05-05 pokaż tylko przekroczenia stanu ostrzegawczego. Połącz te same tabele i zwróć nazwa, rzeka, stanOstrzegawczy, stanAlarmowy, stanWody. Przekroczenie oznacza stanWody > stanOstrzegawczy.', hint: 'Połącz warunek daty i porównanie obu kolumn operatorem AND.', solution: "SELECT nazwa, rzeka, stanOstrzegawczy, stanAlarmowy, stanWody FROM wodowskazy JOIN pomiary ON wodowskazy.id = pomiary.wodowskazy_id WHERE dataPomiaru = '2022-05-05' AND stanWody > stanOstrzegawczy;" },
    { id: 'rzeki-4', title: 'Kwerenda 4 · Średnia dla każdego dnia', lessonOrder: 6, lessonTitle: 'AVG i GROUP BY', prompt: 'W pomiary oblicz średni stanWody osobno dla każdej dataPomiaru. Zwróć dataPomiaru oraz średnią pod aliasem sredniStan.', hint: 'Połącz AVG(stanWody) AS sredniStan z GROUP BY dataPomiaru.', solution: 'SELECT dataPomiaru, AVG(stanWody) AS sredniStan FROM pomiary GROUP BY dataPomiaru;' },
  ],
}];

export async function createExamTraining({ examId = EXAM_SETS[0].id, taskId = 'all', hints = false } = {}, initializer, locateFile) {
  const exam = EXAM_SETS.find((entry) => entry.id === examId);
  if (!exam) throw new Error('Nie znaleziono arkusza.');
  const selected = exam.tasks.filter((task) => taskId === 'all' || task.id === taskId);
  if (!selected.length) throw new Error('Nie znaleziono kwerendy.');
  const dataset = {
    id: `exam-${exam.id}`, name: 'Stany rzek · dane ćwiczeniowe', tables: [],
    relationships: [{ from: 'pomiary.wodowskazy_id', to: 'wodowskazy.id' }],
    seedSql: `CREATE TABLE wodowskazy (id INTEGER PRIMARY KEY, nazwa TEXT NOT NULL, rzeka TEXT NOT NULL, stanOstrzegawczy INTEGER NOT NULL, stanAlarmowy INTEGER NOT NULL);
CREATE TABLE pomiary (id INTEGER PRIMARY KEY, wodowskazy_id INTEGER NOT NULL REFERENCES wodowskazy(id), dataPomiaru TEXT NOT NULL, stanWody INTEGER NOT NULL);
INSERT INTO wodowskazy VALUES (1,'Wrocław','Odra',300,450),(2,'Kłodzko','Nysa Kłodzka',180,240),(3,'Bolesławiec','Bóbr',200,300),(4,'Oława','Odra',320,460);
INSERT INTO pomiary VALUES (1,1,'2022-05-05',350),(2,2,'2022-05-05',180),(3,3,'2022-05-05',160),(4,4,'2022-05-05',480),(5,1,'2022-05-04',280),(6,2,'2022-05-04',170),(7,3,'2022-05-04',210),(8,4,'2022-05-04',300);`,
  };
  const { db, destroy } = await createSqliteDatabase(dataset, initializer, locateFile);
  try {
    dataset.tables = getSqliteSchema(db);
    const tasks = selected.map((task) => {
      const result = executeSqliteQuery(db, task.solution);
      if (!result.ok) throw new Error('Nie udało się przygotować zadania egzaminacyjnego.');
      return { ...task, prompt: `${task.prompt} Zachowaj podaną kolejność kolumn. Kolejność wierszy nie jest oceniana.`, expected: { columns: result.columns, rows: result.rows, strictOrder: false } };
    });
    return { version: 1, source: { title: exam.title, url: exam.sourceUrl, description: exam.description }, options: { mode: 'exam', examId, taskId, seed: `${examId}-${taskId}`, hints, start: 1, end: 9, difficulty: 'exam' }, dataset, tasks };
  } finally { destroy(); }
}

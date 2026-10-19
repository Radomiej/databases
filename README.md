# SQL Learning Lab

Lokalne laboratorium SQL dla przygotowania do INF.03. Aplikacja ma dwa tryby:

- **SQLite — nauka** — działa bez MySQL, tworzy bazę w przeglądarce i pozwala wykonywać oceniane lekcje.
- **MySQL — connector** — React wysyła zapytania do lokalnego API Node/Express, które łączy się z serwerem MySQL przez `mysql2`.

Kurs obejmuje także dataset **Laboratorium struktury** z pustą bazą SQLite. Cztery kolejne lekcje ćwiczą `CREATE TABLE`, konfigurację kolumn i ograniczeń, `ALTER TABLE` oraz klucze obce. Zadania DDL są oceniane na podstawie rzeczywistego schematu, a nie tylko tekstu zapytania.

W panelu **Schemat bazy** kliknij przycisk `⋮` przy tabeli i wybierz **Podgląd danych**, aby otworzyć pierwsze 50 rekordów z aktualnej bazy. W zakładce **Relacje** możesz w trybie SQLite dodawać, zmieniać i usuwać rzeczywiste klucze obce. Zmiany są zapisywane w projekcie przeglądarki; **Resetuj relacje** przywraca relacje startowe bieżącego datasetu, ale nie usuwa własnych tabel.

phpMyAdmin nie jest endpointem aplikacji. Możesz używać go do importu skryptu i sprawdzania danych, ale connector łączy się bezpośrednio z serwerem MySQL.

## Pomoc, szkice i ustawienia lokalne

Przycisk **Pomoc** w menu bocznym opisuje kolejność pracy: wybór trybu i bazy, zadanie pokazowe, zadania samodzielne oraz uruchamianie i sprawdzanie zapytań. Wybrane lekcje HAVING i JOIN mają rozwijane przykłady krok po kroku z rzeczywistymi wynikami. „Rozwiązanie” jest dostępne tylko przy zadaniu pokazowym; samodzielne można nadal ocenić przez „Sprawdź”. Szkic SQL jest zapisywany osobno dla każdej lekcji i każdego zadania, również po odświeżeniu strony.

Historia zapisuje pełny tekst uruchomionego lub sprawdzonego zapytania wraz z bazą, trybem, lekcją, zadaniem, wynikiem oraz czasem względnym i dokładnym. Jest przechowywana w IndexedDB; starsze wpisy z localStorage są migrowane przy pierwszym otwarciu.

W **Ustawieniach** możesz zresetować aktywny zestaw SQLite do danych startowych (bez kasowania postępu, szkiców i historii) albo przywrócić ustawienia fabryczne aplikacji. Reset fabryczny usuwa lokalny postęp, szkice, historię, własne tabele i zapisane ustawienia połączenia. Żaden reset w aplikacji nie wykonuje poleceń ani nie modyfikuje danych MySQL.

## Wymagania

- Node.js 18 lub nowszy,
- npm,
- MySQL/MariaDB tylko wtedy, gdy chcesz używać trybu MySQL,
- XAMPP jest opcjonalny; wystarczy działający moduł MySQL.

## Uruchomienie

W katalogu projektu:

```powershell
npm install
npm run dev
```

Otwórz `http://localhost:5173`. Tryb SQLite działa od razu.

Jeżeli chcesz używać connectora MySQL, w drugim terminalu uruchom:

```powershell
npm run server
```

Możesz też uruchomić oba procesy jednym poleceniem:

```powershell
npm run dev:all
```

Backend działa wyłącznie lokalnie na `http://localhost:3001`.

## Korepetytor AI

Pływający przycisk z ikoną robota otwiera panel rozmowy. Wybierz Claude Haiku albo OpenAI i wpisz własny klucz API. Klucz przechowujemy tylko w stanie aplikacji w pamięci karty: nie trafia do `localStorage` ani `sessionStorage`, a odświeżenie strony go usuwa. Przełączenie dostawcy lub przycisk czyszczenia również usuwa klucz i rozmowę. Dla OpenAI-compatible możesz opcjonalnie podać własny HTTPS base URL (np. `https://openrouter.ai/api/v1`) lub pełny adres `/chat/completions` oraz identyfikator modelu (np. `anthropic/claude-haiku-4.5`). Klucz jest przesyłany do wybranego adresu. Backend odrzuca HTTP, adresy lokalne/prywatne i domeny DNS wskazujące na prywatne adresy.

Możesz też wybrać **OpenRouter Free**. Ta opcja nie prosi o klucz w przeglądarce: backend korzysta z sekretu `OPENROUTER_API_KEY` z `server/.env` lokalnie albo ze zmiennych środowiskowych projektu Vercel. Panel pobiera katalog modeli, filtruje tylko te z zerową ceną wszystkich składników oraz tokenów wejściowych i wyjściowych, a backend powtarza kontrolę przed każdym zapytaniem. Gdy wybrany model przestanie być darmowy lub zniknie z katalogu, żądanie zostanie odrzucone. Darmowe modele mogą mieć limity i zmieniać dostępność. W przypadku modeli Stealth ich operator może przechowywać przesłane prompty i odpowiedzi.

Backend Express udostępnia `POST /api/ai/chat` oraz `GET /api/ai/free-models`; przy wdrożeniu Vercel obsługują je `api/ai/chat.js` i `api/ai/free-models.js`. Oficjalne OpenAI używa Responses API, a własny adres OpenAI-compatible i OpenRouter używają Chat Completions. Backend przekazuje klucz w uwierzytelniającym nagłówku do wybranego dostawcy i nie zapisuje go. Model otrzymuje wyłącznie bieżący temat lekcji, treść zadania i podpowiedź oraz schemat tabel (nazwy, kolumny, typy i klucze). Nie wysyłamy rekordów, wyników zapytań, kluczy odpowiedzi ani danych połączenia MySQL. Wiadomości, zadanie i schemat są wysyłane do wybranego dostawcy AI; korzystanie może podlegać jego opłatom i zasadom prywatności.

Opcjonalnie możesz wskazać modele przez `CLAUDE_HAIKU_MODEL` oraz `OPENAI_TUTOR_MODEL` w środowisku backendu. Domyślnie używane są Claude Haiku 4.5 i GPT-5 mini. Aby lokalnie korzystać z czatu, uruchom frontend i Express (`npm run dev:all`); klucz wpisuje się dopiero w panelu aplikacji.

## Produkcja i Vercel

`npm run build` tworzy statyczną aplikację React w `dist/`. W `vercel.json` ustawiono jawnie build Vite, katalog wyjściowy oraz funkcję czatu z limitem do 60 sekund. React renderuje aplikację przez pojedyncze `createRoot`; wyłączono developerski `StrictMode`, który celowo powtarza część efektów w trybie developerskim. Vite HMR/WebSocket działa wyłącznie na lokalnym serwerze developerskim; produkcyjny build i Vercel go nie uruchamiają.

Po poprawnym połączeniu tryb MySQL pobiera również relacje z `information_schema.KEY_COLUMN_USAGE`. Relacje MySQL są prezentowane jako **Tylko odczyt** — aplikacja nie wykonuje zmian FK w zewnętrznej bazie.

## Konfiguracja MySQL

Skopiuj `server/.env.example` do `server/.env` i ustaw domyślne wartości:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=inf03_lab
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_ALLOW_MUTATIONS=false
MYSQL_ALLOW_SCHEMA_MUTATIONS=false
PORT=3001
```

Możesz również wpisać dane bezpośrednio w formularzu connectora. Hasło pozostaje w pamięci aplikacji i nie jest zapisywane. Zaznaczenie „Zapamiętaj pozostałe pola” zapisuje tylko host, port, nazwę bazy i użytkownika.

Domyślnie connector pozwala na `SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN` i odczyt przez `WITH`. Operacje `INSERT`, `UPDATE` i `DELETE` wymagają `MYSQL_ALLOW_MUTATIONS=true` oraz opcji **Zezwól na zapis danych**. Operacje `CREATE TABLE` i `ALTER TABLE` wymagają osobno `MYSQL_ALLOW_SCHEMA_MUTATIONS=true` oraz opcji **Zezwól na zmiany struktury**. Connector nie udostępnia w kursie poleceń administracyjnych kontami, takich jak `CREATE USER`, `GRANT` czy `REVOKE`.

## Przygotowanie przykładowej bazy MySQL

1. Uruchom MySQL w XAMPP lub innym lokalnym serwerze.
2. Otwórz phpMyAdmin albo klienta MySQL.
3. Zaimportuj plik `docs/sql/mysql-setup.sql`.
4. W aplikacji wybierz `MySQL — connector`.
5. Ustaw bazę `inf03_lab`, kliknij `Sprawdź połączenie`, a następnie wykonaj `SHOW TABLES;`.

## Trening SQL — generator zadań

W kreatorze „Trening SQL” wybierz „Zadania generowane” albo „Zadania egzaminacyjne”. Tryb egzaminacyjny zawiera cztery kwerendy SELECT na podstawie arkusza INF.03-03-24.06-SG (Stany rzek). Można ćwiczyć wszystkie kwerendy albo jedną wybraną. Źródło arkusza jest podlinkowane w kreatorze i sandboxie. Baza zawiera własne dane ćwiczeniowe, dostosowane do SQLite, a nie oryginalny import z egzaminu. Uczeń pisze zapytania od zera; sprawdzany jest wynik na tej bazie. Zakres obejmuje SELECT, WHERE, JOIN i AVG z GROUP BY. Postęp i szkice zachowują się po odświeżeniu karty, tak jak w treningu generowanym.

Przycisk **Trening SQL** u góry aplikacji otwiera kreator samodzielnego treningu. Wybierz jedną lekcję lub zakres lekcji 1–8, poziom trudności, 5 albo 10 zadań, temat bazy (sklep, klub sportowy, wypożyczalnia), 12/24/48 wierszy w tabeli i dostępność podpowiedzi. Dla zakresu dłuższego niż pięć lekcji wymagane jest 10 zadań, aby każda wybrana lekcja miała swoje ćwiczenie.

Generator tworzy oddzielną bazę SQLite z dwiema tabelami i losowymi danymi. Nie zmienia baz kursu, własnych tabel ani MySQL. Temat zmienia nazwy tabel i dane, a zakres ogranicza składnię zadań do bieżącego oraz wcześniejszego materiału. JOIN i zadania DDL nie są jeszcze objęte generatorem.

Uczeń zaczyna z pustym edytorem, korzysta z checklisty i podglądu danych przez menu `⋮`, a przycisk **Sprawdź** porównuje wynik z odpowiedzią referencyjną. Nie ma przycisku pokazującego rozwiązanie. Nazwy kolumn i wymagane aliasy są jawne w treści zadania. Przy `LIMIT` bez sortowania oceniany jest dowolny prawidłowy podzbiór wymaganej wielkości; zadania z sortowaniem wymagają wskazanej kolejności. Zapytania są ograniczone do jednego `SELECT`, a baza treningowa jest tylko do odczytu.

Opcjonalny **kod zestawu** wraz z identycznymi parametrami odtwarza ten sam zestaw dla całej klasy. Pusty kod oznacza nowe losowanie. Aktywny zestaw, szkice i zaliczenia są przechowywane w `sessionStorage` tej karty i pozostają po odświeżeniu (nie są kontem ucznia ani trwałym dziennikiem ocen). **Nowy zestaw** otwiera ponownie kreator; anulowanie nie usuwa aktualnego treningu. **Wróć do kursu** kończy widok treningu, zachowując bazę i zapytanie kursu w pamięci aplikacji.

## Testy i build

```powershell
npm test
npm run build
```

Testy obejmują silnik SQLite, wszystkie rozwiązania lekcji, walidator wyników, kreator tabel, politykę connectora, klienta API oraz generator treningu (powtarzalność, progresję materiału, różnorodność, faktyczne filtrowanie HAVING, ocenę LIMIT i ochronę danych).

## Zawartość

- `src/data/datasets.js` — cztery seedowane bazy oraz pusty dataset Laboratorium struktury.
- `src/data/lessons.js` — 15 lekcji od SELECT do projektu INF.03 oraz 4 lekcje DDL.
- `src/services/sqliteEngine.js` — wykonywanie zapytań SQLite w przeglądarce.
- `src/services/mysqlApi.js` — klient lokalnego API MySQL.
- `server/` — Express + mysql2, bez PHP.
- `docs/lesson-plan.md` — plan nauki i checklista egzaminacyjna.
- `docs/sql/mysql-setup.sql` — skrypt przygotowania przykładowej bazy MySQL.

## Bezpieczeństwo

To narzędzie jest przeznaczone do lokalnej nauki. Nie wystawiaj `server/index.js` do internetu, nie używaj konta z uprawnieniami administracyjnymi na ważnej bazie i sprawdź aktywną bazę przed włączeniem mutacji.


## Analityka Umami

### Witryna: Database Lab

Dashboard: https://mws03-52051.wykr.es/websites/7bc5731c-db35-4f0b-a163-2caa4a43cb39
Website ID: `7bc5731c-db35-4f0b-a163-2caa4a43cb39`. Public configuration lives in `src/services/labAnalytics.js`.
Only the exact production hostname is tracked; localhost and preview deployments are excluded.
Set `VITE_ANALYTICS_ENABLED=false` to disable tracking. Browser Do Not Track is respected.

## Events
- `lesson_open`, `task_open`: stable curriculum IDs, topic and current task.
- `topic_change`: topic selection.
- `task_run_started`, `task_run_result`: execution and coarse outcome.
- `technical_error`: uncaught error / unhandled rejection class only, capped at 10 per page.
- `resource_download`: PDF, archive or project export category; no file contents or user filenames.
- `lesson_search`: search usage and length bucket if a search field exists; no search text.
- `task_check_result`, `mode_change`; `training_task_open`, `training_run_started`, `training_run_result`, `training_check_result` for the training sandbox.

## Privacy and rollout
No student code, SQL, prompts, query results, connection details, names, installation IDs, raw errors or stacks are sent to Umami. No session recordings. Analytics failure never blocks learning.
Java's existing optional teacher session telemetry is a separate feature, unchanged by this integration; its snapshots are not forwarded to Umami.
No extra npm dependencies or private API keys. Deploy this local change to activate collection. Website creation is complete, but production reception has not been verified before deployment.
No tests were added or run for this change. Visual behavior is unchanged; no visual QA was run.


### Client version and event review (2026-10-19)

All custom events include `client_version` (`package.json` version + deployment commit). `client_loaded` is sent once per page load, alongside the tracker's single automatic pageview. Existing production domain, website ID, `VITE_ANALYTICS_ENABLED=false`, and Do Not Track remain in effect. Java also respects `analytics.enabled` before loading the tracker.

Lesson/task context includes stable IDs and lesson number. Web reports one result per actual preview/check run, rather than a new result for each subsequent iframe signal. SQL run events use `execution_ok`; `task_check_result.passed` records curriculum validation, not merely valid SQL. Java `task_focus_session.duration_seconds` is total visible task time, including full minutes; it overlaps the separate minute events and must not be summed with them.

Only controlled metadata is forwarded: no code, SQL, output, student names, installation IDs, credentials or raw error text. Versioned lesson/task hash links can be copied with the lesson button; saved drafts stay local. Pageview URLs exclude query and hash. Automated checks cover version propagation, metadata filtering, deduplication, production-domain/DNT guards, task navigation and offline telemetry.


### Window focus telemetry
Teacher session snapshots include optional `focused` status. Window focus/blur and document visibility changes send a heartbeat immediately; older clients remain compatible. Presence is independent of the 45-second connection timeout. Focus is sent only to the existing teacher backend, not Umami.

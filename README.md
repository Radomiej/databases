# SQL Learning Lab

Lokalne laboratorium SQL dla przygotowania do INF.03. Aplikacja ma dwa tryby:

- **SQLite — nauka** — działa bez MySQL, tworzy bazę w przeglądarce i pozwala wykonywać oceniane lekcje.
- **MySQL — connector** — React wysyła zapytania do lokalnego API Node/Express, które łączy się z serwerem MySQL przez `mysql2`.

W panelu **Schemat bazy** kliknij przycisk `⋮` przy tabeli i wybierz **Podgląd danych**, aby otworzyć pierwsze 50 rekordów z aktualnej bazy. W zakładce **Relacje** możesz w trybie SQLite dodawać, zmieniać i usuwać rzeczywiste klucze obce. Zmiany są zapisywane w projekcie przeglądarki; **Resetuj relacje** przywraca relacje startowe bieżącego datasetu, ale nie usuwa własnych tabel.

phpMyAdmin nie jest endpointem aplikacji. Możesz używać go do importu skryptu i sprawdzania danych, ale connector łączy się bezpośrednio z serwerem MySQL.

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

Po poprawnym połączeniu tryb MySQL pobiera również relacje z `information_schema.KEY_COLUMN_USAGE`. Relacje MySQL są prezentowane jako **Tylko odczyt** — aplikacja nie wykonuje zmian DDL relacji w zewnętrznej bazie.

## Konfiguracja MySQL

Skopiuj `server/.env.example` do `server/.env` i ustaw domyślne wartości:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=inf03_lab
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_ALLOW_MUTATIONS=false
PORT=3001
```

Możesz również wpisać dane bezpośrednio w formularzu connectora. Hasło pozostaje w pamięci aplikacji i nie jest zapisywane. Zaznaczenie „Zapamiętaj pozostałe pola” zapisuje tylko host, port, nazwę bazy i użytkownika.

Domyślnie connector pozwala na `SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN` i odczyt przez `WITH`. Operacje `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER` i `DROP` są blokowane. Włączenie zapisu wymaga ustawienia `MYSQL_ALLOW_MUTATIONS=true` w `server/.env` oraz jawnego włączenia opcji w UI; używaj tego tylko na lokalnej bazie ćwiczeniowej.

## Przygotowanie przykładowej bazy MySQL

1. Uruchom MySQL w XAMPP lub innym lokalnym serwerze.
2. Otwórz phpMyAdmin albo klienta MySQL.
3. Zaimportuj plik `docs/sql/mysql-setup.sql`.
4. W aplikacji wybierz `MySQL — connector`.
5. Ustaw bazę `inf03_lab`, kliknij `Sprawdź połączenie`, a następnie wykonaj `SHOW TABLES;`.

## Testy i build

```powershell
npm test
npm run build
```

Testy obejmują silnik SQLite, wszystkie rozwiązania lekcji, walidator wyników, kreator tabel, politykę connectora i klienta API.

## Zawartość

- `src/data/datasets.js` — cztery seedowane bazy: biblioteka, sklep, szkoła, kino.
- `src/data/lessons.js` — 12 lekcji od SELECT do projektu INF.03.
- `src/services/sqliteEngine.js` — wykonywanie zapytań SQLite w przeglądarce.
- `src/services/mysqlApi.js` — klient lokalnego API MySQL.
- `server/` — Express + mysql2, bez PHP.
- `docs/lesson-plan.md` — plan nauki i checklista egzaminacyjna.
- `docs/sql/mysql-setup.sql` — skrypt przygotowania przykładowej bazy MySQL.

## Bezpieczeństwo

To narzędzie jest przeznaczone do lokalnej nauki. Nie wystawiaj `server/index.js` do internetu, nie używaj konta z uprawnieniami administracyjnymi na ważnej bazie i sprawdź aktywną bazę przed włączeniem mutacji.

# SQL Learning Lab — specyfikacja projektu

Data: 2026-09-16  
Katalog projektu: `C:\Nauka\databases`  
Status: zatwierdzony kierunek, przed implementacją

## 1. Cel

SQL Learning Lab to lokalna aplikacja edukacyjna dla osoby przygotowującej się do INF.03. Ma prowadzić od prostego `SELECT` do zapytań obejmujących agregacje, `GROUP BY`, `HAVING`, `INNER JOIN`, `LEFT JOIN`, podzapytania i raporty oparte na kilku tabelach.

Najważniejszy przepływ użytkownika:

1. Użytkownik wybiera tryb SQLite albo MySQL.
2. Wybiera bazę danych i lekcję.
3. Czyta krótkie wyjaśnienie, przykład i wymagania zadania.
4. Edytuje zapytanie.
5. Uruchamia je przyciskiem `Uruchom`.
6. Ogląda wynik tabelaryczny, komunikat błędu, wskazówkę albo informację o zaliczeniu.
7. Może podejrzeć schemat, zresetować dane, zobaczyć rozwiązanie i przejść dalej.

## 2. Zakres pierwszej wersji

### W zakresie

- React + Vite + czysty JavaScript.
- Bootstrap 5 i Bootstrap Icons; własne style ograniczone do tokenów, layoutu i stanów aplikacji.
- Tryb SQLite działający lokalnie w przeglądarce przez `sql.js`.
- Tryb MySQL obsługiwany przez lokalny backend Node/Express i bibliotekę `mysql2/promise`.
- Cztery gotowe bazy danych z polskimi nazwami i przykładowymi rekordami.
- Kreator własnych tabel dla trybu SQLite.
- Edytor SQL z uruchamianiem zapytań, resetem, rozwiązaniem, podpowiedzią i historią.
- Wyniki zapytań, liczba rekordów, czas wykonania, błędy i komunikaty dydaktyczne.
- Dwanaście lekcji uporządkowanych rosnąco pod INF.03.
- Responsywny interfejs desktop/tablet/mobile.
- Dokumentacja uruchomienia lokalnego i konfiguracji MySQL przez `.env`.

### Poza zakresem pierwszej wersji

- Integracja z panelem phpMyAdmin jako stroną lub API. phpMyAdmin pozostaje narzędziem do zarządzania serwerem; aplikacja łączy się bezpośrednio z MySQL przez backend.
- Logowanie użytkowników, chmura, współdzielenie wyników i synchronizacja postępu między urządzeniami.
- Zdalne serwery MySQL dostępne z internetu jako domyślna funkcja.
- Zaawansowany edytor typu Monaco/CodeMirror. Pierwsza wersja używa lekkiego edytora `textarea` z krojem monospace.
- Pełny silnik parsera MySQL w przeglądarce. SQLite jest zgodny z MySQL dla używanego podzbioru zapytań, a różnice są opisane w lekcjach.

## 3. Podejścia i wybór

### Podejście A — rekomendowane: React + Node/Express + sql.js + mysql2

SQLite działa bezpośrednio w przeglądarce i nie wymaga konfiguracji. Backend Node uruchamia wyłącznie connector MySQL. Frontend ma jeden model wyniku, a adapter wybiera wykonawcę zależnie od trybu.

Zalety: szybki start, brak serwera dla podstawowej nauki, prawdziwe połączenie z MySQL, łatwe rozdzielenie odpowiedzialności i dobre działanie offline w trybie SQLite.

Koszt: trzeba uruchomić dwa procesy developerskie podczas pracy z MySQL.

### Podejście B — React + jeden backend Node dla SQLite i MySQL

Oba silniki działałyby w Node, a frontend zawsze komunikowałby się z API. Upraszcza to część frontendu, ale odbiera trybowi SQLite działanie bezserwerowe i wymaga backendu nawet do pierwszych ćwiczeń.

### Podejście C — bezpośrednie łączenie przeglądarki z MySQL

Odrzucone. Sterownik MySQL nie powinien być wystawiany do przeglądarki, ponieważ wymagałoby to ujawnienia danych dostępowych i otwarcia serwera na połączenia z klienta.

Wybrano podejście A.

## 4. Architektura

```text
React/Vite
  ├─ UI Bootstrap, stan aplikacji, lekcje, walidacja lokalna
  ├─ SQLite adapter (sql.js + sql-wasm.wasm)
  └─ MySQL API client (/api/mysql/*)

Node/Express
  ├─ /api/health
  ├─ /api/mysql/test-connection
  ├─ /api/mysql/query
  ├─ /api/mysql/tables
  └─ /api/mysql/describe

MySQL
  └─ serwer wskazany w formularzu connectora albo przez domyślne zmienne .env
```

Proponowany układ plików:

```text
databases/
  package.json
  vite.config.js
  index.html
  src/
    main.jsx
    App.jsx
    styles/app.css
    data/lessons.js
    data/datasets.js
    components/
      AppShell.jsx
      Sidebar.jsx
      LessonPanel.jsx
      SqlEditor.jsx
      ResultsPanel.jsx
      SchemaPanel.jsx
      ConnectionPanel.jsx
      TableBuilderModal.jsx
    hooks/
      useSqliteDatabase.js
      useLocalStorage.js
    services/
      sqliteEngine.js
      mysqlApi.js
      queryValidation.js
  server/
    index.js
    mysqlClient.js
    queryPolicy.js
    .env.example
  public/
    sql-wasm.wasm
  docs/
    README.md
    lesson-plan.md
    sql/mysql-setup.sql
    superpowers/specs/2026-09-16-sql-learning-lab-design.md
```

`App.jsx` pozostaje kompozycją widoku. Dane lekcji, dane baz, silniki zapytań i komponenty UI są rozdzielone, żeby późniejsze dodawanie lekcji nie wymagało przebudowy aplikacji.

## 5. Tryb SQLite

`sql.js` tworzy bazę w pamięci z dostarczonego skryptu inicjalizującego. Każdy dataset ma:

- definicję tabel,
- klucze główne i obce,
- dane startowe,
- opis relacji,
- przykładowe zapytania i zadania.

Przy zmianie datasetu silnik jest zamykany i odtwarzany z czystego skryptu. Przycisk `Resetuj bazę` wykonuje tę samą operację dla aktualnego datasetu.

Kreator tabel:

- pozwala podać nazwę tabeli,
- pozwala dodawać i usuwać kolumny,
- obsługuje typy `INTEGER`, `TEXT`, `REAL`, `DATE`,
- pozwala oznaczyć jedną kolumnę jako `PRIMARY KEY` i zaznaczyć `NOT NULL`,
- generuje i wykonuje `CREATE TABLE`,
- pokazuje wygenerowany SQL,
- odświeża panel schematu.

Własne rekordy można dodać później przez zapytanie `INSERT`, co jest celowym ćwiczeniem SQL. Definicja własnych tabel jest przechowywana w `localStorage`, a baza jest odtwarzana po odświeżeniu strony.

## 6. Connector MySQL

Frontend przekazuje do backendu połączenie i zapytanie. Backend tworzy krótkotrwałe połączenie lub bezpieczny pool dla danej konfiguracji, wykonuje zapytanie i zwraca ujednolicony wynik. Dane hasła nie są zapisywane do pliku ani logowane.

Formularz connectora:

- host, domyślnie `127.0.0.1`,
- port, domyślnie `3306`,
- nazwa bazy,
- użytkownik,
- hasło,
- przycisk `Sprawdź połączenie`,
- przełącznik `Zapamiętaj pozostałe pola` bez zapamiętywania hasła.

Domyślne wartości mogą pochodzić z `server/.env`:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=inf03_lab
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_ALLOW_MUTATIONS=false
```

API:

```text
GET  /api/health
POST /api/mysql/test-connection
POST /api/mysql/query
POST /api/mysql/tables
POST /api/mysql/describe
```

Wspólny format wyniku:

```json
{
  "ok": true,
  "columns": ["name", "count"],
  "rows": [["Warszawa", 3]],
  "rowCount": 1,
  "durationMs": 4,
  "statementType": "SELECT"
}
```

Błąd zwraca `ok: false`, typ błędu, bezpieczny komunikat i numer błędu MySQL bez ujawniania konfiguracji serwera.

Domyślnie backend akceptuje zapytania odczytujące (`SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN`, `WITH`). Operacje modyfikujące są odrzucane, chyba że `MYSQL_ALLOW_MUTATIONS=true` i użytkownik jawnie włączy tryb zapisu w interfejsie. To zabezpiecza przypadkową naukę na niewłaściwej bazie.

## 7. Gotowe bazy danych

### `biblioteka` — poziom podstawowy, 3 tabele

- `autorzy(id, imie, nazwisko, kraj)`
- `ksiazki(id, tytul, rok_wydania, autor_id, cena)`
- `wypozyczenia(id, ksiazka_id, czytelnik, data_wypozyczenia, data_zwrotu)`

Ćwiczenia: filtrowanie książek, zakresy lat/cen, `LIKE`, `IS NULL`, proste liczniki i pierwszy `JOIN`.

### `sklep` — poziom średni, 4 tabele

- `klienci(id, imie, nazwisko, miasto)`
- `produkty(id, nazwa, kategoria, cena, stan_magazynowy)`
- `zamowienia(id, klient_id, data_zamowienia, status)`
- `pozycje_zamowien(id, zamowienie_id, produkt_id, ilosc, cena_sztukowa)`

Ćwiczenia: wartość zamówienia, `SUM`, `COUNT`, `GROUP BY`, `HAVING`, `INNER JOIN` i `LEFT JOIN`.

### `szkola` — poziom rozszerzony, 5 tabel

- `uczniowie(id, imie, nazwisko, klasa_id)`
- `klasy(id, symbol, profil, rocznik)`
- `przedmioty(id, nazwa)`
- `nauczyciele(id, imie, nazwisko)`
- `oceny(id, uczen_id, przedmiot_id, nauczyciel_id, ocena, data_wystawienia)`

Ćwiczenia: średnie ocen, grupowanie po klasie i przedmiocie, wielokrotne połączenia oraz podzapytania.

### `kino` — poziom projektowy, 6 tabel

- `filmy(id, tytul, rok, czas_min, gatunek_id)`
- `gatunki(id, nazwa)`
- `sale(id, numer, miejsca)`
- `seanse(id, film_id, sala_id, rozpoczecie, cena)`
- `klienci(id, imie, nazwisko, email)`
- `bilety(id, seans_id, klient_id, miejsce, status)`

Ćwiczenia: raport sprzedaży, obłożenie sal, `LEFT JOIN` dla filmów bez seansów, agregacje po gatunku i zadanie końcowe z 4–6 tabelami.

## 8. Plan dwunastu lekcji

Każda lekcja ma: cel, teorię w 3–6 zdaniach, składnię, przykład, zadanie główne, podpowiedź, rozwiązanie i kryterium sprawdzenia.

| Nr | Temat | Dataset | Efekt praktyczny |
|---:|---|---|---|
| 1 | `SELECT`, kolumny i `LIMIT` | biblioteka | wybierać potrzebne dane i ograniczać wynik |
| 2 | `WHERE`, operatory porównań i `AND/OR` | biblioteka | filtrować rekordy według warunków |
| 3 | `ORDER BY`, `ASC/DESC` | biblioteka | sortować wynik i łączyć sortowanie z limitem |
| 4 | `LIKE`, `IN`, `BETWEEN`, `IS NULL` | biblioteka | wyszukiwać tekst i obsługiwać brak wartości |
| 5 | `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` | sklep | obliczać podsumowania |
| 6 | `GROUP BY` | sklep | tworzyć zestawienia według kategorii/klienta |
| 7 | `HAVING` | sklep | filtrować grupy po agregacji |
| 8 | `INNER JOIN` | sklep | łączyć dane z dwóch i trzech tabel |
| 9 | `LEFT JOIN` | kino | zachować rekordy bez dopasowania |
| 10 | Wielokrotne `JOIN` i aliasy | szkoła | pisać czytelne raporty z 4 tabel |
| 11 | Podzapytania i `WITH` | szkoła | porównywać rekordy ze średnią lub maksimum |
| 12 | Projekt INF.03 | kino | zbudować pełny raport sprzedażowo-repertuarowy |

Walidacja lekcji działa w trybie SQLite przez porównanie z oczekiwanym zestawem kolumn i rekordów. W trybie MySQL przycisk `Sprawdź` informuje, że wykonano zapytanie, ale nie ocenia wyniku względem lokalnych danych, bo użytkownik może pracować na własnej zawartości bazy.

## 9. Interfejs i system wizualny

Kierunek: narzędzie do nauki, nie panel administracyjny. Interfejs ma być spokojny, czytelny i lekko techniczny.

- Tło aplikacji: jasny, neutralny szary; główny obszar treści pozostaje biały.
- Lewy rail: ciemny granat z białą typografią i jednym turkusowym akcentem aktywnego elementu.
- Typografia: systemowa `Inter`, `Segoe UI`, sans-serif; kod w `ui-monospace`.
- Kolory semantyczne Bootstrap: primary dla akcji, success dla zaliczenia, warning dla podpowiedzi, danger dla błędu.
- Promienie: umiarkowane, około `0.75rem`; bez dekoracyjnych kart w każdym miejscu.
- Gęstość: panel lekcji i edytor mają priorytet, wyniki są czytelne na szerokość.
- Ikony: Bootstrap Icons, pojedyncze ikony przy akcjach, bez ozdobnych ikon-row.
- Motion: krótka animacja zmiany aktywnego panelu i pojawienia się wyniku; respektuje `prefers-reduced-motion`.

Główny layout desktopowy:

```text
┌──────────────┬──────────────────────────────────┬─────────────────┐
│ nawigacja    │ lekcja + edytor SQL + wynik      │ schemat/hints   │
│ tryb/baza    │                                  │ tabele/relacje  │
│ lekcje       │                                  │                 │
└──────────────┴──────────────────────────────────┴─────────────────┘
```

Na mobile lewy panel staje się offcanvas, a panel schematu przechodzi pod wyniki.

## 10. Stany i obsługa błędów

- Inicjalizacja SQLite: stan ładowania z komunikatem o przygotowaniu bazy.
- Puste zapytanie: blokada wykonania i komunikat „Wpisz zapytanie SQL”.
- Błąd składni SQLite/MySQL: komunikat techniczny plus podpowiedź typu błędu, np. brak przecinka, nieznana kolumna, brak `GROUP BY`.
- Brak wyników: poprawny stan pusty, bez traktowania go jako błędu.
- Wynik nie-tabelaryczny: komunikat z liczbą zmienionych rekordów.
- Brak backendu MySQL: banner z poleceniem uruchomienia `npm run server`.
- Brak połączenia z MySQL: komunikat bez hasła i bez pełnego connection stringa.
- Timeout: przerwanie połączenia po ustalonym limicie i instrukcja sprawdzenia hosta/portu.

## 11. Bezpieczeństwo i granice trybu lokalnego

- Connector MySQL jest przeznaczony do lokalnej nauki; serwer Express nie będzie wystawiany publicznie.
- Hasło jest przechowywane wyłącznie w stanie formularza i przekazywane przez HTTPS/localhost w środowisku użytkownika.
- Backend nie loguje pełnego zapytania ani danych uwierzytelniających.
- Mutacje są wyłączone domyślnie przez `MYSQL_ALLOW_MUTATIONS=false`.
- Aplikacja pokazuje ostrzeżenie przed włączeniem zapisu.
- Nie ma obietnicy ochrony przed innym procesem użytkownika na tej samej maszynie; to narzędzie developersko-edukacyjne, nie produkcyjny panel administracyjny.

## 12. Kryteria akceptacji

1. `npm install` i `npm run dev` uruchamiają interfejs React.
2. Tryb SQLite uruchamia się bez MySQL i pozwala wykonać zapytanie na każdym gotowym datasecie.
3. Działa wybór bazy, lekcji, reset, rozwiązanie, podpowiedź i historia zapytań.
4. Działa kreator tabeli i odświeżenie schematu.
5. Lekcje 1–12 mają polskie objaśnienia, zadania i działające przykłady.
6. `GROUP BY`, `HAVING`, `INNER JOIN` i `LEFT JOIN` są wykonywalne na danych treningowych.
7. `npm run server` uruchamia API MySQL bez PHP.
8. Formularz connectora potrafi sprawdzić połączenie i wykonać zapytanie odczytujące.
9. Niepoprawne zapytanie pokazuje zrozumiały błąd, a brak rekordów jest poprawnym wynikiem.
10. Układ nie przepełnia się na viewportach desktopowych i mobilnych.
11. README wyjaśnia uruchomienie, import opcjonalnej bazy MySQL i ograniczenia bezpieczeństwa.

## 13. Weryfikacja

Testy automatyczne i ręczne obejmą:

- inicjalizację oraz reset wszystkich datasetów,
- poprawne i błędne zapytania w SQLite,
- walidację lekcji z oczekiwanym wynikiem,
- tworzenie tabeli i odświeżanie schematu,
- connector MySQL z poprawnym i błędnym połączeniem,
- blokadę mutacji przy wyłączonej fladze,
- responsywność i klawiaturową obsługę głównego przepływu,
- build produkcyjny Vite.

Weryfikacja wizualna obejmie pełny ekran desktopowy i viewport mobilny, a także porównanie layoutu, typografii, kontrastu, stanów aktywnych, tabeli wyników i panelu edytora.

## 14. Kolejność implementacji

1. Utworzenie aplikacji Vite, zależności i wspólnych tokenów CSS.
2. Model datasetów i silnik SQLite.
3. Shell aplikacji, wybór trybu/bazy/lekcji i edytor.
4. Wyniki, błędy, reset, historia i walidacja.
5. Kreator tabel i panel schematu.
6. Treści dwunastu lekcji i cztery seedowane bazy.
7. Backend Express + connector `mysql2`.
8. Dokumentacja i testy.
9. Weryfikacja przeglądarkowa desktop/mobile oraz poprawki wizualne.

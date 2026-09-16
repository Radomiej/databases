# Plan nauki SQL pod INF.03

Pracuj w kolejności. Dla każdej lekcji najpierw przeczytaj teorię, potem przepisz przykład własnymi słowami, wykonaj zadanie bez rozwiązania, a na końcu użyj `Sprawdź`.

## 1. SELECT i LIMIT

Cel: wybierać konkretne kolumny i ograniczać wynik.  
Ćwicz: `SELECT`, `FROM`, `LIMIT`, alias kolumny przez `AS`.  
Baza: `biblioteka`.

## 2. WHERE i warunki

Cel: filtrować rekordy przed ich zwróceniem.  
Ćwicz: `=`, `<>`, `>`, `<`, `>=`, `<=`, `AND`, `OR`.  
Baza: `biblioteka`.

## 3. ORDER BY

Cel: sortować dane rosnąco i malejąco.  
Ćwicz: `ORDER BY`, `ASC`, `DESC`, połączenie z `LIMIT`.  
Baza: `biblioteka`.

## 4. LIKE, IN, BETWEEN i NULL

Cel: wyszukiwać tekst, zakresy i brakujące wartości.  
Ćwicz: `%`, `_`, `LIKE`, `IN`, `BETWEEN`, `IS NULL`, `IS NOT NULL`.  
Baza: `biblioteka`.

## 5. Funkcje agregujące

Cel: tworzyć podsumowania.  
Ćwicz: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `ROUND`, `AS`.  
Baza: `sklep`.

## 6. GROUP BY

Cel: liczyć lub sumować osobno dla każdej kategorii.  
Ćwicz: kolumny grupujące, agregacja dla grup, sortowanie raportu.  
Baza: `sklep`.

## 7. HAVING

Cel: filtrować grupy po agregacji.  
Zapamiętaj: `WHERE` działa na wierszach, `HAVING` działa na grupach.  
Baza: `sklep`.

## 8. INNER JOIN

Cel: łączyć tylko rekordy mające dopasowanie w obu tabelach.  
Ćwicz: `JOIN ... ON`, aliasy tabel i łączenie trzech tabel.  
Baza: `sklep`.

## 9. LEFT JOIN

Cel: zachować wszystkie rekordy z lewej tabeli.  
Ćwicz: wyszukiwanie rekordów bez dopasowania przez `IS NULL`.  
Baza: `kino`.

## 10. Wielokrotne JOIN i aliasy

Cel: budować czytelny raport z czterech tabel.  
Ćwicz: krótkie aliasy, pełne warunki `ON`, wybór kolumn z wielu źródeł.  
Baza: `szkola`.

## 11. Podzapytania i WITH

Cel: używać wyniku jednego zapytania w innym.  
Ćwicz: podzapytanie skalarne, `IN (SELECT ...)`, `MAX`, podstawy `WITH`.  
Baza: `szkola`.

## 12. Projekt INF.03

Cel: połączyć `LEFT JOIN`, `COUNT`, `CASE`, `COALESCE`, `GROUP BY`, `HAVING` i `ORDER BY`.  
Rezultat: raport filmów z liczbą biletów i przychodem.  
Baza: `kino`.

## Checklista INF.03

- [ ] Potrafię rozpoznać tabelę główną i relacje po kluczach obcych.
- [ ] Potrafię napisać `SELECT` z wybranymi kolumnami.
- [ ] Potrafię filtrować przez `WHERE`, `AND`, `OR`, `LIKE`, `IN`, `BETWEEN`.
- [ ] Poprawnie sprawdzam brak wartości przez `IS NULL`.
- [ ] Potrafię sortować wynik przez `ORDER BY ASC/DESC`.
- [ ] Rozumiem różnicę między `WHERE` i `HAVING`.
- [ ] Potrafię używać `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`.
- [ ] Potrafię połączyć tabele przez `INNER JOIN` i `LEFT JOIN`.
- [ ] Używam aliasów tabel i jednoznacznych nazw kolumn.
- [ ] Potrafię zbudować raport z 4–6 tabel.
- [ ] Rozumiem, dlaczego `LEFT JOIN` może zwrócić `NULL`.
- [ ] Sprawdzam zapytanie na małym wyniku, zanim zbuduję raport końcowy.
- [ ] Potrafię opisać, co zwraca każda część zapytania.

## Sugerowany rytm

Na jedną sesję wybierz jedną lekcję. Po ukończeniu lekcji zmień dataset i napisz własne zapytanie o podobnej konstrukcji. Przed egzaminem wykonaj lekcje 8–12 bez otwierania rozwiązania, a następnie powtórz projekt końcowy na bazie MySQL.

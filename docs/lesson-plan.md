# Plan nauki SQL pod INF.03

Pracuj w kolejności. Dla każdej lekcji najpierw przeczytaj teorię i przykład krok po kroku, jeśli jest dostępny. Zadanie pokazowe pozwala zobaczyć rozwiązanie; kolejne rozwiąż samodzielnie i użyj `Sprawdź`.

## 1. SELECT i LIMIT

Cel: wybierać konkretne kolumny i ograniczać wynik.  
Ćwicz: `SELECT`, `FROM`, `LIMIT` na różnych tabelach.

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

## 7. HAVING krok po kroku

Cel: zobaczyć, jak z wierszy powstają grupy i które z nich zostawia `HAVING`.

Ćwicz: `GROUP BY`, `COUNT(*)`, `HAVING COUNT(*) > 1`; rozróżniaj wiersz od grupy.

Baza: `sklep`.

## 8. WHERE i HAVING razem

Cel: oddzielić wybór pojedynczych zamówień od wyboru policzonych grup.

Ćwicz: `WHERE` przed `GROUP BY` i `HAVING` po grupowaniu, na tej samej tabeli.

Baza: `sklep`.

## 9. INNER JOIN — dopasowanie po kluczach

Cel: połączyć dwa pasujące rekordy przez kolumnę klucza obcego i głównego.

Ćwicz: `INNER JOIN ... ON` na tabelach `zamowienia` i `klienci`; odczytuj identyfikatory przed połączeniem.

Baza: `sklep`.

## 10. INNER JOIN — wiele dopasowań

Cel: zrozumieć, dlaczego jeden klient może dać kilka wierszy wyniku, a inny żaden.

Ćwicz: jeden klient, dwa zamówienia, dwa wiersze wyniku; brak zamówienia oznacza brak wiersza.

Baza: `sklep`.

## 11. LEFT JOIN — rekordy bez pary

Cel: zachować film z lewej tabeli nawet wtedy, gdy nie ma seansu.

Ćwicz: `LEFT JOIN`, `NULL` po stronie seansu i wyszukiwanie przez `IS NULL`.

Baza: `kino`.

## 12. INNER JOIN kontra LEFT JOIN

Cel: porównać oba typy połączeń na tych samych filmach i wybrać właściwy do pytania.

Ćwicz: zamień tylko `INNER` na `LEFT` i zauważ dodatkowy wiersz z `NULL`.

Baza: `kino`.

## 13. Wielokrotne JOIN i aliasy

Cel: budować czytelny raport z czterech tabel.  
Ćwicz: krótkie aliasy, pełne warunki `ON`, wybór kolumn z wielu źródeł.  
Baza: `szkola`.

## 14. Podzapytania i WITH

Cel: używać wyniku jednego zapytania w innym.  
Ćwicz: podzapytanie skalarne, `IN (SELECT ...)`, `MAX`, podstawy `WITH`.  
Baza: `szkola`.

## 15. Projekt INF.03

Cel: połączyć `LEFT JOIN`, `COUNT`, `CASE`, `COALESCE`, `GROUP BY`, `HAVING` i `ORDER BY`.  
Rezultat: raport filmów z liczbą biletów i przychodem.  
Baza: `kino`.

## 16. CREATE TABLE

Cel: utworzyć tabelę od podstaw w pustej bazie.
Ćwicz: nazwy tabel, kolumny, typy i `PRIMARY KEY`.
Baza: `Laboratorium struktury`.

## 17. Kolumny i ograniczenia

Cel: określać, jakie wartości mogą trafić do kolumn.
Ćwicz: `NOT NULL` i `DEFAULT` razem z kluczem głównym.
Baza: `Laboratorium struktury`.

## 18. ALTER TABLE

Cel: zmieniać strukturę istniejącej tabeli bez usuwania jej danych.
Ćwicz: `ALTER TABLE ... ADD COLUMN`.
Baza: `Laboratorium struktury`.

## 19. Relacje i inspekcja schematu

Cel: połączyć tabele kluczem obcym i rozpoznać relację w schemacie.
Ćwicz: `FOREIGN KEY`, `REFERENCES` oraz `PRAGMA foreign_key_list`.
Baza: `Laboratorium struktury`.

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

Na jedną sesję wybierz jedną lekcję. Po ukończeniu lekcji zmień dataset i napisz własne zapytanie o podobnej konstrukcji. Przed egzaminem wykonaj samodzielne zadania z lekcji 7–15, a następnie powtórz projekt końcowy na bazie MySQL.

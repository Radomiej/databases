# Rozszerzenie kursu: HAVING i JOIN

Data: 2026-09-24

## Cel i zakres

Uczeń przygotowujący się do INF.03 ma zrozumieć, co dzieje się z wierszami podczas grupowania, filtrowania grup i łączenia tabel, zanim napisze samodzielne zapytanie. Obecne jednoakapitowe wprowadzenia do `HAVING` i `JOIN` są zbyt skrótowe. Rozszerzamy odcinek kursu od dotychczasowej lekcji 7 do lekcji 9 o trzy lekcje i przykłady krok po kroku. Lekcje 1–6 oraz istniejące zadania poza tym odcinkiem pozostają merytorycznie bez zmian.

Na tym etapie nie powstaje animacja Remotion. Użytkownik doprecyzował, że chce rozszerzenia konspektu i lekcji. Nie dodajemy nowych datasetów, zmian schematu ani nowych operacji w connectorze MySQL.

W zadaniach samodzielnych ukrywamy przycisk „Rozwiązanie”. Przycisk „Sprawdź” pozostaje dostępny: służy do oceny odpowiedzi i zaliczenia zadania. Pierwsze zadanie każdej lekcji nadal jest pokazowe i może ujawnić rozwiązanie. To rozróżnienie zachowuje wcześniejsze wymaganie automatycznej oceny.

## Nowa kolejność

| Nowy numer | Temat | Status | Główny krok poznawczy |
| --- | --- | --- | --- |
| 1–6 | Dotychczasowe podstawy do `GROUP BY` | Bez zmiany | Przygotowanie do agregacji grup |
| 7 | `HAVING` krok po kroku | Rozbudowa istniejącej `having` | Najpierw grupy i `COUNT`, potem wybór grup |
| 8 | `WHERE` i `HAVING` razem | Nowa `where-having` | Odfiltrowanie wierszy przed grupowaniem kontra grup po agregacji |
| 9 | `INNER JOIN` — dopasowanie po kluczach | Rozbudowa istniejącej `inner-join` | `ON` łączy klucz obcy z kluczem głównym |
| 10 | `INNER JOIN` — wiele dopasowań | Nowa `inner-join-matches` | Jeden klient może dać kilka wierszy; klient bez zamówienia znika |
| 11 | `LEFT JOIN` — rekordy bez pary | Rozbudowa istniejącej `left-join` | Lewa tabela zostaje, brak prawej daje `NULL` |
| 12 | `INNER JOIN` kontra `LEFT JOIN` | Nowa `join-comparison` | Ta sama para tabel, inna liczba i zawartość wierszy |
| 13–19 | Dotychczasowe lekcje 10–16 | Zmiana numerów | Zachowane identyfikatory, dane i postęp |

Nowy kurs ma 19 lekcji: 15 zapytaniowych i 4 dotyczące struktury. Każda nowa lekcja ma jedno zadanie pokazowe oraz dwa samodzielne. Istniejące identyfikatory lekcji i zadań nie zmieniają się, więc zapisane szkice i postęp zachowują swoje klucze; zmienia się tylko `order`. Nowe identyfikatory muszą być unikatowe.

## Sposób tłumaczenia

Lekcje 7–12 otrzymują, oprócz teorii i składni, rozwijany blok „Zobacz krok po kroku” przed listą zadań. Blok ma tę samą prostą strukturę w każdej lekcji:

1. Pytanie biznesowe napisane zwykłym językiem.
2. Małą próbkę rzeczywistych wierszy z bieżącego datasetu, z nazwami tabel i kolumn.
3. Dwa lub trzy kroki: pełne, uruchamialne zapytanie, jego wynik i krótka przyczyna, dla której wiersz został, powielił się lub odpadł.
4. Jedno zdanie „Zapamiętaj” i jeden typowy błąd.

Treść jest przechowywana jako strukturalne dane lekcji, a komponent prezentacyjny tylko ją renderuje; nie koduje logiki SQL. Zapytania objaśnień uruchamiamy w testach na seedach, a zapisane przykładowe wiersze porównujemy z ich wynikami. Przykłady korzystają z datasetów `sklep` i `kino`, nie z wymyślonych danych. W lekcjach 7–10 używamy m.in. klientów i zamówień: Anna Nowak ma dwa zamówienia, Marek Lewandowski nie ma żadnego. W lekcjach 11–12 film „W drodze” nie ma seansu. Dla porównania `INNER`/`LEFT` używamy tego samego kierunku połączenia i tych samych tabel, żeby różnicę wyjaśniała wyłącznie zmiana rodzaju JOIN.

Wstęp do `HAVING` wyjaśnia kolejność logiczną `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` jako pomoc dydaktyczną, bez wymagania zapamiętania formalnej kolejności wykonania przez silnik. Wstęp do `INNER JOIN` pokazuje, które konkretne wartości z `zamowienia.klient_id` pasują do `klienci.id`; nie przedstawia `INNER JOIN` jako zwykłego sklejenia dwóch wierszy bez warunku.

Zadania nowych lekcji odnoszą się wyłącznie do bieżącego i wcześniejszego materiału. Każde ma jawne kolumny wyniku, wymagane aliasy, warunki i sortowanie, jeśli są oceniane. Podpowiedzi wyjaśniają konstrukcję, ale nie podają całego rozwiązania w zadaniach samodzielnych.

## Model danych i interfejs

- `src/data/lessons.js` oraz, jeśli ułatwi czytelność, osobny moduł z trzema nowymi definicjami: nowe lekcje, zachowane stare `id`, ponumerowanie przez uporządkowaną listę, a nie ręczne przesuwanie identyfikatorów.
- `src/data/lessonTasks.js`: po dwa samodzielne zadania do każdej nowej lekcji. Istniejący mechanizm `buildLessonTasks` tworzy zadanie pokazowe.
- `src/data/lessonCurriculum.js`: nowe pozycje tematyczne umieszczone w poprawnej kolejności. Nowa lekcja utrwalająca może mieć pustą listę `introduces`, ale testy nadal sprawdzają, że nie korzysta z późniejszego materiału.
- `src/components/LessonPanel.jsx`: blok objaśnienia dostępny klawiaturą, domyślnie zamknięty, z czytelnymi małymi tabelami i fragmentami SQL. Zadania oraz podpowiedzi pozostają w obecnym układzie.
- `src/components/SqlEditor.jsx` i `src/App.jsx`: jawna flaga widoczności rozwiązania zależna od tego, czy aktywne zadanie jest pierwszym zadaniem pokazowym. `Uruchom`, `Sprawdź` i `Wyczyść` nie znikają. Ukryty przycisk nie może ujawnić rozwiązania przez inny skrót lub wywołanie UI.
- `docs/lesson-plan.md`, README i pomoc w aplikacji: nowe numery oraz informacja o zadaniu pokazowym i samodzielnym.

Nie dodajemy nowego backendu ani zapisu stanu objaśnienia. Otwieranie bloku jest lokalnym stanem interfejsu. Wyniki i postęp zadań nadal zapisują się istniejącymi mechanizmami.

## Akceptacja i testy

- 19 lekcji i trzy zadania na każdą; brak powtórzonych `id` i `order`.
- Rozwiązania wszystkich nowych zadań uruchamiają się na właściwym datasecie i przechodzą walidator wyniku.
- Przykłady krokowe odzwierciedlają rzeczywiste dane seedów; liczby i wiersze pokazane w objaśnieniu są sprawdzane testami.
- Test progresji nie dopuszcza konstrukcji przyszłych lekcji w przykładach, zadaniach ani podpowiedziach.
- W zadaniu pokazowym „Rozwiązanie” jest dostępne. W samodzielnym go nie ma, ale „Sprawdź” nadal zalicza poprawne zapytanie. Przełączanie zadań i odświeżenie nie ujawniają rozwiązania.
- Ręczna kontrola lekcji 7–12 na wąskim i szerokim ekranie: tabelki nie wychodzą poza panel, kolejność kroków i semantyka `NULL` są zrozumiałe.
- `npm test`, `npm run build` oraz kontrola diffu bez błędów.

## Ochrona istniejących zmian

W repozytorium są lokalne, niezatwierdzone zmiany z poprzedniej prośby: doprecyzowane zadania i rozwijane karty. Implementacja ma na nich pracować i ich nie cofać. Specyfikacja może być zatwierdzona osobnym commitem bez obejmowania tych zmian.

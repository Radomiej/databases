const task = (id, title, prompt, hint, solution, expected) => ({
  id,
  title,
  prompt,
  hint,
  solution,
  expected,
  successMessage: 'Zadanie zaliczone — wynik spełnia wymagania tego ćwiczenia.',
});

export const ADDITIONAL_LESSON_TASKS = {
  'select-limit': [
    task('authors-list', 'Autorzy z limitem', 'Pokaż imiona i nazwiska trzech pierwszych autorów z tabeli autorzy.', 'Wybierz kolumny imie i nazwisko z tabeli autorzy i dodaj LIMIT 3.', 'SELECT imie, nazwisko FROM autorzy LIMIT 3;', { columns: ['imie', 'nazwisko'], rows: [['Adam', 'Mickiewicz'], ['Bolesław', 'Prus'], ['Henryk', 'Sienkiewicz']], strictOrder: true }),
    task('loans-list', 'Wypożyczenia z limitem', 'Pokaż czytelników z dwóch pierwszych wypożyczeń.', 'Wybierz kolumnę czytelnik z tabeli wypozyczenia i dodaj LIMIT 2.', 'SELECT czytelnik FROM wypozyczenia LIMIT 2;', { columns: ['czytelnik'], rows: [['Anna Nowak'], ['Piotr Kowalski']], strictOrder: true }),
  ],
  where: [
    task('price-filter', 'Filtr ceny', 'Pokaż tytuły i ceny książek, których cena wynosi co najmniej 40.', 'Użyj warunku cena >= 40. Kolejność danych pozostaw taką, jaką zwraca tabela.', 'SELECT tytul, cena FROM ksiazki WHERE cena >= 40;', { columns: ['tytul', 'cena'], rows: [['Bieguni', 44.9], ['Faraon', 41.2]], strictOrder: true }),
    task('author-filter', 'Warunek z AND', 'Pokaż polskich autorów, których identyfikator nie przekracza 3.', 'Połącz kraj = \'Polska\' z id <= 3. Nie potrzebujesz jeszcze sortowania.', "SELECT imie, nazwisko FROM autorzy WHERE kraj = 'Polska' AND id <= 3;", { columns: ['imie', 'nazwisko'], rows: [['Adam', 'Mickiewicz'], ['Bolesław', 'Prus'], ['Henryk', 'Sienkiewicz']], strictOrder: true }),
  ],
  'order-by': [
    task('oldest-books', 'Najstarsze książki', 'Pokaż cztery najstarsze książki wraz z rokiem wydania.', 'Posortuj wynik rosnąco według rok_wydania i id, a następnie ogranicz go do czterech rekordów.', 'SELECT tytul, rok_wydania FROM ksiazki ORDER BY rok_wydania, id LIMIT 4;', { columns: ['tytul', 'rok_wydania'], rows: [['Pan Tadeusz', 1834], ['Kordian', 1834], ['Lalka', 1890], ['Quo vadis', 1896]], strictOrder: true }),
    task('recent-loans', 'Najnowsze wypożyczenia', 'Pokaż dwóch czytelników z najnowszymi datami wypożyczenia.', 'Posortuj według data_wypozyczenia malejąco i użyj LIMIT 2.', 'SELECT czytelnik, data_wypozyczenia FROM wypozyczenia ORDER BY data_wypozyczenia DESC LIMIT 2;', { columns: ['czytelnik', 'data_wypozyczenia'], rows: [['Anna Nowak', '2026-03-02'], ['Tomasz Zieliński', '2026-02-18']], strictOrder: true }),
  ],
  'like-null': [
    task('selected-years', 'Kilka wartości przez IN', 'Pokaż tytuły książek wydanych w roku 1890 lub 1900.', 'Użyj IN (1890, 1900). Możesz wykorzystać poznane wcześniej ORDER BY id.', 'SELECT tytul FROM ksiazki WHERE rok_wydania IN (1890, 1900) ORDER BY id;', { columns: ['tytul'], rows: [['Lalka'], ['Krzyżacy']], strictOrder: true }),
    task('returned-loans', 'Zakres dat i NOT NULL', 'Pokaż czytelników, których książki zwrócono w styczniu lub lutym 2026.', 'Połącz IS NOT NULL z BETWEEN dla kolumny data_zwrotu.', "SELECT czytelnik FROM wypozyczenia WHERE data_zwrotu IS NOT NULL AND data_zwrotu BETWEEN '2026-01-01' AND '2026-02-28' ORDER BY id;", { columns: ['czytelnik'], rows: [['Anna Nowak'], ['Maria Wójcik']], strictOrder: true }),
  ],
  aggregates: [
    task('line-summary', 'Podsumowanie pozycji', 'Oblicz łączną liczbę sprzedanych sztuk oraz średnią cenę pozycji, zaokrąglając wynik do dwóch miejsc po przecinku.', 'Użyj SUM(ilosc) oraz ROUND(AVG(cena_sztukowa), 2) w tabeli pozycje_zamowien.', 'SELECT SUM(ilosc) AS suma_sztuk, ROUND(AVG(cena_sztukowa), 2) AS srednia_cena FROM pozycje_zamowien;', { columns: ['suma_sztuk', 'srednia_cena'], rows: [[12, 701.64]], strictOrder: true }),
    task('price-extremes', 'Skrajne ceny', 'Pokaż najniższą i najwyższą cenę produktu.', 'Użyj MIN(cena) i MAX(cena) w jednej agregacji.', 'SELECT MIN(cena) AS najtanszy, MAX(cena) AS najdrozszy FROM produkty;', { columns: ['najtanszy', 'najdrozszy'], rows: [[89.9, 2899]], strictOrder: true }),
  ],
  'group-by': [
    task('orders-by-status', 'Zamówienia według statusu', 'Policz zamówienia w każdym statusie i posortuj statusy alfabetycznie.', 'Wybierz status i COUNT(*), następnie GROUP BY status oraz ORDER BY status.', 'SELECT status, COUNT(*) AS liczba FROM zamowienia GROUP BY status ORDER BY status;', { columns: ['status', 'liczba'], rows: [['nowe', 1], ['wysłane', 2], ['zrealizowane', 3]], strictOrder: true }),
    task('customers-by-city', 'Klienci według miasta', 'Policz klientów w każdym mieście, zaczynając od najliczniejszych grup.', 'Pogrupuj po miasto i sortuj po aliasie liczba_klientow malejąco, a potem po mieście.', 'SELECT miasto, COUNT(*) AS liczba_klientow FROM klienci GROUP BY miasto ORDER BY liczba_klientow DESC, miasto;', { columns: ['miasto', 'liczba_klientow'], rows: [['Gdańsk', 2], ['Kraków', 2], ['Warszawa', 1], ['Wrocław', 1]], strictOrder: true }),
  ],
  having: [
    task('popular-products', 'Produkty w wielu sztukach', 'Pokaż identyfikatory produktów, których łączna liczba zamówionych sztuk wynosi co najmniej 2.', 'Pogrupuj po produkt_id i odfiltruj grupy przez HAVING SUM(ilosc) >= 2.', 'SELECT produkt_id, SUM(ilosc) AS sztuk FROM pozycje_zamowien GROUP BY produkt_id HAVING SUM(ilosc) >= 2 ORDER BY produkt_id;', { columns: ['produkt_id', 'sztuk'], rows: [[1, 3], [2, 3], [3, 2], [5, 2]], strictOrder: true }),
    task('single-order-customers', 'Klienci z jednym zamówieniem', 'Pokaż identyfikatory klientów, którzy złożyli dokładnie jedno zamówienie.', 'Użyj GROUP BY klient_id i HAVING COUNT(*) = 1.', 'SELECT klient_id, COUNT(*) AS liczba_zamowien FROM zamowienia GROUP BY klient_id HAVING COUNT(*) = 1 ORDER BY klient_id;', { columns: ['klient_id', 'liczba_zamowien'], rows: [[2, 1], [3, 1], [4, 1], [5, 1]], strictOrder: true }),
  ],
  'inner-join': [
    task('large-quantities', 'Pozycje zamówione wielokrotnie', 'Pokaż nazwy produktów występujących w pozycjach zamówień, w których ilość wynosi co najmniej 2.', 'Połącz pozycje_zamowien z produktami po produkt_id i użyj WHERE ilosc >= 2.', 'SELECT p.nazwa, z.ilosc FROM pozycje_zamowien z INNER JOIN produkty p ON p.id = z.produkt_id WHERE z.ilosc >= 2 ORDER BY z.id;', { columns: ['nazwa', 'ilosc'], rows: [['Kamera internetowa', 2], ['Mysz bezprzewodowa', 2], ['Klawiatura mechaniczna', 2]], strictOrder: true }),
    task('first-order-lines', 'Pierwsze zamówienie', 'Pokaż produkty i ilości z pozycji pierwszego zamówienia.', 'Połącz pozycje_zamowien z produktami po produkt_id, a następnie użyj WHERE zamowienie_id = 1.', 'SELECT p.nazwa, poz.ilosc FROM pozycje_zamowien poz INNER JOIN produkty p ON p.id = poz.produkt_id WHERE poz.zamowienie_id = 1 ORDER BY poz.id;', { columns: ['nazwa', 'ilosc'], rows: [['Klawiatura mechaniczna', 1], ['Mysz bezprzewodowa', 1]], strictOrder: true }),
  ],
  'left-join': [
    task('tickets-by-customer', 'Bilety każdego klienta', 'Pokaż każdego klienta oraz liczbę kupionych przez niego biletów, nawet jeśli nie kupił żadnego.', 'Zastosuj LEFT JOIN, COUNT(b.id) i GROUP BY klienta.', 'SELECT k.imie, k.nazwisko, COUNT(b.id) AS liczba_biletow FROM klienci k LEFT JOIN bilety b ON b.klient_id = k.id GROUP BY k.id, k.imie, k.nazwisko ORDER BY k.id;', { columns: ['imie', 'nazwisko', 'liczba_biletow'], rows: [['Anna', 'Nowak', 2], ['Piotr', 'Kowalski', 2], ['Maria', 'Wójcik', 2], ['Tomasz', 'Zieliński', 2], ['Julia', 'Kamińska', 1]], strictOrder: true }),
    task('screenings-by-film', 'Seanse każdego filmu', 'Pokaż każdy film i liczbę jego seansów, zachowując także filmy bez zaplanowanego seansu.', 'Połącz filmy z seansami przez LEFT JOIN i zgrupuj wynik według filmu.', 'SELECT f.tytul, COUNT(s.id) AS liczba_seansow FROM filmy f LEFT JOIN seanse s ON s.film_id = f.id GROUP BY f.id, f.tytul ORDER BY f.id;', { columns: ['tytul', 'liczba_seansow'], rows: [['Cicha rzeka', 2], ['Weekend w górach', 1], ['Orbita 9', 1], ['Mały robot', 1], ['W drodze', 0], ['Ostatni seans', 1]], strictOrder: true }),
  ],
  'multi-join': [
    task('top-grades', 'Najwyższe oceny', 'Pokaż uczniów, ich klasy oraz oceny równe 5.', 'Połącz oceny z uczniami i klasami, a następnie użyj WHERE o.ocena >= 5.', 'SELECT u.imie, u.nazwisko, k.symbol, o.ocena FROM oceny o JOIN uczniowie u ON u.id = o.uczen_id JOIN klasy k ON k.id = u.klasa_id WHERE o.ocena >= 5 ORDER BY o.id;', { columns: ['imie', 'nazwisko', 'symbol', 'ocena'], rows: [['Anna', 'Nowak', '3A', 5], ['Anna', 'Nowak', '3A', 5], ['Tomasz', 'Zieliński', '3B', 5], ['Julia', 'Kamińska', '4A', 5], ['Julia', 'Kamińska', '4A', 5]], strictOrder: true }),
    task('subject-averages', 'Średnie przedmiotów', 'Oblicz średnią ocenę dla każdego przedmiotu i zaokrąglij ją do dwóch miejsc po przecinku.', 'Połącz oceny z przedmiotami, użyj ROUND(AVG(o.ocena), 2) i GROUP BY.', 'SELECT p.nazwa, ROUND(AVG(o.ocena), 2) AS srednia FROM oceny o JOIN przedmioty p ON p.id = o.przedmiot_id GROUP BY p.id, p.nazwa ORDER BY p.id;', { columns: ['nazwa', 'srednia'], rows: [['Bazy danych', 4.33], ['Programowanie', 4], ['Matematyka', 4.33], ['Język polski', 4]], strictOrder: true }),
  ],
  subqueries: [
    task('grade-three', 'Uczniowie z oceną 3', 'Pokaż uczniów, którzy otrzymali co najmniej jedną ocenę 3.', 'W podzapytaniu wybierz uczen_id z tabeli oceny, a na zewnątrz użyj IN.', 'SELECT imie, nazwisko FROM uczniowie WHERE id IN (SELECT uczen_id FROM oceny WHERE ocena = 3) ORDER BY id;', { columns: ['imie', 'nazwisko'], rows: [['Piotr', 'Kowalski'], ['Maria', 'Wójcik']], strictOrder: true }),
    task('high-averages', 'Uczniowie z wysoką średnią', 'Pokaż uczniów, których średnia ocen wynosi co najmniej 4,5. Wykorzystaj konstrukcję CTE WITH.', 'W CTE oblicz średnią dla każdego uczen_id, a potem połącz wynik z uczniami.', 'WITH srednie AS (SELECT uczen_id, ROUND(AVG(ocena), 2) AS srednia FROM oceny GROUP BY uczen_id) SELECT u.imie, u.nazwisko, s.srednia FROM srednie s JOIN uczniowie u ON u.id = s.uczen_id WHERE s.srednia >= 4.5 ORDER BY u.id;', { columns: ['imie', 'nazwisko', 'srednia'], rows: [['Anna', 'Nowak', 4.67], ['Tomasz', 'Zieliński', 4.5], ['Julia', 'Kamińska', 5]], strictOrder: true }),
  ],
  'final-project': [
    task('screening-counts', 'Filmy i liczba seansów', 'Pokaż filmy, które mają co najmniej jeden seans, oraz liczbę tych seansów.', 'Użyj LEFT JOIN, GROUP BY i HAVING COUNT(se.id) > 0.', 'SELECT f.tytul, COUNT(se.id) AS seanse FROM filmy f LEFT JOIN seanse se ON se.film_id = f.id GROUP BY f.id, f.tytul HAVING COUNT(se.id) > 0 ORDER BY f.tytul;', { columns: ['tytul', 'seanse'], rows: [['Cicha rzeka', 2], ['Mały robot', 1], ['Orbita 9', 1], ['Ostatni seans', 1], ['Weekend w górach', 1]], strictOrder: true }),
    task('ticket-statuses', 'Bilety według statusu', 'Policz bilety w każdym statusie i posortuj statusy alfabetycznie.', 'Wybierz status i COUNT(*), a następnie GROUP BY status.', 'SELECT status, COUNT(*) AS liczba FROM bilety GROUP BY status ORDER BY status;', { columns: ['status', 'liczba'], rows: [['opłacony', 8], ['zarezerwowany', 1]], strictOrder: true }),
  ],
};

export function getTaskProgressKey(lessonId, taskId) {
  return `${lessonId}:${taskId}`;
}

export function buildLessonTasks(lesson) {
  const guidedTask = {
    id: `${lesson.id}-guided`,
    title: 'Zadanie pokazowe',
    prompt: lesson.task,
    hint: lesson.hint,
    solution: lesson.solution,
    expected: lesson.expected,
    successMessage: lesson.successMessage,
  };
  return [guidedTask, ...(ADDITIONAL_LESSON_TASKS[lesson.id] ?? [])];
}

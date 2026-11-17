const CHECKS = {
  'select-limit': ['Co ogranicza LIMIT 3?', ['Liczbę wierszy w wyniku do trzech.', 'Liczbę kolumn do trzech.', 'Wybiera trzy najnowsze rekordy.'], 0],
  where: ['Na czym działa WHERE?', ['Na pojedynczych wierszach przed utworzeniem wyniku.', 'Na gotowych grupach po GROUP BY.', 'Na kolejności wierszy.'], 0],
  'order-by': ['Co robi ORDER BY cena DESC?', ['Sortuje ceny od największej do najmniejszej.', 'Odfiltrowuje ceny większe od zera.', 'Zwraca tylko jeden wiersz.'], 0],
  'like-null': ['Jak poprawnie znaleźć brakującą datę zwrotu?', ['data_zwrotu IS NULL', 'data_zwrotu = NULL', 'data_zwrotu LIKE NULL'], 0],
  aggregates: ['Co oblicza AVG(cena)?', ['Średnią cenę z wybranych wierszy.', 'Liczbę wszystkich tabel.', 'Najwyższą cenę.'], 0],
  'group-by': ['Co robi GROUP BY kategoria?', ['Tworzy osobną grupę dla każdej kategorii.', 'Sortuje kategorię alfabetycznie.', 'Usuwa puste kolumny.'], 0],
  having: ['Kiedy działa HAVING?', ['Filtruje grupy po ich utworzeniu i obliczeniu agregatów.', 'Filtruje wiersze przed grupowaniem.', 'Łączy dwie tabele.'], 0],
  'where-having': ['W jakiej kolejności myślimy o WHERE i HAVING?', ['WHERE wybiera wiersze, potem HAVING wybiera gotowe grupy.', 'HAVING wybiera wiersze, potem WHERE grupy.', 'Oba zawsze działają dopiero po ORDER BY.'], 0],
  'inner-join': ['Które pary zwróci INNER JOIN?', ['Tylko te, które pasują po obu stronach warunku ON.', 'Każdy wiersz z lewej tabeli, nawet bez pary.', 'Tylko wiersze bez dopasowania.'], 0],
  'inner-join-matches': ['Anna ma dwa zamówienia, a Marek żadnego. Co zwróci INNER JOIN?', ['Dwa wiersze Anny; Marek nie pojawi się w wyniku.', 'Jeden wiersz Anny i jeden Marka.', 'Jeden wiersz na osobę, bez względu na zamówienia.'], 0],
  'left-join': ['Co stanie się z filmem bez seansu przy LEFT JOIN?', ['Zostanie w wyniku, a kolumny seansu będą NULL.', 'Zniknie z wyniku.', 'Zostanie dopisany fikcyjny seans o id 0.'], 0],
  'join-comparison': ['Jaka jest podstawowa różnica LEFT i INNER JOIN?', ['LEFT zachowuje wszystkie wiersze z lewej tabeli; INNER tylko dopasowane pary.', 'INNER zachowuje wszystkie wiersze z lewej tabeli; LEFT tylko dopasowane.', 'Oba zawsze zwracają taki sam zestaw wierszy.'], 0],
  'multi-join': ['Do czego służy osobny warunek ON przy każdym JOIN?', ['Wskazuje, które klucze łączą kolejne tabele.', 'Sortuje kolumny każdej tabeli.', 'Zastępuje SELECT.'], 0],
  subqueries: ['Co robi podzapytanie w WHERE ... IN (SELECT ...)?', ['Najpierw dostarcza zestaw wartości, z którym porównuje zapytanie zewnętrzne.', 'Tworzy nową tabelę na stałe.', 'Sortuje wynik zewnętrzny.'], 0],
  'final-project': ['Dlaczego w raporcie łączymy JOIN z GROUP BY?', ['JOIN dobiera powiązane dane, a GROUP BY pozwala je podsumować.', 'GROUP BY tworzy klucze obce, a JOIN sortuje wynik.', 'Te słowa są zamienne.'], 0],
  'create-table': ['Co robi CREATE TABLE?', ['Tworzy definicję nowej tabeli.', 'Dodaje wiersz do istniejącej tabeli.', 'Wyświetla kolumny tabeli.'], 0],
  'column-constraints': ['Co zapewnia NOT NULL?', ['Wymaga wartości w tej kolumnie.', 'Automatycznie sortuje kolumnę.', 'Nadaje każdemu wierszowi inny tekst.'], 0],
  'alter-table': ['Do czego służy ALTER TABLE ... ADD COLUMN?', ['Dodaje kolumnę do istniejącej tabeli.', 'Tworzy zapytanie SELECT.', 'Usuwa całą tabelę.'], 0],
  'schema-relations': ['Co wskazuje FOREIGN KEY ... REFERENCES osoby(id)?', ['Kolumna odwołuje się do klucza w tabeli osoby.', 'Kolumna jest sortowana według id.', 'Tabela zostaje skopiowana.'], 0],
};

export function getSqlQuickCheck(lessonId) {
  const check = CHECKS[lessonId];
  if (!check) return null;
  const [question, options, correctIndex] = check;
  return { question, options, correctIndex };
}

export const SQL_QUICK_CHECK_IDS = Object.keys(CHECKS);

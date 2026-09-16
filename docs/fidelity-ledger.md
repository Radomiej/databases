# Fidelity ledger — SQL Learning Lab

Punkt odniesienia: zaakceptowany koncept [sql-learning-lab-concept.png](C:/Nauka/databases/docs/design/sql-learning-lab-concept.png). Ostatni widok aplikacji został sprawdzony w Codex In-app Browser na `http://localhost:5173/` po uruchomieniu buildu developerskiego.

| Obszar | Koncept | Implementacja | Ocena |
| --- | --- | --- | --- |
| Kompozycja | Ciemny rail po lewej, główna lekcja pośrodku, inspektor schematu po prawej | Ten sam układ trzech stref; sidebar, workspace i inspector są widoczne równocześnie | Zgodne |
| Kolor i hierarchia | Granatowe tło nawigacji, jasne płótno, turkusowy przycisk główny, zielony status | Zachowane kolory i statusy SQLite/MySQL, z turkusem dla `Uruchom` i aktywnego trybu | Zgodne |
| Typografia | Duży, mocny tytuł lekcji, małe etykiety sekcji i techniczny tekst SQL | `h1` lekcji, kicker `LEKCJA`, etykiety składni i osobny styl monospace dla edytora | Zgodne |
| Priorytet akcji | `Uruchom` jest najbardziej kontrastową akcją, `Sprawdź` i pozostałe są drugorzędne | Identyczna hierarchia przycisków oraz osobne akcje `Wyczyść` i `Rozwiązanie` | Zgodne |
| Schemat | Karty tabel z liczbą kolumn, ikonami kluczy i zakładkami `Tabele`/`Relacje` | Karty są generowane z SQLite lub rzeczywistego schematu MySQL, z wyszukiwaniem i relacjami | Zgodne + rozszerzone |
| Edytor i wynik | Duży obszar SQL, wynik w tabeli z liczbą rekordów | Edytor ma numerowanie, skrót `Ctrl+Enter`, podpowiedź, wynik/historię i walidację lekcji | Zgodne + rozszerzone |
| Podgląd tabeli | Koncept pokazuje wynik zapytania jako tabelę | Menu `⋮` przy tabeli otwiera modal z rekordami aktualnej bazy, limit 50, `NULL` i odświeżaniem | Celowe rozszerzenie |
| Edycja relacji | Zakładka `Relacje` pokazuje połączenia tabel | SQLite ma modal edycji FK z zapisem i resetem; MySQL pokazuje relacje rzeczywiste tylko do odczytu | Celowe rozszerzenie |
| Gęstość widoku | Koncept pokazuje lekcję i początek wyniku w jednym ekranie | Widok developerski zachowuje tę gęstość; dłuższe listy przewijają się niezależnie w sidebarze i inspectorze | Zgodne |

Najważniejsza różnica jest celowa: wersja działająca ma pełne 12 lekcji, cztery datasety, kreator własnych tabel i panel konektora MySQL, więc zawiera więcej elementów niż statyczny koncept.

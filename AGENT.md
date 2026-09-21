# Wymagania dydaktyczne SQL Lab

## Zasada progresji materiału

Przykłady, rozwiązania i zadania w lekcji mogą wykorzystywać wiedzę z bieżącej oraz wcześniejszych lekcji, ale nie mogą wymagać pojęć, których uczeń pozna dopiero później. Uczeń nie powinien dostać zadania z nieznaną składnią tylko dlatego, że zapytanie nadal wykonuje się poprawnie.

Nie trzeba rozdzielać zadań na osobne kategorie ani ujawniać tej zasady w interfejsie. To wewnętrzne wymaganie jakości treści.

Przy dodawaniu lub zmianie lekcji:

- sprawdź, jakie konstrukcje SQL są wprowadzane w danej lekcji;
- zadania mogą łączyć nowe konstrukcje z materiałem z poprzednich lekcji;
- nie używaj konstrukcji z kolejnych lekcji w przykładach, podpowiedziach ani rozwiązaniach;
- uruchom testy z `src/data/lessons.test.js`, które wykonują wszystkie rozwiązania i sprawdzają kolejność materiału.

## Język dydaktyczny

Treści lekcji i zadań powinny być napisane naturalnym, poprawnym językiem polskim. Nazwy czynności muszą odpowiadać temu, co rzeczywiście robi uczeń i co zwraca zapytanie. Używaj określenia „zadanie pokazowe” dla pierwszego przykładu, a „zadanie samodzielne” dla kolejnych. Unikaj kalk językowych, nieprecyzyjnych opisów oraz sformułowań sugerujących kolumny lub dane, których wynik nie zawiera.

## Lekcje struktury bazy

Lekcje 13–16 korzystają z pustego datasetu `structure-lab`. Ich zadania są oceniane przez porównanie rzeczywistego schematu po wykonaniu DDL: tabel, kolumn, typów, `PRIMARY KEY`, `NOT NULL`, `DEFAULT` i kluczy obcych. Nie wymagaj w tych zadaniach funkcji zapytań, które nie należą do omawianego zakresu. W trybie MySQL zmiany struktury muszą korzystać z osobnej zgody connectora; polecenia administracji użytkownikami pozostają poza zwykłym kursem.

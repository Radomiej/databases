const table = (name, columns) => ({ name, columns });

const commonDatasetFields = {
  source: 'local-seed',
  dialectNote: 'Podzbiór składni wspólny dla SQLite i MySQL.',
};

export const DATASETS = [
  {
    ...commonDatasetFields,
    id: 'biblioteka',
    name: 'Biblioteka',
    level: 'Podstawowy',
    summary: 'Książki, autorzy i wypożyczenia — dobry start z SELECT i WHERE.',
    tables: [
      table('autorzy', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'imie', type: 'TEXT', notNull: true },
        { name: 'nazwisko', type: 'TEXT', notNull: true },
        { name: 'kraj', type: 'TEXT', notNull: true },
      ]),
      table('ksiazki', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'tytul', type: 'TEXT', notNull: true },
        { name: 'rok_wydania', type: 'INTEGER', notNull: true },
        { name: 'autor_id', type: 'INTEGER', notNull: true, foreignKey: 'autorzy.id' },
        { name: 'cena', type: 'REAL', notNull: true },
      ]),
      table('wypozyczenia', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'ksiazka_id', type: 'INTEGER', notNull: true, foreignKey: 'ksiazki.id' },
        { name: 'czytelnik', type: 'TEXT', notNull: true },
        { name: 'data_wypozyczenia', type: 'DATE', notNull: true },
        { name: 'data_zwrotu', type: 'DATE' },
      ]),
    ],
    relationships: [
      { from: 'ksiazki.autor_id', to: 'autorzy.id' },
      { from: 'wypozyczenia.ksiazka_id', to: 'ksiazki.id' },
    ],
    seedSql: `
      PRAGMA foreign_keys = ON;
      CREATE TABLE autorzy (
        id INTEGER PRIMARY KEY,
        imie TEXT NOT NULL,
        nazwisko TEXT NOT NULL,
        kraj TEXT NOT NULL
      );
      CREATE TABLE ksiazki (
        id INTEGER PRIMARY KEY,
        tytul TEXT NOT NULL,
        rok_wydania INTEGER NOT NULL,
        autor_id INTEGER NOT NULL,
        cena REAL NOT NULL,
        FOREIGN KEY (autor_id) REFERENCES autorzy(id)
      );
      CREATE TABLE wypozyczenia (
        id INTEGER PRIMARY KEY,
        ksiazka_id INTEGER NOT NULL,
        czytelnik TEXT NOT NULL,
        data_wypozyczenia DATE NOT NULL,
        data_zwrotu DATE,
        FOREIGN KEY (ksiazka_id) REFERENCES ksiazki(id)
      );
      INSERT INTO autorzy (id, imie, nazwisko, kraj) VALUES
        (1, 'Adam', 'Mickiewicz', 'Polska'),
        (2, 'Bolesław', 'Prus', 'Polska'),
        (3, 'Henryk', 'Sienkiewicz', 'Polska'),
        (4, 'Juliusz', 'Słowacki', 'Polska'),
        (5, 'Olga', 'Tokarczuk', 'Polska');
      INSERT INTO ksiazki (id, tytul, rok_wydania, autor_id, cena) VALUES
        (1, 'Pan Tadeusz', 1834, 1, 29.99),
        (2, 'Lalka', 1890, 2, 39.90),
        (3, 'Quo vadis', 1896, 3, 34.50),
        (4, 'Kordian', 1834, 4, 27.00),
        (5, 'Bieguni', 2007, 5, 44.90),
        (6, 'Solaris', 1961, 5, 36.80),
        (7, 'Faraon', 1897, 2, 41.20),
        (8, 'Krzyżacy', 1900, 3, 32.00);
      INSERT INTO wypozyczenia (id, ksiazka_id, czytelnik, data_wypozyczenia, data_zwrotu) VALUES
        (1, 1, 'Anna Nowak', '2026-01-12', '2026-01-26'),
        (2, 2, 'Piotr Kowalski', '2026-02-03', NULL),
        (3, 3, 'Maria Wójcik', '2026-02-11', '2026-02-25'),
        (4, 5, 'Tomasz Zieliński', '2026-02-18', NULL),
        (5, 7, 'Anna Nowak', '2026-03-02', '2026-03-16');
    `,
  },
  {
    ...commonDatasetFields,
    id: 'sklep',
    name: 'Sklep internetowy',
    level: 'Średni',
    summary: 'Klienci, zamówienia i produkty do agregacji oraz JOIN-ów.',
    tables: [
      table('klienci', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'imie', type: 'TEXT', notNull: true },
        { name: 'nazwisko', type: 'TEXT', notNull: true },
        { name: 'miasto', type: 'TEXT', notNull: true },
      ]),
      table('produkty', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'nazwa', type: 'TEXT', notNull: true },
        { name: 'kategoria', type: 'TEXT', notNull: true },
        { name: 'cena', type: 'REAL', notNull: true },
        { name: 'stan_magazynowy', type: 'INTEGER', notNull: true },
      ]),
      table('zamowienia', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'klient_id', type: 'INTEGER', notNull: true, foreignKey: 'klienci.id' },
        { name: 'data_zamowienia', type: 'DATE', notNull: true },
        { name: 'status', type: 'TEXT', notNull: true },
      ]),
      table('pozycje_zamowien', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'zamowienie_id', type: 'INTEGER', notNull: true, foreignKey: 'zamowienia.id' },
        { name: 'produkt_id', type: 'INTEGER', notNull: true, foreignKey: 'produkty.id' },
        { name: 'ilosc', type: 'INTEGER', notNull: true },
        { name: 'cena_sztukowa', type: 'REAL', notNull: true },
      ]),
    ],
    relationships: [
      { from: 'zamowienia.klient_id', to: 'klienci.id' },
      { from: 'pozycje_zamowien.zamowienie_id', to: 'zamowienia.id' },
      { from: 'pozycje_zamowien.produkt_id', to: 'produkty.id' },
    ],
    seedSql: `
      PRAGMA foreign_keys = ON;
      CREATE TABLE klienci (
        id INTEGER PRIMARY KEY,
        imie TEXT NOT NULL,
        nazwisko TEXT NOT NULL,
        miasto TEXT NOT NULL
      );
      CREATE TABLE produkty (
        id INTEGER PRIMARY KEY,
        nazwa TEXT NOT NULL,
        kategoria TEXT NOT NULL,
        cena REAL NOT NULL,
        stan_magazynowy INTEGER NOT NULL
      );
      CREATE TABLE zamowienia (
        id INTEGER PRIMARY KEY,
        klient_id INTEGER NOT NULL,
        data_zamowienia DATE NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (klient_id) REFERENCES klienci(id)
      );
      CREATE TABLE pozycje_zamowien (
        id INTEGER PRIMARY KEY,
        zamowienie_id INTEGER NOT NULL,
        produkt_id INTEGER NOT NULL,
        ilosc INTEGER NOT NULL,
        cena_sztukowa REAL NOT NULL,
        FOREIGN KEY (zamowienie_id) REFERENCES zamowienia(id),
        FOREIGN KEY (produkt_id) REFERENCES produkty(id)
      );
      INSERT INTO klienci (id, imie, nazwisko, miasto) VALUES
        (1, 'Anna', 'Nowak', 'Gdańsk'),
        (2, 'Piotr', 'Kowalski', 'Kraków'),
        (3, 'Maria', 'Wójcik', 'Gdańsk'),
        (4, 'Tomasz', 'Zieliński', 'Warszawa'),
        (5, 'Julia', 'Kamińska', 'Kraków'),
        (6, 'Marek', 'Lewandowski', 'Wrocław');
      INSERT INTO produkty (id, nazwa, kategoria, cena, stan_magazynowy) VALUES
        (1, 'Klawiatura mechaniczna', 'Akcesoria', 249.99, 14),
        (2, 'Mysz bezprzewodowa', 'Akcesoria', 89.90, 31),
        (3, 'Monitor 27 cali', 'Monitory', 1199.00, 8),
        (4, 'Laptop biurowy', 'Komputery', 2899.00, 5),
        (5, 'Kamera internetowa', 'Akcesoria', 159.00, 22),
        (6, 'Podstawka pod laptopa', 'Akcesoria', 119.00, 0),
        (7, 'Słuchawki USB', 'Audio', 179.00, 18);
      INSERT INTO zamowienia (id, klient_id, data_zamowienia, status) VALUES
        (1, 1, '2026-01-08', 'zrealizowane'),
        (2, 2, '2026-01-14', 'wysłane'),
        (3, 1, '2026-02-02', 'zrealizowane'),
        (4, 3, '2026-02-12', 'nowe'),
        (5, 4, '2026-02-18', 'zrealizowane'),
        (6, 5, '2026-03-01', 'wysłane');
      INSERT INTO pozycje_zamowien (id, zamowienie_id, produkt_id, ilosc, cena_sztukowa) VALUES
        (1, 1, 1, 1, 249.99),
        (2, 1, 2, 1, 89.90),
        (3, 2, 3, 1, 1199.00),
        (4, 3, 4, 1, 2899.00),
        (5, 3, 5, 2, 159.00),
        (6, 4, 2, 2, 89.90),
        (7, 5, 1, 2, 249.99),
        (8, 5, 7, 1, 179.00),
        (9, 6, 3, 1, 1199.00);
    `,
  },
  {
    ...commonDatasetFields,
    id: 'szkola',
    name: 'Szkoła',
    level: 'Rozszerzony',
    summary: 'Uczniowie, klasy i oceny do raportów wielotabelowych.',
    tables: [
      table('klasy', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'symbol', type: 'TEXT', notNull: true },
        { name: 'profil', type: 'TEXT', notNull: true },
        { name: 'rocznik', type: 'INTEGER', notNull: true },
      ]),
      table('uczniowie', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'imie', type: 'TEXT', notNull: true },
        { name: 'nazwisko', type: 'TEXT', notNull: true },
        { name: 'klasa_id', type: 'INTEGER', notNull: true, foreignKey: 'klasy.id' },
      ]),
      table('przedmioty', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'nazwa', type: 'TEXT', notNull: true },
      ]),
      table('nauczyciele', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'imie', type: 'TEXT', notNull: true },
        { name: 'nazwisko', type: 'TEXT', notNull: true },
      ]),
      table('oceny', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'uczen_id', type: 'INTEGER', notNull: true, foreignKey: 'uczniowie.id' },
        { name: 'przedmiot_id', type: 'INTEGER', notNull: true, foreignKey: 'przedmioty.id' },
        { name: 'nauczyciel_id', type: 'INTEGER', notNull: true, foreignKey: 'nauczyciele.id' },
        { name: 'ocena', type: 'INTEGER', notNull: true },
        { name: 'data_wystawienia', type: 'DATE', notNull: true },
      ]),
    ],
    relationships: [
      { from: 'uczniowie.klasa_id', to: 'klasy.id' },
      { from: 'oceny.uczen_id', to: 'uczniowie.id' },
      { from: 'oceny.przedmiot_id', to: 'przedmioty.id' },
      { from: 'oceny.nauczyciel_id', to: 'nauczyciele.id' },
    ],
    seedSql: `
      PRAGMA foreign_keys = ON;
      CREATE TABLE klasy (
        id INTEGER PRIMARY KEY,
        symbol TEXT NOT NULL,
        profil TEXT NOT NULL,
        rocznik INTEGER NOT NULL
      );
      CREATE TABLE uczniowie (
        id INTEGER PRIMARY KEY,
        imie TEXT NOT NULL,
        nazwisko TEXT NOT NULL,
        klasa_id INTEGER NOT NULL,
        FOREIGN KEY (klasa_id) REFERENCES klasy(id)
      );
      CREATE TABLE przedmioty (
        id INTEGER PRIMARY KEY,
        nazwa TEXT NOT NULL
      );
      CREATE TABLE nauczyciele (
        id INTEGER PRIMARY KEY,
        imie TEXT NOT NULL,
        nazwisko TEXT NOT NULL
      );
      CREATE TABLE oceny (
        id INTEGER PRIMARY KEY,
        uczen_id INTEGER NOT NULL,
        przedmiot_id INTEGER NOT NULL,
        nauczyciel_id INTEGER NOT NULL,
        ocena INTEGER NOT NULL,
        data_wystawienia DATE NOT NULL,
        FOREIGN KEY (uczen_id) REFERENCES uczniowie(id),
        FOREIGN KEY (przedmiot_id) REFERENCES przedmioty(id),
        FOREIGN KEY (nauczyciel_id) REFERENCES nauczyciele(id)
      );
      INSERT INTO klasy (id, symbol, profil, rocznik) VALUES
        (1, '3A', 'programistyczny', 2025),
        (2, '3B', 'graficzny', 2025),
        (3, '4A', 'programistyczny', 2024);
      INSERT INTO uczniowie (id, imie, nazwisko, klasa_id) VALUES
        (1, 'Anna', 'Nowak', 1),
        (2, 'Piotr', 'Kowalski', 1),
        (3, 'Maria', 'Wójcik', 2),
        (4, 'Tomasz', 'Zieliński', 2),
        (5, 'Julia', 'Kamińska', 3),
        (6, 'Marek', 'Lewandowski', 3);
      INSERT INTO przedmioty (id, nazwa) VALUES
        (1, 'Bazy danych'),
        (2, 'Programowanie'),
        (3, 'Matematyka'),
        (4, 'Język polski');
      INSERT INTO nauczyciele (id, imie, nazwisko) VALUES
        (1, 'Ewa', 'Kaczmarek'),
        (2, 'Jan', 'Dąbrowski'),
        (3, 'Alicja', 'Mazur');
      INSERT INTO oceny (id, uczen_id, przedmiot_id, nauczyciel_id, ocena, data_wystawienia) VALUES
        (1, 1, 1, 1, 5, '2026-01-10'),
        (2, 1, 2, 2, 4, '2026-01-12'),
        (3, 1, 3, 3, 5, '2026-01-14'),
        (4, 2, 1, 1, 4, '2026-01-10'),
        (5, 2, 2, 2, 3, '2026-01-12'),
        (6, 2, 3, 3, 4, '2026-01-14'),
        (7, 3, 1, 1, 3, '2026-01-11'),
        (8, 3, 2, 2, 4, '2026-01-13'),
        (9, 4, 1, 1, 5, '2026-01-11'),
        (10, 4, 4, 3, 4, '2026-01-15'),
        (11, 5, 1, 1, 5, '2026-02-02'),
        (12, 5, 2, 2, 5, '2026-02-04'),
        (13, 6, 1, 1, 4, '2026-02-02'),
        (14, 6, 3, 3, 4, '2026-02-05');
    `,
  },
  {
    ...commonDatasetFields,
    id: 'kino',
    name: 'Kino',
    level: 'Projektowy',
    summary: 'Repertuar i bilety do raportów z 4–6 powiązanych tabel.',
    tables: [
      table('gatunki', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'nazwa', type: 'TEXT', notNull: true },
      ]),
      table('filmy', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'tytul', type: 'TEXT', notNull: true },
        { name: 'rok', type: 'INTEGER', notNull: true },
        { name: 'czas_min', type: 'INTEGER', notNull: true },
        { name: 'gatunek_id', type: 'INTEGER', notNull: true, foreignKey: 'gatunki.id' },
      ]),
      table('sale', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'numer', type: 'INTEGER', notNull: true },
        { name: 'miejsca', type: 'INTEGER', notNull: true },
      ]),
      table('seanse', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'film_id', type: 'INTEGER', notNull: true, foreignKey: 'filmy.id' },
        { name: 'sala_id', type: 'INTEGER', notNull: true, foreignKey: 'sale.id' },
        { name: 'rozpoczecie', type: 'DATE', notNull: true },
        { name: 'cena', type: 'REAL', notNull: true },
      ]),
      table('klienci', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'imie', type: 'TEXT', notNull: true },
        { name: 'nazwisko', type: 'TEXT', notNull: true },
        { name: 'email', type: 'TEXT', notNull: true },
      ]),
      table('bilety', [
        { name: 'id', type: 'INTEGER', pk: true, notNull: true },
        { name: 'seans_id', type: 'INTEGER', notNull: true, foreignKey: 'seanse.id' },
        { name: 'klient_id', type: 'INTEGER', notNull: true, foreignKey: 'klienci.id' },
        { name: 'miejsce', type: 'TEXT', notNull: true },
        { name: 'status', type: 'TEXT', notNull: true },
      ]),
    ],
    relationships: [
      { from: 'filmy.gatunek_id', to: 'gatunki.id' },
      { from: 'seanse.film_id', to: 'filmy.id' },
      { from: 'seanse.sala_id', to: 'sale.id' },
      { from: 'bilety.seans_id', to: 'seanse.id' },
      { from: 'bilety.klient_id', to: 'klienci.id' },
    ],
    seedSql: `
      PRAGMA foreign_keys = ON;
      CREATE TABLE gatunki (
        id INTEGER PRIMARY KEY,
        nazwa TEXT NOT NULL
      );
      CREATE TABLE filmy (
        id INTEGER PRIMARY KEY,
        tytul TEXT NOT NULL,
        rok INTEGER NOT NULL,
        czas_min INTEGER NOT NULL,
        gatunek_id INTEGER NOT NULL,
        FOREIGN KEY (gatunek_id) REFERENCES gatunki(id)
      );
      CREATE TABLE sale (
        id INTEGER PRIMARY KEY,
        numer INTEGER NOT NULL,
        miejsca INTEGER NOT NULL
      );
      CREATE TABLE seanse (
        id INTEGER PRIMARY KEY,
        film_id INTEGER NOT NULL,
        sala_id INTEGER NOT NULL,
        rozpoczecie DATE NOT NULL,
        cena REAL NOT NULL,
        FOREIGN KEY (film_id) REFERENCES filmy(id),
        FOREIGN KEY (sala_id) REFERENCES sale(id)
      );
      CREATE TABLE klienci (
        id INTEGER PRIMARY KEY,
        imie TEXT NOT NULL,
        nazwisko TEXT NOT NULL,
        email TEXT NOT NULL
      );
      CREATE TABLE bilety (
        id INTEGER PRIMARY KEY,
        seans_id INTEGER NOT NULL,
        klient_id INTEGER NOT NULL,
        miejsce TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (seans_id) REFERENCES seanse(id),
        FOREIGN KEY (klient_id) REFERENCES klienci(id)
      );
      INSERT INTO gatunki (id, nazwa) VALUES
        (1, 'Dramat'),
        (2, 'Komedia'),
        (3, 'Sci-Fi'),
        (4, 'Animacja');
      INSERT INTO filmy (id, tytul, rok, czas_min, gatunek_id) VALUES
        (1, 'Cicha rzeka', 2024, 112, 1),
        (2, 'Weekend w górach', 2025, 98, 2),
        (3, 'Orbita 9', 2026, 126, 3),
        (4, 'Mały robot', 2025, 87, 4),
        (5, 'W drodze', 2026, 104, 1),
        (6, 'Ostatni seans', 2023, 101, 1);
      INSERT INTO sale (id, numer, miejsca) VALUES
        (1, 1, 120),
        (2, 2, 80),
        (3, 3, 60);
      INSERT INTO seanse (id, film_id, sala_id, rozpoczecie, cena) VALUES
        (1, 1, 1, '2026-03-20 18:00', 28.00),
        (2, 2, 2, '2026-03-20 19:30', 24.00),
        (3, 3, 1, '2026-03-21 17:00', 32.00),
        (4, 4, 3, '2026-03-21 12:00', 22.00),
        (5, 1, 2, '2026-03-22 16:00', 26.00),
        (6, 6, 3, '2026-03-22 20:00', 25.00);
      INSERT INTO klienci (id, imie, nazwisko, email) VALUES
        (1, 'Anna', 'Nowak', 'anna@example.com'),
        (2, 'Piotr', 'Kowalski', 'piotr@example.com'),
        (3, 'Maria', 'Wójcik', 'maria@example.com'),
        (4, 'Tomasz', 'Zieliński', 'tomasz@example.com'),
        (5, 'Julia', 'Kamińska', 'julia@example.com');
      INSERT INTO bilety (id, seans_id, klient_id, miejsce, status) VALUES
        (1, 1, 1, 'A10', 'opłacony'),
        (2, 1, 2, 'A11', 'opłacony'),
        (3, 2, 3, 'B05', 'opłacony'),
        (4, 3, 1, 'A01', 'opłacony'),
        (5, 3, 4, 'A02', 'zarezerwowany'),
        (6, 4, 5, 'C12', 'opłacony'),
        (7, 5, 2, 'B10', 'opłacony'),
        (8, 6, 3, 'C01', 'opłacony'),
        (9, 6, 4, 'C02', 'opłacony');
    `,
  },
  {
    ...commonDatasetFields,
    id: 'structure-lab',
    name: 'Laboratorium struktury',
    level: 'DDL',
    summary: 'Pusta baza do tworzenia tabel, kolumn, ograniczeń i relacji.',
    tables: [],
    relationships: [],
    seedSql: '',
  },
];

export const DATASET_MAP = Object.fromEntries(DATASETS.map((dataset) => [dataset.id, dataset]));

export function getDataset(datasetId) {
  return DATASET_MAP[datasetId] ?? DATASETS[0];
}

CREATE DATABASE IF NOT EXISTS inf03_lab
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inf03_lab;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS bilety;
DROP TABLE IF EXISTS seanse;
DROP TABLE IF EXISTS klienci;
DROP TABLE IF EXISTS sale;
DROP TABLE IF EXISTS filmy;
DROP TABLE IF EXISTS gatunki;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE gatunki (
  id INT PRIMARY KEY,
  nazwa VARCHAR(80) NOT NULL
) ENGINE = InnoDB;

CREATE TABLE filmy (
  id INT PRIMARY KEY,
  tytul VARCHAR(160) NOT NULL,
  rok INT NOT NULL,
  czas_min INT NOT NULL,
  gatunek_id INT NOT NULL,
  CONSTRAINT fk_filmy_gatunki FOREIGN KEY (gatunek_id) REFERENCES gatunki(id)
) ENGINE = InnoDB;

CREATE TABLE sale (
  id INT PRIMARY KEY,
  numer INT NOT NULL,
  miejsca INT NOT NULL
) ENGINE = InnoDB;

CREATE TABLE seanse (
  id INT PRIMARY KEY,
  film_id INT NOT NULL,
  sala_id INT NOT NULL,
  rozpoczecie DATETIME NOT NULL,
  cena DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_seanse_filmy FOREIGN KEY (film_id) REFERENCES filmy(id),
  CONSTRAINT fk_seanse_sale FOREIGN KEY (sala_id) REFERENCES sale(id)
) ENGINE = InnoDB;

CREATE TABLE klienci (
  id INT PRIMARY KEY,
  imie VARCHAR(80) NOT NULL,
  nazwisko VARCHAR(100) NOT NULL,
  email VARCHAR(160) NOT NULL
) ENGINE = InnoDB;

CREATE TABLE bilety (
  id INT PRIMARY KEY,
  seans_id INT NOT NULL,
  klient_id INT NOT NULL,
  miejsce VARCHAR(8) NOT NULL,
  status VARCHAR(30) NOT NULL,
  CONSTRAINT fk_bilety_seanse FOREIGN KEY (seans_id) REFERENCES seanse(id),
  CONSTRAINT fk_bilety_klienci FOREIGN KEY (klient_id) REFERENCES klienci(id)
) ENGINE = InnoDB;

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
  (1, 1, 1, '2026-03-20 18:00:00', 28.00),
  (2, 2, 2, '2026-03-20 19:30:00', 24.00),
  (3, 3, 1, '2026-03-21 17:00:00', 32.00),
  (4, 4, 3, '2026-03-21 12:00:00', 22.00),
  (5, 1, 2, '2026-03-22 16:00:00', 26.00),
  (6, 6, 3, '2026-03-22 20:00:00', 25.00);

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

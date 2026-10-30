import { describe, expect, it } from 'vitest';
import { buildMysqlExportScript, escapeMysqlIdentifier, escapeMysqlValue, sanitizeMysqlDatabaseName, sqliteTypeToMysql } from './mysqlExport.js';

describe('escapeMysqlIdentifier', () => {
  it('wraps names in backticks and doubles inner backticks', () => {
    expect(escapeMysqlIdentifier('autorzy')).toBe('`autorzy`');
    expect(escapeMysqlIdentifier('raport`miesiac')).toBe('`raport``miesiac`');
  });
});

describe('escapeMysqlValue', () => {
  it('handles null, numbers, booleans and blobs', () => {
    expect(escapeMysqlValue(null)).toBe('NULL');
    expect(escapeMysqlValue(undefined)).toBe('NULL');
    expect(escapeMysqlValue(29.99)).toBe('29.99');
    expect(escapeMysqlValue(-5)).toBe('-5');
    expect(escapeMysqlValue(true)).toBe('1');
    expect(escapeMysqlValue(Infinity)).toBe('NULL');
    expect(escapeMysqlValue(new Uint8Array([0xde, 0xad]))).toBe("X'dead'");
  });

  it('escapes quotes, backslashes and control characters', () => {
    expect(escapeMysqlValue("Lalka 'cytat'")).toBe("'Lalka ''cytat'''");
    expect(escapeMysqlValue('ścieżka\\tmp')).toBe("'ścieżka\\\\tmp'");
    expect(escapeMysqlValue('linia1\nlinia2')).toBe("'linia1\\nlinia2'");
  });

  it('keeps apostrophes escaped in NO_BACKSLASH_ESCAPES mode', () => {
    const escaped = escapeMysqlValue("x'); DROP TABLE t; --");
    expect(escaped).toBe("'x''); DROP TABLE t; --'");
    expect(escaped).not.toContain("\\'");
  });
});

describe('sqliteTypeToMysql', () => {
  it('maps common SQLite types', () => {
    expect(sqliteTypeToMysql('INTEGER')).toBe('BIGINT');
    expect(sqliteTypeToMysql('TEXT')).toBe('TEXT');
    expect(sqliteTypeToMysql('REAL')).toBe('DOUBLE');
    expect(sqliteTypeToMysql('DATE')).toBe('DATE');
    expect(sqliteTypeToMysql('DATETIME')).toBe('DATETIME');
    expect(sqliteTypeToMysql('')).toBe('TEXT');
    expect(sqliteTypeToMysql('VARCHAR(40)')).toBe('TEXT');
    expect(sqliteTypeToMysql('NUMERIC(8,2)')).toBe('DECIMAL(10,2)');
  });
});

describe('sanitizeMysqlDatabaseName', () => {
  it('replaces unsupported characters and has a fallback', () => {
    expect(sanitizeMysqlDatabaseName('sklep-internetowy')).toBe('sklep_internetowy');
    expect(sanitizeMysqlDatabaseName('moja baza')).toBe('moja_baza');
    expect(sanitizeMysqlDatabaseName('')).toBe('sql_lab_export');
  });
});

describe('buildMysqlExportScript', () => {
  const tables = [
    {
      name: 'autorzy',
      columns: [
        { name: 'id', type: 'INTEGER', primaryKey: true, notNull: true },
        { name: 'imie', type: 'TEXT', notNull: true },
      ],
      foreignKeys: [],
      rows: [[1, 'Adam'], [2, 'Bolesław']],
    },
    {
      name: 'ksiazki',
      columns: [
        { name: 'id', type: 'INTEGER', primaryKey: true, notNull: true },
        { name: 'tytul', type: 'TEXT', notNull: true },
        { name: 'autor_id', type: 'INTEGER', notNull: true },
        { name: 'cena', type: 'REAL', notNull: true },
      ],
      foreignKeys: [{ table: 'autorzy', from: 'autor_id', to: 'id' }],
      rows: [[1, 'Pan Tadeusz', 1, 29.99], [2, "Quo 'vadis'", 2, 34.5]],
    },
    { name: 'pusta', columns: [{ name: 'id', type: 'INTEGER' }], foreignKeys: [], rows: [] },
  ];

  const { sql, databaseName, tableCount, rowCount } = buildMysqlExportScript({ databaseName: 'biblioteka', sourceName: 'Biblioteka', tables });

  it('creates and selects the target database', () => {
    expect(databaseName).toBe('biblioteka');
    expect(sql).toContain('CREATE DATABASE IF NOT EXISTS `biblioteka`');
    expect(sql).toContain('USE `biblioteka`;');
    expect(sql).toContain('utf8mb4');
  });

  it('creates tables with primary keys and foreign keys', () => {
    expect(sql).toContain('CREATE TABLE `autorzy`');
    expect(sql).toContain('`id` BIGINT NOT NULL AUTO_INCREMENT');
    expect(sql).toContain('`imie` TEXT NOT NULL');
    expect(sql).toContain('PRIMARY KEY (`id`)');
    expect(sql).toContain('CONSTRAINT `fk_ksiazki_autor_id` FOREIGN KEY (`autor_id`) REFERENCES `autorzy` (`id`)');
    expect(sql).toContain('ENGINE=InnoDB');
  });

  it('exports all rows with escaped values', () => {
    expect(tableCount).toBe(3);
    expect(rowCount).toBe(4);
    expect(sql).toContain("INSERT INTO `autorzy` (`id`, `imie`) VALUES\n  (1, 'Adam'),\n  (2, 'Bolesław');");
    expect(sql).toContain("(2, 'Quo ''vadis''', 2, 34.5)");
    expect(sql).not.toContain('INSERT INTO `pusta`');
  });

  it('disables foreign key checks during import', () => {
    expect(sql).toContain('SET FOREIGN_KEY_CHECKS = 0;');
    expect(sql).toContain('SET FOREIGN_KEY_CHECKS = 1;');
  });

  it('clears NO_BACKSLASH_ESCAPES for the session so escapes stay valid', () => {
    expect(sql).toContain("SET SESSION sql_mode = REPLACE(@@SESSION.sql_mode, 'NO_BACKSLASH_ESCAPES', '');");
  });

  it('uses parenthesized defaults for TEXT columns', () => {
    const result = buildMysqlExportScript({
      databaseName: 'b',
      tables: [{ name: 't', columns: [{ name: 'status', type: 'TEXT', defaultValue: "'aktywny'" }], foreignKeys: [], rows: [] }],
    });
    expect(result.sql).toContain("`status` TEXT DEFAULT ('aktywny')");
  });

  it('exports unique indexes as UNIQUE KEY', () => {
    const result = buildMysqlExportScript({
      databaseName: 'b',
      tables: [{
        name: 'uzytkownicy',
        columns: [{ name: 'email', type: 'TEXT' }],
        foreignKeys: [],
        uniqueIndexes: [{ name: 'ux_email', columns: ['email'] }],
        rows: [],
      }],
    });
    expect(result.sql).toContain('`email` VARCHAR(255)');
    expect(result.sql).toContain('UNIQUE KEY `ux_email` (`email`)');
  });

  it('uses VARCHAR for TEXT primary keys', () => {
    const result = buildMysqlExportScript({
      databaseName: 'b',
      tables: [{ name: 't', columns: [{ name: 'slug', type: 'TEXT', primaryKey: true }], foreignKeys: [], rows: [] }],
    });
    expect(result.sql).toContain('`slug` VARCHAR(255) NOT NULL');
    expect(result.sql).toContain('PRIMARY KEY (`slug`)');
    expect(result.sql).not.toContain('AUTO_INCREMENT');
  });

  it('sanitizes newlines in table names inside comments', () => {
    const result = buildMysqlExportScript({
      databaseName: 'b',
      tables: [{ name: 'x\nDROP TABLE y;--', columns: [{ name: 'id', type: 'INTEGER' }], foreignKeys: [], rows: [] }],
    });
    expect(result.sql).toContain('-- Tabela: x DROP TABLE y;--');
    expect(result.sql).not.toContain('-- Tabela: x\nDROP');
    expect(result.sql).toContain('CREATE TABLE `x\nDROP TABLE y;--`');
  });

  it('handles an empty database', () => {
    const empty = buildMysqlExportScript({ databaseName: 'structure-lab', tables: [] });
    expect(empty.sql).toContain('CREATE DATABASE IF NOT EXISTS `structure_lab`');
    expect(empty.sql).toContain('nie zawiera tabel');
    expect(empty.tableCount).toBe(0);
  });
});

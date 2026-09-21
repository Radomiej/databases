import { useCallback, useEffect, useRef, useState } from 'react';
import { getDataset } from '../data/datasets.js';
import { createSqliteDatabase, executeSqliteQuery, getSqliteSchema } from '../services/sqliteEngine.js';
import { buildCreateTableSql } from '../services/schemaBuilder.js';
import { applySqliteRelationships } from '../services/sqliteRelations.js';

export function useSqliteDatabase(datasetId, customTables = [], relationships = []) {
  const databaseRef = useRef(null);
  const relationshipsRef = useRef(relationships);
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({ status: 'loading', error: null, schema: [] });

  useEffect(() => {
    relationshipsRef.current = relationships;
  }, [relationships]);

  useEffect(() => {
    let isCurrent = true;
    const dataset = getDataset(datasetId);
    setState({ status: 'loading', error: null, schema: [] });

    if (databaseRef.current) {
      databaseRef.current.destroy();
      databaseRef.current = null;
    }

    createSqliteDatabase(dataset)
      .then((database) => {
        if (!isCurrent) {
          database.destroy();
          return;
        }
        customTables.forEach((customTable) => {
          database.db.run(customTable.sql ?? buildCreateTableSql(customTable));
        });
        const relationshipResult = applySqliteRelationships(database.db, relationshipsRef.current);
        if (!relationshipResult.ok) throw new Error(relationshipResult.message);
        databaseRef.current = database;
        setState({ status: 'ready', error: null, schema: getSqliteSchema(database.db) });
      })
      .catch((error) => {
        if (isCurrent) {
          setState({ status: 'error', error: error instanceof Error ? error.message : String(error), schema: [] });
        }
      });

    return () => {
      isCurrent = false;
      if (databaseRef.current) {
        databaseRef.current.destroy();
        databaseRef.current = null;
      }
    };
  }, [datasetId, reloadToken, customTables]);

  const execute = useCallback((sql) => {
    if (!databaseRef.current) {
      return {
        ok: false,
        errorType: 'loading',
        message: 'Baza danych jest jeszcze przygotowywana.',
        hint: 'Spróbuj ponownie za chwilę.',
      };
    }
    const result = executeSqliteQuery(databaseRef.current.db, sql);
    setState((current) => ({
      ...current,
      schema: getSqliteSchema(databaseRef.current.db),
    }));
    return result;
  }, []);

  const reset = useCallback(() => setReloadToken((token) => token + 1), []);

  const applyRelationships = useCallback((nextRelationships) => {
    if (!databaseRef.current) {
      return {
        ok: false,
        errorType: 'loading',
        message: 'Baza danych jest jeszcze przygotowywana.',
        hint: 'Spróbuj ponownie za chwilę.',
      };
    }
    const result = applySqliteRelationships(databaseRef.current.db, nextRelationships);
    if (result.ok) {
      relationshipsRef.current = nextRelationships;
      setState((current) => ({ ...current, status: 'ready', error: null, schema: getSqliteSchema(databaseRef.current.db) }));
    }
    return result;
  }, []);

  return {
    status: state.status,
    error: state.error,
    schema: state.schema,
    getSchema: () => (databaseRef.current ? getSqliteSchema(databaseRef.current.db) : state.schema),
    execute,
    reset,
    applyRelationships,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { clearExecutionHistory, LEGACY_HISTORY_KEY, loadExecutionHistory, saveExecutionHistory } from '../services/executionHistory.js';

function newestFirst(entries) {
  return entries.sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
}

export function useExecutionHistory() {
  const [history, setHistory] = useState([]);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(Promise.resolve([]));

  useEffect(() => {
    let isCurrent = true;
    readyRef.current = loadExecutionHistory().catch(() => []);
    readyRef.current.then((entries) => {
      if (!isCurrent) return;
      setHistory(entries);
      setReady(true);
    });
    return () => { isCurrent = false; };
  }, []);

  const addHistory = useCallback(async (entry) => {
    await readyRef.current;
    let storedEntry = entry;
    try {
      storedEntry = await saveExecutionHistory(entry);
    } catch {
      // Keep the current session usable when IndexedDB is unavailable.
    }
    setHistory((current) => newestFirst([storedEntry, ...current.filter((item) => item.id !== storedEntry.id)]));
  }, []);

  const clearHistory = useCallback(async () => {
    await readyRef.current;
    let cleared = true;
    try {
      await clearExecutionHistory();
    } catch {
      cleared = false;
    } finally {
      try { globalThis.localStorage?.removeItem(LEGACY_HISTORY_KEY); } catch { /* storage is optional */ }
      setHistory([]);
    }
    return cleared;
  }, []);

  return { history, ready, addHistory, clearHistory };
}

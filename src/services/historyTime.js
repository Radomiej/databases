const relativeFormatter = new Intl.RelativeTimeFormat('pl', { numeric: 'always' });

export function formatRelativeHistoryTime(timestamp, now = new Date()) {
  const elapsedSeconds = Math.floor((now.getTime() - Date.parse(timestamp)) / 1000);
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 60) return 'przed chwilą';
  if (elapsedSeconds < 60 * 60) return relativeFormatter.format(-Math.floor(elapsedSeconds / 60), 'minute');
  if (elapsedSeconds < 60 * 60 * 24) return relativeFormatter.format(-Math.floor(elapsedSeconds / (60 * 60)), 'hour');
  return relativeFormatter.format(-Math.floor(elapsedSeconds / (60 * 60 * 24)), 'day');
}

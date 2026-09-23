export function getTaskSqlDraftKey(lessonId, taskId) {
  return `${lessonId}:${taskId}`;
}

export function getTaskSqlDraft(drafts, lessonId, task, firstTask) {
  const key = getTaskSqlDraftKey(lessonId, task.id);
  if (Object.hasOwn(drafts ?? {}, key)) return drafts[key];
  return task.id === firstTask?.id ? task.solution ?? '' : '';
}

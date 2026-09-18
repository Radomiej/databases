export const LESSON_TOPIC_PLAN = [
  { lessonId: 'select-limit', introduces: ['select', 'from', 'limit'] },
  { lessonId: 'where', introduces: ['where', 'logical-operators'] },
  { lessonId: 'order-by', introduces: ['order-by'] },
  { lessonId: 'like-null', introduces: ['like', 'in', 'between', 'null-checks'] },
  { lessonId: 'aggregates', introduces: ['aggregates', 'aliases'] },
  { lessonId: 'group-by', introduces: ['group-by'] },
  { lessonId: 'having', introduces: ['having'] },
  { lessonId: 'inner-join', introduces: ['inner-join'] },
  { lessonId: 'left-join', introduces: ['left-join'] },
  { lessonId: 'multi-join', introduces: ['multi-join'] },
  { lessonId: 'subqueries', introduces: ['subquery', 'with'] },
  { lessonId: 'final-project', introduces: ['case', 'coalesce'] },
];

const TOPIC_PATTERNS = {
  select: /\bSELECT\b/i,
  from: /\bFROM\b/i,
  limit: /\bLIMIT\b/i,
  offset: /\bOFFSET\b/i,
  distinct: /\bDISTINCT\b/i,
  where: /\bWHERE\b/i,
  'logical-operators': /\b(?:AND|OR)\b/i,
  'order-by': /\bORDER\s+BY\b/i,
  like: /\bLIKE\b/i,
  in: /\bIN\b/i,
  between: /\bBETWEEN\b/i,
  'null-checks': /\bIS\s+(?:NOT\s+)?NULL\b/i,
  aggregates: /\b(?:COUNT|SUM|AVG|MIN|MAX|ROUND)\s*\(/i,
  aliases: /\bAS\b/i,
  'group-by': /\bGROUP\s+BY\b/i,
  having: /\bHAVING\b/i,
  'inner-join': /\b(?:INNER\s+)?JOIN\b/i,
  'left-join': /\bLEFT\s+JOIN\b/i,
  'multi-join': /\bJOIN\b[\s\S]*\bJOIN\b/i,
  subquery: /\(\s*SELECT\b/i,
  with: /\bWITH\b/i,
  case: /\bCASE\b/i,
  coalesce: /\bCOALESCE\s*\(/i,
};

export function getTopicPlan(lessonId) {
  return LESSON_TOPIC_PLAN.find((plan) => plan.lessonId === lessonId);
}

export function topicAppearsInText(topic, text) {
  if (topic === 'inner-join') {
    return /\b(?:INNER\s+)?JOIN\b/i.test(text.replace(/\bLEFT\s+JOIN\b/gi, ''));
  }

  if (topic === 'multi-join') {
    return (text.match(/\bJOIN\b/gi) ?? []).length >= 2;
  }

  return TOPIC_PATTERNS[topic]?.test(text) ?? false;
}

export function getSqlTopics(sql) {
  const topics = new Set();

  Object.keys(TOPIC_PATTERNS).forEach((topic) => {
    if (topicAppearsInText(topic, sql)) {
      topics.add(topic);
    }
  });

  return topics;
}

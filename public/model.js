// Pure revision rules, shared by the app and Node tests. No browser dependencies.
export const TIME_ZONE = 'Europe/London';
export function dayKey(date = new Date()) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = k => p.find(x => x.type === k).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
export function initialState() {
  return { schema: 1, unlocked: [], attempts: [], customQuestions: [], papers: [], paperAttempts: [], timer: null, settings: { cadence: 1, fmOptions: [] } };
}
export function normaliseState(raw = {}) {
  const s = initialState();
  return { ...s, ...raw, settings: { ...s.settings, ...raw.settings } };
}
export const isTopicEligible = (topic, state) => !topic.option || state.settings.fmOptions.includes(topic.option);
export function latestAttempts(state) {
  const map = new Map();
  for (const a of state.attempts) {
    if (!map.has(a.questionId) || a.at >= map.get(a.questionId).at) map.set(a.questionId, a);
  }
  return map;
}
export function mistakes(state, questions) {
  const latest = latestAttempts(state);
  return questions.filter(q => { const a = latest.get(q.id); return a && a.score < a.max; });
}
export function dueQuestions(state, topics, questions, today = dayKey()) {
  const latest = latestAttempts(state);
  return topics.filter(t => state.unlocked.includes(t.id) && isTopicEligible(t, state)).flatMap(t => {
    const attempts = state.attempts.filter(a => a.topicId === t.id);
    const lastDay = attempts.map(a => dayKey(new Date(a.at))).sort().at(-1);
    if (lastDay && daysBetween(lastDay, today) < state.settings.cadence) return [];
    const pool = questions.filter(q => q.topicId === t.id);
    // Least recently attempted first: unseen questions precede repeats.
    pool.sort((a,b) => (latest.get(a.id)?.at || '').localeCompare(latest.get(b.id)?.at || '') || a.id.localeCompare(b.id));
    return pool.slice(0, 1);
  });
}
export function performance(state, predicate, now = new Date()) {
  const recent = state.attempts.filter(a => predicate(a) && daysBetween(dayKey(new Date(a.at)), dayKey(now)) >= 0 && daysBetween(dayKey(new Date(a.at)), dayKey(now)) < 30);
  const max = recent.reduce((n,a) => n + a.max, 0);
  return { count: recent.length, percent: max ? Math.round(recent.reduce((n,a) => n + a.score, 0) / max * 100) : null };
}
export function validOptions(values) {
  const allowed = ['FP1','FP2','FS1','FS2','FM1','FM2','D1','D2'];
  if (!values.length) return true;
  if (values.length !== 2 || new Set(values).size !== 2 || values.some(v => !allowed.includes(v))) return false;
  return values.every(v => v.endsWith('1')) || (values[0].slice(0,-1) === values[1].slice(0,-1) && values[0].at(-1) !== values[1].at(-1));
}
export function safeUrl(raw) {
  try { const u = new URL(raw); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
}
export function validateQuestion(q, topics) {
  if (!q || !topics.some(t => t.id === q.topicId)) throw new Error('Choose a valid topic.');
  if (typeof q.prompt !== 'string' || !q.prompt.trim() || q.prompt.length > 12000) throw new Error('Question text is required (maximum 12,000 characters).');
  if (!Array.isArray(q.steps) || !q.steps.length || q.steps.length > 30 || q.steps.some(s => typeof s !== 'string' || !s.trim() || s.length > 5000)) throw new Error('Add 1–30 mark-scheme steps, one mark per step.');
  if (q.marks !== q.steps.length) throw new Error('The mark total must match the number of mark-scheme steps.');
  if (!Number.isInteger(q.minutes) || q.minutes < 1 || q.minutes > 120) throw new Error('Time must be 1–120 whole minutes.');
  return true;
}

import type { Curriculum, FinalProgress, ProgressV3, ProgressV4, StopProgress, VillageId } from './types';

export const STORAGE_KEY = 'hearth-progress-v4';
const LEGACY_STORAGE_KEY = 'hearth-progress-v3';
export const REVIEW_THRESHOLD = 80;

export const blankStop = (): StopProgress => ({
  challengeAttempts: 0,
  quizBest: 0,
  quizAttempts: 0,
  completedAt: null,
  weakTags: [],
});

const blankFinal = (): FinalProgress => ({ best: 0, attempts: 0, weakTags: [] });

export function newProgress(c: Curriculum): ProgressV4 {
  return {
    version: 4,
    stops: Object.fromEntries(c.stops.map(stop => [stop.id, blankStop()])),
    discoveredToolCards: [],
    finalIncidents: Object.fromEntries(c.villages.map(village => [village.id, blankFinal()])) as Record<VillageId, FinalProgress>,
    lastVillageId: 'foundation',
    updatedAt: new Date().toISOString(),
  };
}

export function completed(stop: StopProgress): boolean {
  return stop.quizAttempts > 0;
}

export function stopsForVillage(c: Curriculum, villageId: VillageId) {
  return c.stops.filter(stop => stop.villageId === villageId).sort((a, b) => a.order - b.order);
}

export function stopUnlocked(c: Curriculum, p: ProgressV4, id: string): boolean {
  const stop = c.stops.find(item => item.id === id);
  return !!stop && !!p.stops[stop.id];
}

export function villageComplete(c: Curriculum, p: ProgressV4, villageId: VillageId): boolean {
  return stopsForVillage(c, villageId).every(stop => completed(p.stops[stop.id]));
}

export const foundationComplete = (c: Curriculum, p: ProgressV4) => villageComplete(c, p, 'foundation');

export function finalUnlocked(c: Curriculum, p: ProgressV4, villageId: VillageId): boolean {
  return villageComplete(c, p, villageId);
}

export function recommended(c: Curriculum, p: ProgressV4, villageId: VillageId = p.lastVillageId): string {
  const next = stopsForVillage(c, villageId).find(stop => stopUnlocked(c, p, stop.id) && !completed(p.stops[stop.id]));
  if (next) return `#/stop/${next.id}`;
  return finalUnlocked(c, p, villageId) ? `#/final/${villageId}` : `#/village/${villageId}`;
}

export function discoverCards(p: ProgressV4, ids: string[]): void {
  p.discoveredToolCards = [...new Set([...p.discoveredToolCards, ...ids])];
  p.updatedAt = new Date().toISOString();
}

export function recordChallengeAttempt(p: ProgressV4, stopId: string, weakTags: string[] = []): void {
  const stop = p.stops[stopId];
  stop.challengeAttempts = Math.min(100000, stop.challengeAttempts + 1);
  stop.weakTags = [...new Set([...stop.weakTags, ...weakTags])].slice(-40);
  p.updatedAt = new Date().toISOString();
}

export function recordQuiz(p: ProgressV4, stopId: string, score: number, weakTags: string[]): void {
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error('Invalid quiz score.');
  const stop = p.stops[stopId];
  stop.quizBest = Math.max(stop.quizBest, score);
  stop.quizAttempts = Math.min(100000, stop.quizAttempts + 1);
  stop.completedAt ??= new Date().toISOString();
  stop.weakTags = [...new Set([...stop.weakTags, ...weakTags])].slice(-40);
  p.updatedAt = new Date().toISOString();
}

export function recordFinal(p: ProgressV4, villageId: VillageId, score: number, weakTags: string[]): void {
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error('Invalid final score.');
  const incident = p.finalIncidents[villageId];
  incident.best = Math.max(incident.best, score);
  incident.attempts = Math.min(100000, incident.attempts + 1);
  incident.weakTags = [...new Set(weakTags)].slice(-40);
  p.updatedAt = new Date().toISOString();
}

function object(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}
const integer = (v: unknown, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;
const tags = (v: unknown) => Array.isArray(v) && v.length <= 40 && v.every(t => typeof t === 'string' && t.length <= 150);

function validStopProgress(raw: unknown): raw is StopProgress {
  if (!object(raw)) return false;
  if (!integer(raw.challengeAttempts, 100000) || !integer(raw.quizBest, 100) || !integer(raw.quizAttempts, 100000)) return false;
  if (raw.quizAttempts === 0 && raw.quizBest !== 0) return false;
  if (!(raw.completedAt === null || typeof raw.completedAt === 'string' && raw.completedAt.length <= 40 && Number.isFinite(Date.parse(raw.completedAt)))) return false;
  if (raw.quizAttempts === 0 && raw.completedAt !== null) return false;
  return tags(raw.weakTags);
}

function validFinal(raw: unknown): raw is FinalProgress {
  return object(raw) && integer(raw.best, 100) && integer(raw.attempts, 100000) && tags(raw.weakTags) && (raw.attempts > 0 || raw.best === 0);
}

function readStopProgress(raw: unknown): StopProgress | null {
  if (!validStopProgress(raw)) return null;
  return {
    challengeAttempts: raw.challengeAttempts,
    quizBest: raw.quizBest,
    quizAttempts: raw.quizAttempts,
    completedAt: raw.completedAt,
    weakTags: [...raw.weakTags],
  };
}

function readFinal(raw: unknown): FinalProgress | null {
  if (!validFinal(raw)) return null;
  return { best: raw.best, attempts: raw.attempts, weakTags: [...raw.weakTags] };
}

/**
 * Accepts a v4 snapshot even when the curriculum has gained or lost stops,
 * villages, or tool cards. Known scores are copied onto a clean ProgressV4;
 * missing keys start blank. Present-but-corrupt stop/final records still fail.
 */
export function validateProgress(value: unknown, c: Curriculum): ProgressV4 {
  const fail = () => { throw new Error('Backup is invalid or uses a different curriculum version. Current progress was kept.'); };
  if (!object(value) || value.version !== 4 || !object(value.stops)) return fail();
  if (value.discoveredToolCards !== undefined && !Array.isArray(value.discoveredToolCards)) return fail();
  if (value.finalIncidents !== undefined && !object(value.finalIncidents)) return fail();

  const next = newProgress(c);
  for (const stop of c.stops) {
    if (!Object.hasOwn(value.stops, stop.id)) continue;
    const parsed = readStopProgress(value.stops[stop.id]);
    if (!parsed) return fail();
    next.stops[stop.id] = parsed;
  }

  const cards = Array.isArray(value.discoveredToolCards) ? value.discoveredToolCards : [];
  next.discoveredToolCards = [...new Set(cards.filter((id): id is string => typeof id === 'string' && c.toolCards.some(card => card.id === id)))];

  const incidents = object(value.finalIncidents) ? value.finalIncidents : {};
  for (const village of c.villages) {
    if (!Object.hasOwn(incidents, village.id)) continue;
    const parsed = readFinal(incidents[village.id]);
    if (!parsed) return fail();
    next.finalIncidents[village.id] = parsed;
  }

  if (c.villages.some(village => village.id === value.lastVillageId)) {
    next.lastVillageId = value.lastVillageId as VillageId;
  }
  if (typeof value.updatedAt === 'string' && value.updatedAt.length <= 40 && Number.isFinite(Date.parse(value.updatedAt))) {
    next.updatedAt = value.updatedAt;
  }
  return next;
}

export function parseBackup(text: string, c: Curriculum): ProgressV4 {
  if (text.length > 500000) throw new Error('Backup is larger than 500 KB.');
  try {
    return validateProgress(JSON.parse(text), c);
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('The selected file is not valid JSON.');
    throw error;
  }
}

function migrateV3(raw: unknown, c: Curriculum): ProgressV4 | null {
  if (!object(raw) || raw.version !== 3 || !object(raw.stops) || !Array.isArray(raw.discoveredToolCards)) return null;
  const next = newProgress(c);
  for (const stop of stopsForVillage(c, 'foundation')) {
    const parsed = readStopProgress(raw.stops[stop.id]);
    if (parsed) next.stops[stop.id] = parsed;
  }
  next.discoveredToolCards = raw.discoveredToolCards.filter(id => typeof id === 'string' && c.toolCards.some(card => card.id === id));
  const foundationFinal = readFinal((raw as ProgressV3).finalIncident);
  if (foundationFinal) next.finalIncidents.foundation = foundationFinal;
  next.updatedAt = new Date().toISOString();
  return next;
}

export function loadProgress(storage: Pick<Storage, 'getItem'>, c: Curriculum): { progress: ProgressV4; warning: string } {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved) return { progress: parseBackup(saved, c), warning: '' };
    const migrated = migrateV3(JSON.parse(storage.getItem(LEGACY_STORAGE_KEY) || 'null'), c);
    return migrated ? { progress: migrated, warning: '' } : { progress: newProgress(c), warning: '' };
  } catch {
    return { progress: newProgress(c), warning: 'Saved progress could not be read. A fresh local journey was started.' };
  }
}

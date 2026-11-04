import { test } from 'node:test';
import assert from 'node:assert/strict';
import { curriculum } from './curriculum';
import {
  STORAGE_KEY,
  loadProgress,
  newProgress,
  parseBackup,
  recordFinal,
  recordQuiz,
  validateProgress,
} from './progress';

function snapshot(progress = newProgress(curriculum)) {
  return JSON.parse(JSON.stringify(progress)) as Record<string, unknown>;
}

test('exact current-curriculum snapshot round-trips scores', () => {
  const progress = newProgress(curriculum);
  recordQuiz(progress, 'town-square', 80, ['request-journey']);
  recordFinal(progress, 'foundation', 75, ['idempotency']);
  progress.discoveredToolCards = ['request-journey'];
  const loaded = validateProgress(JSON.parse(JSON.stringify(progress)), curriculum);
  assert.equal(loaded.stops['town-square'].quizBest, 80);
  assert.equal(loaded.stops['town-square'].quizAttempts, 1);
  assert.equal(loaded.finalIncidents.foundation.best, 75);
  assert.deepEqual(loaded.discoveredToolCards, ['request-journey']);
});

test('adding a new stop does not wipe completed quiz scores', () => {
  const progress = newProgress(curriculum);
  recordQuiz(progress, 'town-square', 100, []);
  const raw = snapshot(progress);
  delete (raw.stops as Record<string, unknown>)['partition-observatory'];
  const loaded = validateProgress(raw, curriculum);
  assert.equal(loaded.stops['town-square'].quizBest, 100);
  assert.equal(loaded.stops['partition-observatory'].quizAttempts, 0);
});

test('retired stop ids and extra root fields are ignored', () => {
  const progress = newProgress(curriculum);
  recordQuiz(progress, 'town-square', 60, []);
  const raw = snapshot(progress);
  (raw.stops as Record<string, unknown>)['legacy-module'] = {
    challengeAttempts: 1,
    quizBest: 40,
    quizAttempts: 1,
    completedAt: '2026-01-01T00:00:00.000Z',
    weakTags: [],
  };
  raw.experimentalFlag = true;
  const loaded = validateProgress(raw, curriculum);
  assert.equal(loaded.stops['town-square'].quizBest, 60);
  assert.equal('experimentalFlag' in loaded, false);
  assert.equal((loaded.stops as Record<string, unknown>)['legacy-module'], undefined);
});

test('unknown tool cards are dropped instead of discarding the backup', () => {
  const progress = newProgress(curriculum);
  recordQuiz(progress, 'signal-gate', 80, []);
  progress.discoveredToolCards = ['curl-probe', 'retired-card'];
  const loaded = validateProgress(JSON.parse(JSON.stringify(progress)), curriculum);
  assert.deepEqual(loaded.discoveredToolCards, ['curl-probe']);
  assert.equal(loaded.stops['signal-gate'].quizBest, 80);
});

test('a new village with no finalIncident key still loads foundation scores', () => {
  const progress = newProgress(curriculum);
  recordFinal(progress, 'foundation', 90, []);
  const raw = snapshot(progress);
  delete (raw.finalIncidents as Record<string, unknown>)['distributed-highlands'];
  const loaded = validateProgress(raw, curriculum);
  assert.equal(loaded.finalIncidents.foundation.best, 90);
  assert.equal(loaded.finalIncidents['distributed-highlands'].attempts, 0);
});

test('extra fields on a stop record are stripped but scores kept', () => {
  const progress = newProgress(curriculum);
  recordQuiz(progress, 'town-square', 80, []);
  const raw = snapshot(progress);
  (raw.stops as Record<string, Record<string, unknown>>)['town-square'].note = 'ignore';
  const loaded = validateProgress(raw, curriculum);
  assert.equal(loaded.stops['town-square'].quizBest, 80);
  assert.equal('note' in loaded.stops['town-square'], false);
});

test('corrupt scores still reject the backup', () => {
  const raw = snapshot();
  (raw.stops as Record<string, Record<string, unknown>>)['town-square'].quizBest = 101;
  assert.throws(() => validateProgress(raw, curriculum), /Backup is invalid/);
  assert.throws(() => parseBackup('{not json', curriculum), /not valid JSON/);
});

test('loadProgress keeps scores when localStorage predates a curriculum stop', () => {
  const progress = newProgress(curriculum);
  recordQuiz(progress, 'town-square', 100, []);
  const raw = snapshot(progress);
  delete (raw.stops as Record<string, unknown>)['cache-bazaar'];
  const loaded = loadProgress(
    { getItem: key => (key === STORAGE_KEY ? JSON.stringify(raw) : null) },
    curriculum,
  );
  assert.equal(loaded.warning, '');
  assert.equal(loaded.progress.stops['town-square'].quizBest, 100);
  assert.equal(loaded.progress.stops['cache-bazaar'].quizAttempts, 0);
});

test('unreadable localStorage still starts a blank journey', () => {
  const loaded = loadProgress({ getItem: () => '{bad' }, curriculum);
  assert.ok(loaded.warning);
  assert.equal(loaded.progress.stops['town-square'].quizAttempts, 0);
});

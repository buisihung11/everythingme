import { test } from 'node:test';
import assert from 'node:assert/strict';
import { curriculum } from './curriculum';
import {
  completed,
  discoverCards,
  finalUnlocked,
  foundationComplete,
  loadProgress,
  newProgress,
  parseBackup,
  recommended,
  recordChallengeAttempt,
  recordFinal,
  recordQuiz,
  stopsForVillage,
  validateProgress,
} from './progress';
import type { ProgressV4 } from './types';

function completeStop(p: ProgressV4, stopId: string, score = 80) {
  recordQuiz(p, stopId, score, []);
}

test('completed is true after at least one quiz attempt', () => {
  const progress = newProgress(curriculum);
  const stopId = 'town-square';
  assert.equal(completed(progress.stops[stopId]), false);
  recordQuiz(progress, stopId, 60, ['tag']);
  assert.equal(completed(progress.stops[stopId]), true);
});

test('recordQuiz keeps best score, counts attempts, and rejects invalid scores', () => {
  const progress = newProgress(curriculum);
  recordQuiz(progress, 'town-square', 70, ['a']);
  recordQuiz(progress, 'town-square', 40, ['b']);
  assert.equal(progress.stops['town-square'].quizBest, 70);
  assert.equal(progress.stops['town-square'].quizAttempts, 2);
  assert.throws(() => recordQuiz(progress, 'town-square', 101, []), /Invalid quiz score/);
  assert.throws(() => recordQuiz(progress, 'town-square', 50.5, []), /Invalid quiz score/);
});

test('recordFinal keeps best score and rejects invalid scores', () => {
  const progress = newProgress(curriculum);
  recordFinal(progress, 'foundation', 60, ['a']);
  recordFinal(progress, 'foundation', 90, ['b']);
  assert.equal(progress.finalIncidents.foundation.best, 90);
  assert.equal(progress.finalIncidents.foundation.attempts, 2);
  assert.throws(() => recordFinal(progress, 'foundation', -1, []), /Invalid final score/);
});

test('recommended routes to next incomplete stop then optional final', () => {
  const progress = newProgress(curriculum);
  assert.equal(recommended(curriculum, progress, 'foundation'), '#/stop/town-square');
  completeStop(progress, 'town-square');
  assert.equal(recommended(curriculum, progress, 'foundation'), '#/stop/signal-gate');
  for (const stop of stopsForVillage(curriculum, 'foundation')) {
    completeStop(progress, stop.id);
  }
  assert.equal(recommended(curriculum, progress, 'foundation'), '#/final/foundation');
});

test('final unlocks only after every stop quiz in a village is submitted once', () => {
  const progress = newProgress(curriculum);
  assert.equal(finalUnlocked(curriculum, progress, 'foundation'), false);
  for (const stop of stopsForVillage(curriculum, 'foundation')) {
    completeStop(progress, stop.id);
  }
  assert.equal(finalUnlocked(curriculum, progress, 'foundation'), true);
  assert.equal(foundationComplete(curriculum, progress), true);
});

test('recordChallengeAttempt accumulates attempts and weak tags', () => {
  const progress = newProgress(curriculum);
  recordChallengeAttempt(progress, 'town-square', ['a']);
  recordChallengeAttempt(progress, 'town-square', ['b', 'a']);
  assert.equal(progress.stops['town-square'].challengeAttempts, 2);
  assert.deepEqual(progress.stops['town-square'].weakTags, ['a', 'b']);
});

test('discoverCards deduplicates tool card ids', () => {
  const progress = newProgress(curriculum);
  discoverCards(progress, ['request-journey', 'sequence-diagram']);
  discoverCards(progress, ['sequence-diagram', 'browser-network']);
  assert.deepEqual(progress.discoveredToolCards, ['request-journey', 'sequence-diagram', 'browser-network']);
});

test('import rejects invalid schema without mutating caller state', () => {
  const original = newProgress(curriculum);
  const before = JSON.stringify(original);
  const bad: unknown[] = [
    null,
    [],
    { ...original, version: 3 },
    { ...original, version: 5 },
    JSON.parse('{"__proto__":{"polluted":true}}'),
  ];
  for (const mutate of [
    (progress: ProgressV4) => { progress.stops['unknown'] = progress.stops['town-square']; },
    (progress: ProgressV4) => { progress.stops['town-square'].quizBest = 101; },
    (progress: ProgressV4) => { progress.stops['town-square'].quizAttempts = -1; },
    (progress: ProgressV4) => { progress.finalIncidents.foundation.best = 150; },
  ]) {
    const clone = structuredClone(original);
    mutate(clone);
    bad.push(clone);
  }
  for (const value of bad) {
    assert.throws(() => validateProgress(value, curriculum));
  }
  assert.throws(() => parseBackup('not json', curriculum));
  assert.throws(() => parseBackup(' '.repeat(500001), curriculum));
  assert.equal(JSON.stringify(original), before);
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});

test('valid progress round-trips through validateProgress', () => {
  const progress = newProgress(curriculum);
  completeStop(progress, 'town-square', 88);
  recordFinal(progress, 'foundation', 75, ['cache-aside']);
  const restored = validateProgress(JSON.parse(JSON.stringify(progress)), curriculum);
  assert.deepEqual(restored, progress);
});

test('corrupt saved data produces warning and fresh progress', () => {
  const loaded = loadProgress({ getItem: () => '{bad' }, curriculum);
  assert.ok(loaded.warning);
  assert.equal(loaded.progress.version, 4);
});

test('v3 progress migrates foundation stops on first load', () => {
  const legacy = {
    version: 3,
    stops: {
      'town-square': {
        challengeAttempts: 1,
        quizBest: 90,
        quizAttempts: 1,
        completedAt: new Date().toISOString(),
        weakTags: ['request-journey'],
      },
    },
    discoveredToolCards: ['request-journey'],
    finalIncident: { best: 75, attempts: 1, weakTags: [] },
    updatedAt: new Date().toISOString(),
  };
  const loaded = loadProgress({
    getItem: key => key === 'hearth-progress-v3' ? JSON.stringify(legacy) : null,
  }, curriculum);
  assert.equal(loaded.warning, '');
  assert.equal(loaded.progress.stops['town-square'].quizBest, 90);
  assert.equal(loaded.progress.discoveredToolCards.includes('request-journey'), true);
  assert.equal(loaded.progress.finalIncidents.foundation.best, 75);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  curriculum,
  finalIncidentByVillage,
  stopById,
  stops,
  toolCardById,
  toolCards,
  villageById,
  villages,
} from './curriculum';

test('curriculum exports v4 structure with two villages and nine journey stops', () => {
  assert.equal(curriculum.version, 4);
  assert.equal(villages.length, 2);
  assert.equal(stops.length, 9);
  assert.deepEqual(villages.map(village => village.id), ['foundation', 'distributed-highlands']);
  assert.equal(foundationStops().length, 5);
  assert.equal(highlandStops().length, 4);
});

test('village stop lists match journey stops and final incidents exist for each village', () => {
  for (const village of villages) {
    assert.strictEqual(villageById(village.id), village);
    assert.deepEqual(village.stopIds, stops.filter(stop => stop.villageId === village.id).map(stop => stop.id));
    assert.equal(finalIncidentByVillage(village.id).villageId, village.id);
  }
});

test('lookups reject unknown ids and accept every curriculum id', () => {
  for (const stop of stops) assert.strictEqual(stopById(stop.id), stop);
  for (const card of toolCards) assert.strictEqual(toolCardById(card.id), card);
  for (const id of ['', 'missing', '__proto__', 'constructor']) {
    assert.throws(() => stopById(id), /Unknown journey stop/);
    assert.throws(() => villageById(id), /Unknown village/);
    assert.throws(() => toolCardById(id), /Unknown tool card/);
  }
});

test('prerequisites form an ordered chain inside each village', () => {
  const seen = new Set<string>();
  for (const stop of stops.filter(item => item.villageId === 'foundation').sort((a, b) => a.order - b.order)) {
    for (const prerequisite of stop.prerequisites) assert.ok(seen.has(prerequisite), `${stop.id}: ${prerequisite}`);
    seen.add(stop.id);
  }
});

test('every stop references valid tool cards and well-formed quizzes', () => {
  for (const stop of stops) {
    assert.ok(stop.quiz.length >= 3, stop.id);
    for (const cardId of stop.toolCardIds) assert.ok(toolCards.some(card => card.id === cardId), `${stop.id}: ${cardId}`);
    for (const question of stop.quiz) {
      assert.ok(question.answer >= 0 && question.answer < question.options.length, `${stop.id}:${question.id}`);
      assert.ok(question.options.includes(question.options[question.answer]), `${stop.id}:${question.id}`);
    }
    assert.ok(stop.challenge.kind.length > 0, stop.id);
  }
});

function foundationStops() {
  return stops.filter(stop => stop.villageId === 'foundation');
}

function highlandStops() {
  return stops.filter(stop => stop.villageId === 'distributed-highlands');
}

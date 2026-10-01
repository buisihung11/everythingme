import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute } from './router';

test('hash route preserves village, stop, and final boundaries', () => {
  assert.deepEqual(parseRoute('#/village/foundation'), { kind: 'village', villageId: 'foundation' });
  assert.deepEqual(parseRoute('#/village/distributed-highlands'), { kind: 'village', villageId: 'distributed-highlands' });
  assert.deepEqual(parseRoute('#/stop/town-square'), { kind: 'stop', stopId: 'town-square' });
  assert.deepEqual(parseRoute('#/final/foundation'), { kind: 'final', villageId: 'foundation' });
  assert.deepEqual(parseRoute('#/final/distributed-highlands'), { kind: 'final', villageId: 'distributed-highlands' });
});

test('unknown or malformed routes fall back to foundation village', () => {
  assert.deepEqual(parseRoute(''), { kind: 'village', villageId: 'foundation' });
  assert.deepEqual(parseRoute('#/wat'), { kind: 'village', villageId: 'foundation' });
  assert.deepEqual(parseRoute('#/village/unknown'), { kind: 'village', villageId: 'foundation' });
  assert.deepEqual(parseRoute('#/stop'), { kind: 'village', villageId: 'foundation' });
});

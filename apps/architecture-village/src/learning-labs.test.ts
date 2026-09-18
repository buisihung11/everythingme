import { test } from 'node:test';
import assert from 'node:assert/strict';
import { learningLabs, ringOwner } from './learning-labs';

test('hash ring moves only keys in the added node interval', () => {
  const old = [0, 120, 240];
  const next = [0, 60, 120, 240];
  for (let key = 0; key < 360; key++) {
    const before = ringOwner(key, old);
    const after = ringOwner(key, next);
    assert.equal(after !== before, key > 0 && key <= 60);
  }
});

test('every legacy lab exposes an achievable mission with bounded controls', () => {
  for (const [id, lab] of Object.entries(learningLabs)) {
    let possible = false;
    for (let mode = 0; mode < lab.modes.length; mode++) {
      for (const value of [lab.min, lab.max, lab.initial, 10, 15, 20, 30, 60, 80, 150, 10000].filter(v => v >= lab.min && v <= lab.max)) {
        const result = lab.run(value, mode);
        assert.ok(result.headline && result.explanation && result.nodes.length, id);
        if (result.goal) possible = true;
      }
    }
    assert.ok(possible, `Mission impossible: ${id}`);
  }
});

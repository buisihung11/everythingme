import { test } from 'node:test';
import assert from 'node:assert/strict';
import { curriculum, modules, villages, moduleById, villageById } from './curriculum';
import type { Encounter, Metrics } from './types';

const expected = [
  ['intro', 'System Design Interview'], ['delivery', 'Delivery Framework'],
  ['networking', 'Networking Essentials'], ['api', 'API Design'], ['data-modeling', 'Data Modeling'],
  ['caching', 'Caching'], ['sharding', 'Sharding'], ['hashing', 'Consistent Hashing'],
  ['cap', 'CAP Theorem'], ['indexing', 'Database Indexing'], ['numbers', 'Numbers to Know'],
];
const keys = ['latency', 'availability', 'consistency', 'throughput', 'complexity'] as const;
const encounters = [...modules.map(module => module.encounter), ...villages.map(village => village.boss)];

test('Hearth exports the exact plan, stable aliases, and safe lookups', () => {
  assert.equal(curriculum.version, 2);
  assert.strictEqual(modules, curriculum.modules);
  assert.strictEqual(villages, curriculum.villages);
  assert.deepEqual(modules.map(module => [module.id, module.title]), expected);
  assert.deepEqual(villages.map(village => [village.id, village.moduleIds]), [
    ['departure', ['intro', 'delivery']], ['signals', ['networking', 'api', 'data-modeling']],
    ['scale', ['caching', 'sharding', 'hashing', 'cap', 'indexing', 'numbers']],
  ]);
  for (const module of modules) assert.strictEqual(moduleById(module.id), module);
  for (const village of villages) {
    assert.strictEqual(villageById(village.id), village);
    for (const id of village.moduleIds) assert.equal(moduleById(id).villageId, village.id);
  }
  for (const id of ['', 'missing', '__proto__', 'constructor']) {
    assert.throws(() => moduleById(id), /Unknown learning module/);
    assert.throws(() => villageById(id), /Unknown village/);
  }
});

test('modules have world coordinates, distinct friendly guardians, and ordered prerequisites', () => {
  assert.equal(new Set(modules.map(module => module.position.join(','))).size, 11);
  assert.equal(new Set(modules.map(module => module.spirit)).size, 11);
  assert.equal(new Set(modules.map(module => module.place)).size, 11);
  const seen = new Set<string>();
  for (const module of modules) {
    const [x, z] = module.position;
    assert.ok(Number.isFinite(x) && x >= -8 && x <= 8, module.id);
    assert.ok(Number.isFinite(z) && z >= -6 && z <= 5, module.id);
    assert.ok(module.duration >= 15 && module.duration <= 20, module.id);
    assert.ok(module.objectives.length >= 3);
    assert.notEqual(module.spirit, module.encounter.name);
    assert.notEqual(module.place, module.title);
    for (const prerequisite of module.prerequisites) assert.ok(seen.has(prerequisite), `${module.id}: ${prerequisite}`);
    seen.add(module.id);
  }
});

test('all lessons have substantial original Vietnamese content and reviewed public source URLs', () => {
  const titles = new Set<string>();
  for (const module of modules) {
    const url = new URL(module.source);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'www.hellointerview.com');
    assert.ok(url.pathname.startsWith('/learn/system-design/'));
    assert.equal(url.search, '');
    assert.ok(module.sections.length >= 3 && module.sections.length <= 5, module.id);
    for (const section of module.sections) {
      assert.ok(!titles.has(section.title), section.title);
      titles.add(section.title);
      assert.ok(section.body.length >= 180, `${module.id}: body`);
      assert.ok(section.example.length >= 150, `${module.id}: example`);
      assert.ok(section.takeaway.length >= 30, `${module.id}: takeaway`);
      assert.match(section.body + section.example, /[ăâđêôơư]/i);
      assert.doesNotMatch(JSON.stringify(section), /\b(?:TODO|TBD|lorem ipsum)\b/i);
    }
  }
  assert.ok(moduleById('indexing').source.endsWith('/db-indexing'));
});

test('named topics are actually taught in sections, not only in encounter metadata', () => {
  const coverage: Record<string, RegExp[]> = {
    intro: [/Product system design/i, /infrastructure design/i, /yêu cầu/i, /đánh đổi/i, /Problem Navigation/, /Solution Design/, /Technical Excellence/, /Communication and Collaboration/],
    delivery: [/thực thể/i, /giao diện/i, /thiết kế tổng thể/i, /đào sâu/i],
    networking: [/DNS/, /TCP/, /UDP/, /TLS/, /QUIC/, /L4/, /L7/, /SSE/, /WebSocket/, /gRPC/, /Short polling/i, /Long polling/i, /retry/i],
    api: [/REST/, /GraphQL/, /gRPC/, /Idempotency/i, /Cursor/i, /phân quyền/i, /phiên bản/i],
    'data-modeling': [/quan hệ/i, /tài liệu/i, /key-value/i, /wide-column/i, /graph/i, /chuẩn hóa/i, /giao dịch/i],
    caching: [/cache-aside/i, /read-through/i, /write-through/i, /write-behind/i, /TTL/, /LRU/, /LFU/, /single-flight/i, /hot key/i, /CDN/],
    sharding: [/replication/i, /directory-based/i, /shard key/i, /khoảng/i, /hash/i, /di chuyển/i],
    hashing: [/modulo/i, /kim đồng hồ/i, /virtual node/i, /miền lỗi/i, /hot key/i],
    cap: [/partition/i, /tuyến tính/i, /Availability/, /ACID/, /PACELC/],
    indexing: [/B-tree/, /Hash index/i, /Inverted index/i, /geospatial/i, /Composite index/i, /Covering index/i, /EXPLAIN/],
    numbers: [/86.400/, /QPS/, /p99/, /Little/, /replica/i, /băng thông/i, /benchmark/i],
  };
  for (const [id, patterns] of Object.entries(coverage)) {
    const lesson = moduleById(id).sections.map(section => `${section.body} ${section.example}`).join('\n');
    for (const pattern of patterns) assert.match(lesson, pattern, `${id}: ${pattern}`);
  }
});

test('55 distinct MCQs have four meaningful alternatives, explanations and distributed answers', () => {
  const questions = modules.flatMap(module => module.quiz);
  assert.equal(questions.length, 55);
  assert.equal(new Set(questions.map(question => question.id)).size, 55);
  assert.equal(new Set(questions.map(question => question.prompt)).size, 55);
  for (const module of modules) {
    assert.equal(module.quiz.length, 5);
    assert.ok(new Set(module.quiz.map(question => question.answer)).size >= 3);
    for (const question of module.quiz) {
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4);
      assert.ok(question.prompt.trim(), `${question.id}: missing prompt`);
      assert.ok(question.options.every(option => option.trim()), `${question.id}: empty alternative`);
      assert.ok(question.explanation.trim(), `${question.id}: missing explanation`);
      assert.ok(!question.options.includes(question.explanation), `${question.id}: explanation must add reasoning beyond repeating an option`);
      assert.doesNotMatch([question.prompt, ...question.options, question.explanation].join(' '), /\b(?:TODO|TBD|lorem ipsum)\b/i);
      assert.ok(question.tag.length > 2);
    }
  }
});

function verifyTree(encounter: Encounter, expectedTurns: number) {
  const byId = new Map(encounter.nodes.map(node => [node.id, node]));
  assert.equal(byId.size, encounter.nodes.length, 'unique node IDs');
  const visited = new Set<string>();
  const choiceIds = new Set<string>();
  let leaves = 0;
  const walk = (id: string, depth: number, state: Metrics, ancestors: Set<string>) => {
    assert.ok(!ancestors.has(id), `${encounter.id}: cycle at ${id}`);
    const node = byId.get(id);
    assert.ok(node, `${encounter.id}: dangling target ${id}`);
    visited.add(id);
    assert.equal(node.choices.length, 2);
    assert.equal(node.choices.filter(choice => choice.correct).length, 1);
    assert.match(node.context, /Giả định mô phỏng/);
    for (const key of keys) assert.ok(node.context.includes(`${key}=${state[key]}`), `${node.id}: ${key} state missing`);
    if (depth > 1) assert.match(node.context, /Lịch sử quyết định/);
    const good = node.choices.find(choice => choice.correct)!;
    const bad = node.choices.find(choice => !choice.correct)!;
    assert.notDeepEqual(good.effects, bad.effects);
    if (depth < expectedTurns) {
      assert.notEqual(good.next, bad.next, 'a mistake must branch to a different variant');
      const recovery = byId.get(bad.next!)!;
      assert.match(recovery.prompt, /Phục hồi/);
      assert.match(recovery.context, /Cần phục hồi/);
      assert.notEqual(recovery.prompt, byId.get(good.next!)!.prompt);
      assert.ok(recovery.context.includes(bad.feedback), 'branch retains the actual prior consequence');
      assert.ok(recovery.choices.some(choice => choice.correct && choice.label.startsWith('Phục hồi (')));
    }
    for (const choice of node.choices) {
      assert.ok(!choiceIds.has(choice.id), 'unique choice IDs');
      choiceIds.add(choice.id);
      assert.ok(choice.label.length >= 15 && choice.feedback.length > 60);
      assert.ok(choice.tags.length > 0);
      assert.ok(Object.keys(choice.effects).length > 0);
      assert.ok(Object.entries(choice.effects).every(([key, value]) => keys.includes(key as typeof keys[number]) && Number.isFinite(value) && Math.abs(value) <= 15));
      assert.ok(Object.values(choice.effects).some(value => value !== 0));
      const after = { ...state };
      for (const key of keys) {
        after[key] = Math.max(0, Math.min(100, state[key] + (choice.effects[key] ?? 0)));
        assert.ok(choice.feedback.includes(`${key}=${after[key]}`), 'feedback reflects the selected effect');
      }
      assert.ok(Object.hasOwn(choice, 'next'), 'every choice explicitly declares next');
      if (choice.next === null) {
        assert.equal(depth, expectedTurns, `${encounter.id}: premature or late ending`);
        assert.match(choice.feedback, /Kết thúc/);
        leaves++;
      } else {
        assert.ok(depth < expectedTurns, `${encounter.id}: too many turns`);
        walk(choice.next, depth + 1, after, new Set([...ancestors, id]));
      }
    }
  };
  for (const key of keys) assert.ok(encounter.initial[key] >= 0 && encounter.initial[key] <= 100);
  assert.match(encounter.intro, /Giả định/);
  assert.match(encounter.intro, /không phải ms, QPS/);
  assert.ok(encounter.reflectionPrompt.length > 50);
  walk(encounter.start, 1, encounter.initial, new Set());
  assert.equal(visited.size, encounter.nodes.length, 'no unreachable nodes');
  assert.equal(leaves, 2 ** expectedTurns, 'every decision history ends at the prescribed depth');
}

test('all 184 encounter/boss paths terminate at exactly 3/5 turns with coherent state', () => {
  assert.equal(encounters.length, 14);
  assert.equal(new Set(encounters.map(encounter => encounter.id)).size, 14);
  for (const module of modules) verifyTree(module.encounter, 3);
  for (const village of villages) verifyTree(village.boss, 5);
  assert.equal(villageById('signals').boss.kind, 'hydra');
  assert.equal(villageById('scale').boss.kind, 'titan');
  assert.match(villageById('departure').boss.name, /Twitter/);
  assert.equal(villageById('departure').boss.timeLimitSeconds, 480);
  assert.equal(moduleById('intro').encounter.name, 'Sương Mù Học Thuộc');
});

test('metrics teach real tradeoffs instead of rewarding every dimension', () => {
  const cache = moduleById('caching').encounter;
  const hit = cache.nodes.find(node => node.id === cache.start)!.choices.find(choice => choice.correct)!;
  assert.ok(hit.effects.latency! < 0 && hit.effects.throughput! > 0 && hit.effects.complexity! > 0);
  const cap = moduleById('cap').encounter;
  const preserve = cap.nodes.find(node => node.id === cap.start)!.choices.find(choice => choice.correct)!;
  assert.ok(preserve.effects.consistency! > 0 && preserve.effects.availability! < 0);
  const wrong = cap.nodes.find(node => node.id === cap.start)!.choices.find(choice => !choice.correct)!;
  assert.ok(wrong.effects.consistency! < 0 && wrong.effects.availability! > 0);
});

test('repeated mistakes remain actionable and recovery does not reset accumulated scores', () => {
  const encounter = moduleById('api').encounter;
  const first = encounter.nodes.find(node => node.id === encounter.start)!;
  const bad1 = first.choices.find(choice => !choice.correct)!;
  const second = encounter.nodes.find(node => node.id === bad1.next)!;
  const bad2 = second.choices.find(choice => !choice.correct)!;
  const third = encounter.nodes.find(node => node.id === bad2.next)!;
  assert.ok(third.context.includes(bad1.feedback) && third.context.includes(bad2.feedback));
  const recovery = third.choices.find(choice => choice.correct)!;
  assert.match(recovery.label, /gắn lại danh tính/);
  assert.match(recovery.label, /khóa chống lặp/);
  assert.match(recovery.feedback, /không được hoàn lại/);
  assert.equal(recovery.next, null);
  assert.notDeepEqual(encounter.initial, Object.fromEntries(keys.map(key => [key, encounter.initial[key] + (bad1.effects[key] ?? 0) + (bad2.effects[key] ?? 0)])));
});
